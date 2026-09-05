import { api } from "@/lib/api";
import { COLORS } from "@/styles/appStyles";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs, { type Dayjs } from "dayjs";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Body, { type ExtendedBodyPart } from "react-native-body-highlighter";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Ellipse } from "react-native-svg";

// One hue (the app's accent yellow) at two opacities — a lighter tone for
// 1 session this week, full strength for 2+ — so the diagram reads as a
// single calm highlight instead of competing with anything else on the
// page. Untrained muscles sit just a shade above the background so only
// what's actually been trained pulls the eye.
const HIT_COLORS = ["rgba(255,214,31,0.45)", COLORS.accent];
const UNHIT_FILL = "#1C1D22";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

// Maps muscle_groups.name -> this library's body-part slugs.
// Adjust the keys on the left to match what's actually in your table.
const MUSCLE_GROUP_TO_SLUG: Record<string, string[]> = {
  Chest: ["chest"],
  Back: ["upper-back", "lower-back"],
  Lats: ["upper-back"],
  "Upper Back": ["upper-back", "trapezius"],
  "Lower Back": ["lower-back"],
  Shoulders: ["deltoids"],
  Traps: ["trapezius"],
  Biceps: ["biceps"],
  Triceps: ["triceps"],
  Forearms: ["forearm"],
  Abs: ["abs", "obliques"],
  Core: ["abs", "obliques"],
  Quads: ["quadriceps"],
  Quadriceps: ["quadriceps"],
  Hamstrings: ["hamstring"],
  Glutes: ["gluteal"],
  Calves: ["calves"],
};

// react-native-body-highlighter draws its own head/hair as one detailed
// illustrated shape, which reads oddly next to the plain muscle silhouette.
// We hide that shape (`hiddenParts`) and draw a single soft oval over the
// same spot instead. These numbers describe where the head sits inside the
// library's fixed 724-unit-wide body artwork (front and back happen to
// place it in almost the same spot), measured directly from its SVG paths.
const BODY_SCALE = 1.4;
const BODY_RENDER_WIDTH_UNSCALED = 200;
const BODY_RENDER_HEIGHT_UNSCALED = 400;
const BODY_VIEWBOX_HALF_WIDTH = 724;
const HEAD_CENTER_X = 362;
const HEAD_CENTER_Y = 172;
const HEAD_RADIUS_X = 64;
const HEAD_RADIUS_Y = 82;

function SimpleHeadOutline({ scale }: { scale: number }) {
  const factor = (BODY_RENDER_WIDTH_UNSCALED * scale) / BODY_VIEWBOX_HALF_WIDTH;
  return (
    <Svg
      width={BODY_RENDER_WIDTH_UNSCALED * scale}
      height={BODY_RENDER_HEIGHT_UNSCALED * scale}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Ellipse
        cx={HEAD_CENTER_X * factor}
        cy={HEAD_CENTER_Y * factor}
        rx={HEAD_RADIUS_X * factor}
        ry={HEAD_RADIUS_Y * factor}
        fill={UNHIT_FILL}
        stroke={COLORS.textFaint}
        strokeWidth={1.5}
      />
    </Svg>
  );
}

type WeeklyMuscleHit = {
  muscleGroupName: string;
  timesHit: number;
};

// One entry per day in the selected week (Mon -> Sun).
type DailyActivity = {
  date: string; // ISO "YYYY-MM-DD"
  trained: boolean;
  workoutCount: number;
};

type WeeklyStats = {
  totalWorkouts: number;
  totalSets: number;
  totalExercises: number;
  daysTrained: number;
  // Optional: cross-week running streak as of today. Only meaningful for
  // the current week — if your API doesn't compute this yet, the UI falls
  // back to a same-week trailing streak derived from dailyActivity.
  currentStreak?: number;
  // Optional: sum of weight * reps across the week, if you're tracking reps.
  totalVolume?: number;
};

type WeeklySummaryResponse = {
  muscleHits: WeeklyMuscleHit[];
  stats: WeeklyStats;
  dailyActivity: DailyActivity[];
};

// Monday -> Sunday bounds for the week `weekOffset` weeks from the current
// one (0 = this week, -1 = last week, ...).
function getWeekBounds(weekOffset: number) {
  const anchor = dayjs().add(weekOffset, "week");
  const dow = anchor.day(); // 0 (Sun) .. 6 (Sat)
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const start = anchor.add(diffToMonday, "day").startOf("day");
  const end = start.add(6, "day").endOf("day");
  return { start, end };
}

function formatWeekRange(start: Dayjs, end: Dayjs) {
  const sameMonth = start.month() === end.month();
  const startFmt = start.format("MMM D");
  const endFmt = end.format(sameMonth ? "D" : "MMM D");
  return `${startFmt} – ${endFmt}`;
}

// Longest run of consecutive trained days anywhere in the given range.
function computeLongestStreak(days: DailyActivity[]): number {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    if (day.trained) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

// Consecutive trained days ending on the most recent non-future day —
// the fallback for "current streak" when the backend doesn't send one.
function computeTrailingStreak(days: DailyActivity[]): number {
  const today = dayjs();
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const day = days[i];
    if (dayjs(day.date).isAfter(today, "day")) continue;
    if (day.trained) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function useWeeklyMuscleHits(weekOffset: number) {
  const [data, setData] = useState<WeeklyMuscleHit[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { start, end } = getWeekBounds(weekOffset);
      const res = await api.get<WeeklySummaryResponse>(
        "/workouts/muscle-summary",
        {
          params: {
            start: start.format("YYYY-MM-DD"),
            end: end.format("YYYY-MM-DD"),
          },
        },
      );
      const json = res.data;
      setData(json.muscleHits);
      setStats(json.stats);
      setDailyActivity(json.dailyActivity ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't load this week's data",
      );
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, stats, dailyActivity, loading, error, refetch: fetchData };
}

// Plain icon touch target — no fill, no border, no glass backdrop. Opacity
// dips on press/disabled instead of a button "chrome" so icons read as part
// of the page rather than as boxed controls.
function IconButton({
  icon,
  onPress,
  disabled,
  color = COLORS.text,
  size = 20,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      style={({ pressed }) => (pressed || disabled) && styles.iconButtonDimmed}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

export default function MuscleMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [weekOffset, setWeekOffset] = useState(0);
  const { data, stats, dailyActivity, loading, error, refetch } =
    useWeeklyMuscleHits(weekOffset);
  const [side, setSide] = useState<"front" | "back">("front");

  const isCurrentWeek = weekOffset === 0;
  const weekBounds = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);
  const weekLabel = isCurrentWeek
    ? "This Week"
    : weekOffset === -1
      ? "Last Week"
      : formatWeekRange(weekBounds.start, weekBounds.end);
  const weekRangeText = formatWeekRange(weekBounds.start, weekBounds.end);

  const bodyData = useMemo(() => {
    const parts: ExtendedBodyPart[] = [];
    for (const hit of data) {
      const slugs = MUSCLE_GROUP_TO_SLUG[hit.muscleGroupName];
      if (!slugs) continue;
      const intensity = hit.timesHit >= 2 ? 2 : 1;
      for (const slug of slugs) {
        parts.push({ slug, intensity } as ExtendedBodyPart);
      }
    }
    return parts;
  }, [data]);

  const mostTrained = useMemo(() => {
    if (data.length === 0) return null;
    return data.reduce((max, curr) =>
      curr.timesHit > max.timesHit ? curr : max,
    );
  }, [data]);

  // Current week -> live cross-week streak (from backend, or a same-week
  // fallback). Past weeks -> that week's best run, since "current" streak
  // doesn't mean much once you're looking at history.
  const streakValue = useMemo(() => {
    if (isCurrentWeek) {
      return stats?.currentStreak ?? computeTrailingStreak(dailyActivity);
    }
    return computeLongestStreak(dailyActivity);
  }, [isCurrentWeek, stats?.currentStreak, dailyActivity]);

  // Don't count days that haven't happened yet as rest days.
  const restDays = useMemo(() => {
    if (!stats) return 0;
    const daysElapsed = isCurrentWeek
      ? Math.min(7, dayjs().diff(weekBounds.start, "day") + 1)
      : 7;
    return Math.max(0, daysElapsed - stats.daysTrained);
  }, [stats, isCurrentWeek, weekBounds.start]);

  const avgSetsPerWorkout = useMemo(() => {
    if (!stats || stats.totalWorkouts === 0) return "0";
    return (stats.totalSets / stats.totalWorkouts).toFixed(1);
  }, [stats]);

  const goToPreviousWeek = () => setWeekOffset((prev) => prev - 1);
  const goToNextWeek = () => setWeekOffset((prev) => Math.min(0, prev + 1));

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <IconButton
              icon="chevron-down"
              size={22}
              onPress={() => router.back()}
            />
            <IconButton
              icon="refresh-outline"
              onPress={refetch}
              disabled={loading}
            />
          </View>

          <View style={styles.header}>
            <IconButton
              icon="chevron-back"
              onPress={goToPreviousWeek}
              disabled={loading}
            />
            <View style={styles.headerTitleBlock}>
              <Text style={styles.eyebrow}>Muscle Map</Text>
              <Text style={styles.dateText}>{weekLabel}</Text>
              {weekLabel !== weekRangeText && (
                <Text style={styles.weekRangeCaption}>{weekRangeText}</Text>
              )}
            </View>
            <IconButton
              icon="chevron-forward"
              onPress={goToNextWeek}
              disabled={loading || isCurrentWeek}
            />
          </View>

          {/* Subtitle and streak used to be two separate rows; combined so
              the header settles into a single line instead of stacking. */}
          {!loading && !error && (
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {data.length > 0
                  ? `${data.length} muscle group${data.length === 1 ? "" : "s"} trained ${isCurrentWeek ? "this week" : "that week"}`
                  : `Nothing logged ${isCurrentWeek ? "yet this week" : "that week"}`}
              </Text>
              {streakValue > 0 && (
                <View style={styles.streakInline}>
                  <Ionicons name="flame" size={13} color={COLORS.accent} />
                  <Text style={styles.streakInlineText}>
                    {streakValue} day{streakValue === 1 ? "" : "s"}
                  </Text>
                </View>
              )}
            </View>
          )}

          {!loading && !error && dailyActivity.length > 0 && (
            <View style={styles.dayStripRow}>
              {dailyActivity.map((day, index) => {
                const isFuture = dayjs(day.date).isAfter(dayjs(), "day");
                const isToday = dayjs(day.date).isSame(dayjs(), "day");
                return (
                  <View key={day.date} style={styles.dayPill}>
                    <View
                      style={[
                        styles.dayDot,
                        day.trained && styles.dayDotTrained,
                        isFuture && styles.dayDotFuture,
                        isToday && styles.dayDotToday,
                      ]}
                    />
                    <Text style={styles.dayLabel}>{DAY_LABELS[index]}</Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.sideToggleRow}>
            <Pressable onPress={() => setSide("front")} hitSlop={8}>
              <Text
                style={[
                  styles.sideToggleText,
                  side === "front" && styles.sideToggleTextActive,
                ]}
              >
                Front
              </Text>
            </Pressable>
            <Text style={styles.sideToggleDivider}>·</Text>
            <Pressable onPress={() => setSide("back")} hitSlop={8}>
              <Text
                style={[
                  styles.sideToggleText,
                  side === "back" && styles.sideToggleTextActive,
                ]}
              >
                Back
              </Text>
            </Pressable>
          </View>

          <View style={styles.diagramCard}>
            {loading ? (
              <ActivityIndicator color={COLORS.accent} size="large" />
            ) : error ? (
              <View style={styles.errorState}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable onPress={refetch} hitSlop={8}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <View
                style={{
                  width: BODY_RENDER_WIDTH_UNSCALED * BODY_SCALE,
                  height: BODY_RENDER_HEIGHT_UNSCALED * BODY_SCALE,
                }}
              >
                <Body
                  data={bodyData}
                  side={side}
                  gender="male"
                  scale={BODY_SCALE}
                  colors={HIT_COLORS}
                  defaultFill={UNHIT_FILL}
                  border="none"
                  hiddenParts={["head", "hair"]}
                />
                <SimpleHeadOutline scale={BODY_SCALE} />
              </View>
            )}
          </View>

          {stats && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionLabel}>
                {isCurrentWeek ? "This Week" : weekRangeText}
              </Text>

              {/* Just the headline numbers up front — everything else reads
                  as a single caption line below instead of its own card. */}
              <View style={styles.statsPrimaryRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
                  <Text style={styles.statLabel}>Workouts</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.daysTrained}/7</Text>
                  <Text style={styles.statLabel}>Days trained</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.totalSets}</Text>
                  <Text style={styles.statLabel}>Sets</Text>
                </View>
              </View>

              <Text style={styles.statsSecondaryLine}>
                {restDays} rest day{restDays === 1 ? "" : "s"} ·{" "}
                {avgSetsPerWorkout} sets/workout · {stats.totalExercises}{" "}
                exercise{stats.totalExercises === 1 ? "" : "s"}
                {typeof stats.totalVolume === "number"
                  ? ` · ${stats.totalVolume.toLocaleString()} lbs`
                  : ""}
              </Text>

              {mostTrained && (
                <Text style={styles.mostTrainedLine}>
                  Most trained:{" "}
                  <Text style={styles.mostTrainedValue}>
                    {mostTrained.muscleGroupName}
                  </Text>
                </Text>
              )}
            </View>
          )}

          {data.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {data.map((hit) => (
                <View key={hit.muscleGroupName} style={styles.chip}>
                  <Text style={styles.chipText}>{hit.muscleGroupName}</Text>
                  <Text style={styles.chipCount}>{hit.timesHit}×</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  iconButtonDimmed: { opacity: 0.4 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 6,
  },
  headerTitleBlock: { flex: 1, alignItems: "center" },
  eyebrow: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
    textAlign: "center",
  },
  dateText: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  weekRangeCaption: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  metaText: { color: COLORS.textMuted, fontSize: 13, textAlign: "center" },
  streakInline: { flexDirection: "row", alignItems: "center", gap: 4 },
  streakInlineText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  dayStripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    marginTop: 16,
  },
  dayPill: { alignItems: "center", gap: 6 },
  dayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textFaint,
    opacity: 0.35,
  },
  dayDotTrained: { backgroundColor: COLORS.accent, opacity: 1 },
  dayDotFuture: { opacity: 0.12 },
  dayDotToday: { width: 8, height: 8, borderRadius: 4 },
  dayLabel: { color: COLORS.textFaint, fontSize: 11 },
  sideToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 10,
    marginTop: 14,
  },
  sideToggleText: {
    color: COLORS.textFaint,
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  sideToggleTextActive: { color: COLORS.text },
  sideToggleDivider: { color: COLORS.textFaint, fontSize: 13 },
  diagramCard: {
    marginHorizontal: 20,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 380,
    overflow: "hidden",
  },
  errorState: { alignItems: "center", gap: 10, padding: 24 },
  errorText: { color: COLORS.textMuted, textAlign: "center" },
  retryText: { color: COLORS.accent, fontSize: 14, fontWeight: "700" },
  statsSection: { marginTop: 22, paddingHorizontal: 20 },
  sectionLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 12,
  },
  statsPrimaryRow: { flexDirection: "row" },
  statCard: {
    width: "33.33%",
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
  },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: "700" },
  statLabel: { color: COLORS.textFaint, fontSize: 11, textAlign: "center" },
  statsSecondaryLine: {
    color: COLORS.textFaint,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  mostTrainedLine: {
    color: COLORS.textFaint,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
  mostTrainedValue: { color: COLORS.accent, fontWeight: "700" },
  chipRow: { paddingHorizontal: 20, paddingVertical: 10, gap: 22 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4 },
  chipText: { color: COLORS.textMuted, fontSize: 13, fontWeight: "500" },
  chipCount: { color: COLORS.accent, fontSize: 13, fontWeight: "700" },
});
