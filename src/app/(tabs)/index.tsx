import { api } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import dayjs, { type Dayjs } from "dayjs";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  bg: "#141518",
  text: "#F5F6F7",
  textFaint: "#565A60",
  textMuted: "rgba(255,255,255,0.5)",
  accent: "#ffd61f",
  surface: "rgba(255,255,255,0.045)",
  surfaceBorder: "rgba(255,255,255,0.09)",
};

// Light red for 1 session this week, deep red for 2+ — still reads as
// "trained = red" but lets you spot under/over-trained groups at a glance.
const HIT_COLORS = ["#F87171", "#DC2626"];
const UNHIT_FILL = "#2B2D33";

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

export default function MuscleMapScreen() {
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
  const streakLabel = isCurrentWeek
    ? "Current streak"
    : "Best streak that week";

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
      <View style={styles.root}>
        <LinearGradient
          colors={["#1b1d23", COLORS.bg]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Muscle Map</Text>
              <Text style={styles.subtitle}>
                {data.length > 0
                  ? `${data.length} muscle group${data.length === 1 ? "" : "s"} trained ${isCurrentWeek ? "this week" : "that week"}`
                  : `Nothing logged ${isCurrentWeek ? "yet this week" : "that week"}`}
              </Text>
            </View>

            <View style={styles.weekNavRow}>
              <Pressable
                onPress={goToPreviousWeek}
                disabled={loading}
                style={({ pressed }) => [
                  styles.weekNavButton,
                  (loading || pressed) && styles.weekNavButtonPressed,
                ]}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={18} color={COLORS.text} />
              </Pressable>

              <View style={styles.weekLabelContainer}>
                <Text style={styles.weekLabelText}>{weekLabel}</Text>
                {weekLabel !== weekRangeText && (
                  <Text style={styles.weekRangeText}>{weekRangeText}</Text>
                )}
              </View>

              <Pressable
                onPress={goToNextWeek}
                disabled={loading || isCurrentWeek}
                style={({ pressed }) => [
                  styles.weekNavButton,
                  (loading || isCurrentWeek || pressed) &&
                    styles.weekNavButtonPressed,
                  isCurrentWeek && styles.weekNavButtonDisabled,
                ]}
                hitSlop={8}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={isCurrentWeek ? COLORS.textFaint : COLORS.text}
                />
              </Pressable>
            </View>

            {!loading && !error && stats && (
              <View style={styles.streakBanner}>
                <View style={styles.streakIconWrap}>
                  <Ionicons name="flame" size={20} color={COLORS.accent} />
                </View>
                <View style={styles.streakTextWrap}>
                  <Text style={styles.streakValue}>
                    {streakValue} day{streakValue === 1 ? "" : "s"}
                  </Text>
                  <Text style={styles.streakLabel}>{streakLabel}</Text>
                </View>
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

            <View style={styles.toggleRow}>
              {(["front", "back"] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setSide(option)}
                  style={[
                    styles.toggleButton,
                    side === option && styles.toggleButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      side === option && styles.toggleTextActive,
                    ]}
                  >
                    {option === "front" ? "Front" : "Back"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <BlurView intensity={20} tint="dark" style={styles.diagramCard}>
              {loading ? (
                <ActivityIndicator color={COLORS.accent} size="large" />
              ) : error ? (
                <View style={styles.errorState}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable onPress={refetch} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                </View>
              ) : (
                <Body
                  data={bodyData}
                  side={side}
                  gender="male"
                  scale={1.4}
                  colors={HIT_COLORS}
                  defaultFill={UNHIT_FILL}
                  border="none"
                />
              )}
            </BlurView>

            {stats && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionLabel}>
                  {isCurrentWeek ? "This Week" : weekRangeText}
                </Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
                    <Text style={styles.statLabel}>Workouts</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.daysTrained}/7</Text>
                    <Text style={styles.statLabel}>Days trained</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{restDays}</Text>
                    <Text style={styles.statLabel}>Rest days</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalSets}</Text>
                    <Text style={styles.statLabel}>Sets</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{avgSetsPerWorkout}</Text>
                    <Text style={styles.statLabel}>Avg sets/workout</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalExercises}</Text>
                    <Text style={styles.statLabel}>Exercises</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{data.length}</Text>
                    <Text style={styles.statLabel}>Muscle groups</Text>
                  </View>
                  {typeof stats.totalVolume === "number" && (
                    <View style={styles.statCard}>
                      <Text style={styles.statValue}>
                        {stats.totalVolume.toLocaleString()}
                      </Text>
                      <Text style={styles.statLabel}>Volume (lbs)</Text>
                    </View>
                  )}
                  <View style={styles.statCard}>
                    <Text
                      style={[styles.statValue, styles.statValueAccent]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {mostTrained ? mostTrained.muscleGroupName : "—"}
                    </Text>
                    <Text style={styles.statLabel}>Most trained</Text>
                  </View>
                </View>
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
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "700" },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  weekNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 16,
  },
  weekNavButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  weekNavButtonPressed: { opacity: 0.5 },
  weekNavButtonDisabled: { opacity: 0.3 },
  weekLabelContainer: { alignItems: "center" },
  weekLabelText: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  weekRangeText: {
    color: COLORS.textFaint,
    fontSize: 12,
    marginTop: 2,
  },
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  streakIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,214,31,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  streakTextWrap: { flex: 1 },
  streakValue: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  streakLabel: { color: COLORS.textFaint, fontSize: 12, marginTop: 1 },
  dayStripRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 32,
    marginTop: 14,
  },
  dayPill: { alignItems: "center", gap: 6 },
  dayDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: UNHIT_FILL,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  dayDotTrained: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  dayDotFuture: { backgroundColor: "transparent", borderStyle: "dashed" },
  dayDotToday: { borderColor: COLORS.text, borderWidth: 1.5 },
  dayLabel: { color: COLORS.textFaint, fontSize: 11 },
  toggleRow: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 4,
    gap: 4,
  },
  toggleButton: { paddingVertical: 8, paddingHorizontal: 24, borderRadius: 9 },
  toggleButtonActive: { backgroundColor: COLORS.accent },
  toggleText: { color: COLORS.textFaint, fontSize: 14, fontWeight: "600" },
  toggleTextActive: { color: COLORS.bg },
  diagramCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 380,
    overflow: "hidden",
  },
  errorState: { alignItems: "center", gap: 12, padding: 24 },
  errorText: { color: COLORS.textMuted, textAlign: "center" },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
  },
  retryText: { color: COLORS.bg, fontWeight: "700" },
  statsSection: { marginTop: 20, paddingHorizontal: 20 },
  sectionLabel: {
    color: COLORS.textFaint,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flexBasis: "31%",
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
  },
  statValue: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  statValueAccent: { color: COLORS.accent, fontSize: 16 },
  statLabel: { color: COLORS.textFaint, fontSize: 11, textAlign: "center" },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: COLORS.textFaint, fontSize: 12 },
  chipRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: { color: COLORS.text, fontSize: 13, fontWeight: "500" },
  chipCount: { color: COLORS.accent, fontSize: 13, fontWeight: "700" },
});
