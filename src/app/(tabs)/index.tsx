import { api } from "@/lib/api";
import { COLORS } from "@/styles/appStyles";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs, { type Dayjs } from "dayjs";
import { Stack } from "expo-router";
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

/**
 * Muscle map redesign
 * -------------------
 * The data/API layer is intentionally kept compatible with the existing page.
 * Palette and layout now follow the reference screenshot: a red / gold / gray
 * primary–secondary–untargeted scheme, with front and back shown together
 * instead of behind a toggle, and a two-row legend beneath both figures.
 *
 * Note on semantics: the API only gives us session counts (`timesHit`), not
 * a true per-exercise "this muscle was the primary mover" flag. So "primary"
 * here means 2+ sessions this week and "secondary" means 1 — the same
 * tiering the page already used, just recolored to match the reference. If
 * the backend ever starts sending real primary/secondary attribution per
 * exercise, swap that in for `intensityForRegion` below.
 */

const PRIMARY_COLOR = "#D14B42"; // red — primary tier (2+ sessions this week)
const SECONDARY_COLOR = "#E3A93D"; // gold — secondary tier (1 session)
const BODY_BASE = "#8E9298"; // untargeted muscles / neutral figure fill
const BODY_FACET = "#777B82";
const GRID = "#4B4F55";

type MuscleSide = "front" | "back";

type WeeklyMuscleHit = {
  muscleGroupName: string;
  timesHit: number;
};

type DailyActivity = {
  date: string;
  trained: boolean;
  workoutCount: number;
};

type WeeklyStats = {
  totalWorkouts: number;
  totalSets: number;
  totalExercises: number;
  daysTrained: number;
  currentStreak?: number;
  totalVolume?: number;
  personalRecords?: number;
};

type WeeklySummaryResponse = {
  muscleHits: WeeklyMuscleHit[];
  stats: WeeklyStats;
  dailyActivity: DailyActivity[];
};

function getWeekBounds(weekOffset: number) {
  const anchor = dayjs().add(weekOffset, "week");
  const dow = anchor.day();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const start = anchor.add(diffToMonday, "day").startOf("day");
  const end = start.add(6, "day").endOf("day");
  return { start, end };
}

function formatWeekRange(start: Dayjs, end: Dayjs) {
  const sameMonth = start.month() === end.month();
  return `${start.format("MMM D")} – ${end.format(sameMonth ? "D" : "MMM D")}`;
}

function computeLongestStreak(days: DailyActivity[]) {
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

function computeTrailingStreak(days: DailyActivity[]) {
  let streak = 0;

  for (let i = days.length - 1; i >= 0; i -= 1) {
    const day = days[i];
    if (dayjs(day.date).isAfter(dayjs(), "day")) continue;

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

      setData(res.data.muscleHits ?? []);
      setStats(res.data.stats ?? null);
      setDailyActivity(res.data.dailyActivity ?? []);
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

/**
 * Body geometry is split into individually highlightable muscle regions so
 * the map can preserve anatomical boundaries while reflecting API activity.
 */
type MuscleRegion = {
  id: string;
  label: string;
  d: string;
  side?: MuscleSide;
};

const FRONT_MUSCLES: MuscleRegion[] = [
  {
    id: "front-shoulder-l",
    label: "Shoulders",
    d: "M84 76 C75 72 65 72 58 78 C53 83 53 91 58 97 C64 100 70 96 76 91 L86 84 Z",
  },
  {
    id: "front-shoulder-r",
    label: "Shoulders",
    d: "M116 76 C125 72 135 72 142 78 C147 83 147 91 142 97 C136 100 130 96 124 91 L114 84 Z",
  },
  {
    id: "front-pec-l",
    label: "Chest",
    d: "M87 79 C78 77 70 79 65 84 C68 94 77 103 98 105 L98 84 C94 82 91 80 87 79 Z",
  },
  {
    id: "front-pec-r",
    label: "Chest",
    d: "M113 79 C122 77 130 79 135 84 C132 94 123 103 102 105 L102 84 C106 82 109 80 113 79 Z",
  },
  {
    id: "front-bicep-l",
    label: "Biceps",
    d: "M58 96 C51 98 47 105 47 115 C47 126 51 134 57 138 C63 133 66 123 64 112 C63 105 62 100 58 96 Z",
  },
  {
    id: "front-bicep-r",
    label: "Biceps",
    d: "M142 96 C149 98 153 105 153 115 C153 126 149 134 143 138 C137 133 134 123 136 112 C137 105 138 100 142 96 Z",
  },
  {
    id: "front-forearm-l",
    label: "Forearms",
    d: "M50 134 C46 143 41 155 38 169 C36 178 38 184 43 188 C49 181 54 168 58 153 L59 138 Z",
  },
  {
    id: "front-forearm-r",
    label: "Forearms",
    d: "M150 134 C154 143 159 155 162 169 C164 178 162 184 157 188 C151 181 146 168 142 153 L141 138 Z",
  },
  {
    id: "front-abs-l1",
    label: "Abs",
    d: "M85 106 C89 108 94 108 98 107 L98 123 C94 125 89 125 85 123 Z",
  },
  {
    id: "front-abs-r1",
    label: "Abs",
    d: "M115 106 C111 108 106 108 102 107 L102 123 C106 125 111 125 115 123 Z",
  },
  {
    id: "front-abs-l2",
    label: "Abs",
    d: "M85 126 C89 128 94 128 98 127 L98 143 C94 145 89 145 85 143 Z",
  },
  {
    id: "front-abs-r2",
    label: "Abs",
    d: "M115 126 C111 128 106 128 102 127 L102 143 C106 145 111 145 115 143 Z",
  },
  {
    id: "front-abs-l3",
    label: "Abs",
    d: "M86 146 C90 148 94 148 98 147 L98 161 C94 163 90 163 86 160 Z",
  },
  {
    id: "front-abs-r3",
    label: "Abs",
    d: "M114 146 C110 148 106 148 102 147 L102 161 C106 163 110 163 114 160 Z",
  },
  {
    id: "front-oblique-l",
    label: "Obliques",
    d: "M68 100 C76 105 82 114 83 127 L81 151 C76 149 70 144 66 136 L63 119 Z",
  },
  {
    id: "front-oblique-r",
    label: "Obliques",
    d: "M132 100 C124 105 118 114 117 127 L119 151 C124 149 130 144 134 136 L137 119 Z",
  },
  {
    id: "front-quad-l",
    label: "Quads",
    d: "M69 159 C78 158 89 161 98 166 L96 207 C92 219 85 226 75 226 C69 220 66 207 66 190 C66 177 67 167 69 159 Z",
  },
  {
    id: "front-quad-r",
    label: "Quads",
    d: "M131 159 C122 158 111 161 102 166 L104 207 C108 219 115 226 125 226 C131 220 134 207 134 190 C134 177 133 167 131 159 Z",
  },
  {
    id: "front-knee-l",
    label: "Knees",
    d: "M72 224 C79 222 87 223 93 227 C92 237 89 243 83 246 C77 246 73 243 71 239 Z",
  },
  {
    id: "front-knee-r",
    label: "Knees",
    d: "M128 224 C121 222 113 223 107 227 C108 237 111 243 117 246 C123 246 127 243 129 239 Z",
  },
  {
    id: "front-calf-l",
    label: "Calves",
    d: "M73 245 C79 248 85 247 90 244 C92 261 90 282 85 300 C81 308 75 309 71 301 C68 284 68 262 73 245 Z",
  },
  {
    id: "front-calf-r",
    label: "Calves",
    d: "M127 245 C121 248 115 247 110 244 C108 261 110 282 115 300 C119 308 125 309 129 301 C132 284 132 262 127 245 Z",
  },
];

const BACK_MUSCLES: MuscleRegion[] = [
  {
    id: "back-rear-delt-l",
    label: "Shoulders",
    d: "M84 76 C75 72 65 72 58 78 C53 83 53 91 58 97 C64 100 70 96 76 91 L86 84 Z",
  },
  {
    id: "back-rear-delt-r",
    label: "Shoulders",
    d: "M116 76 C125 72 135 72 142 78 C147 83 147 91 142 97 C136 100 130 96 124 91 L114 84 Z",
  },
  {
    id: "back-trap-l",
    label: "Traps",
    d: "M84 68 C89 65 95 63 100 62 L100 104 C94 101 87 98 81 92 L76 78 Z",
  },
  {
    id: "back-trap-r",
    label: "Traps",
    d: "M116 68 C111 65 105 63 100 62 L100 104 C106 101 113 98 119 92 L124 78 Z",
  },
  {
    id: "back-lat-l",
    label: "Lats",
    d: "M78 91 C86 98 93 101 98 104 L96 151 C89 158 78 158 68 150 C64 141 63 128 65 116 L69 101 Z",
  },
  {
    id: "back-lat-r",
    label: "Lats",
    d: "M122 91 C114 98 107 101 102 104 L104 151 C111 158 122 158 132 150 C136 141 137 128 135 116 L131 101 Z",
  },
  {
    id: "back-tricep-l",
    label: "Triceps",
    d: "M58 96 C51 98 47 105 47 115 C47 126 51 134 57 138 C63 133 66 123 64 112 C63 105 62 100 58 96 Z",
  },
  {
    id: "back-tricep-r",
    label: "Triceps",
    d: "M142 96 C149 98 153 105 153 115 C153 126 149 134 143 138 C137 133 134 123 136 112 C137 105 138 100 142 96 Z",
  },
  {
    id: "back-forearm-l",
    label: "Forearms",
    d: "M50 134 C46 143 41 155 38 169 C36 178 38 184 43 188 C49 181 54 168 58 153 L59 138 Z",
  },
  {
    id: "back-forearm-r",
    label: "Forearms",
    d: "M150 134 C154 143 159 155 162 169 C164 178 162 184 157 188 C151 181 146 168 142 153 L141 138 Z",
  },
  {
    id: "back-lower-l",
    label: "Lower Back",
    d: "M82 102 C88 106 94 108 98 107 L98 151 C93 155 87 156 81 152 L77 127 Z",
  },
  {
    id: "back-lower-r",
    label: "Lower Back",
    d: "M118 102 C112 106 106 108 102 107 L102 151 C107 155 113 156 119 152 L123 127 Z",
  },
  {
    id: "back-glute-l",
    label: "Glutes",
    d: "M67 151 C76 146 88 149 98 154 L96 184 C88 192 77 193 68 185 C64 175 64 162 67 151 Z",
  },
  {
    id: "back-glute-r",
    label: "Glutes",
    d: "M133 151 C124 146 112 149 102 154 L104 184 C112 192 123 193 132 185 C136 175 136 162 133 151 Z",
  },
  {
    id: "back-ham-l",
    label: "Hamstrings",
    d: "M69 185 C77 190 87 189 96 183 L94 222 C88 230 78 232 70 225 C66 213 65 198 69 185 Z",
  },
  {
    id: "back-ham-r",
    label: "Hamstrings",
    d: "M131 185 C123 190 113 189 104 183 L106 222 C112 230 122 232 130 225 C134 213 135 198 131 185 Z",
  },
  {
    id: "back-knee-l",
    label: "Knees",
    d: "M72 224 C79 222 87 223 93 227 C92 237 89 243 83 246 C77 246 73 243 71 239 Z",
  },
  {
    id: "back-knee-r",
    label: "Knees",
    d: "M128 224 C121 222 113 223 107 227 C108 237 111 243 117 246 C123 246 127 243 129 239 Z",
  },
  {
    id: "back-calf-l",
    label: "Calves",
    d: "M73 245 C79 248 85 247 90 244 C92 261 90 282 85 300 C81 308 75 309 71 301 C68 284 68 262 73 245 Z",
  },
  {
    id: "back-calf-r",
    label: "Calves",
    d: "M127 245 C121 248 115 247 110 244 C108 261 110 282 115 300 C119 308 125 309 129 301 C132 284 132 262 127 245 Z",
  },
];

function normalizeGroup(name: string) {
  const value = name.trim().toLowerCase();

  if (["chest", "pecs", "pectorals"].includes(value)) return "Chest";
  if (["back", "upper back"].includes(value)) return "Back";
  if (value === "lats") return "Lats";
  if (value === "lower back") return "Lower Back";
  if (value === "traps") return "Traps";
  if (["shoulders", "delts", "rear delts"].includes(value)) return "Shoulders";
  if (value === "biceps") return "Biceps";
  if (value === "triceps") return "Triceps";
  if (value === "forearms") return "Forearms";
  if (["abs", "core"].includes(value)) return "Abs";
  if (value === "obliques") return "Obliques";
  if (["quads", "quadriceps"].includes(value)) return "Quads";
  if (value === "hamstrings") return "Hamstrings";
  if (value === "glutes") return "Glutes";
  if (value === "calves") return "Calves";
  if (value === "knees") return "Knees";

  return name;
}

function regionMatchesHit(label: string, hitName: string) {
  const region = normalizeGroup(label);
  const hit = normalizeGroup(hitName);

  if (region === hit) return true;
  if (hit === "Back" && ["Lats", "Traps", "Lower Back"].includes(region))
    return true;
  if (hit === "Abs" && region === "Obliques") return true;
  if (hit === "Shoulders" && region === "Shoulders") return true;

  return false;
}

function intensityForRegion(label: string, data: WeeklyMuscleHit[]): 0 | 1 | 2 {
  const hits = data
    .filter((item) => regionMatchesHit(label, item.muscleGroupName))
    .reduce((max, item) => Math.max(max, item.timesHit), 0);

  if (hits >= 2) return 2;
  if (hits === 1) return 1;
  return 0;
}

function fillForIntensity(intensity: 0 | 1 | 2) {
  if (intensity === 2) return PRIMARY_COLOR;
  if (intensity === 1) return SECONDARY_COLOR;
  return BODY_BASE;
}

const BODY_PART_SLUGS: Record<string, ExtendedBodyPart["slug"]> = {
  shoulders: "deltoids",
  chest: "chest",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearm",
  abs: "abs",
  obliques: "obliques",
  quads: "quadriceps",
  hamstrings: "hamstring",
  glutes: "gluteal",
  calves: "calves",
  back: "upper-back",
  lats: "upper-back",
  traps: "trapezius",
  "lower back": "lower-back",
};

function bodyMapData(data: WeeklyMuscleHit[]): ExtendedBodyPart[] {
  return data.flatMap((hit) => {
    const slug =
      BODY_PART_SLUGS[normalizeGroup(hit.muscleGroupName).toLowerCase()];
    if (!slug) return [];

    return [
      {
        slug,
        color: hit.timesHit >= 2 ? PRIMARY_COLOR : SECONDARY_COLOR,
        intensity: hit.timesHit >= 2 ? 2 : 1,
      },
    ];
  });
}

function AnatomicalMap({
  side,
  data,
}: {
  side: MuscleSide;
  data: WeeklyMuscleHit[];
}) {
  return (
    <Body
      data={bodyMapData(data)}
      side={side}
      gender="male"
      scale={1.4}
      defaultFill={BODY_BASE}
      hiddenParts={["head", "hair"]}
      border="none"
    />
  );
}

function DayActivity({
  dailyActivity,
  streak,
}: {
  dailyActivity: DailyActivity[];
  streak: number;
}) {
  if (dailyActivity.length === 0) return null;

  const trainedDays = dailyActivity.filter((day) => day.trained).length;

  return (
    <View style={styles.activityRow}>
      <View style={styles.streakCounterIcon}>
        <Ionicons name="flame" size={22} color={COLORS.accent} />
      </View>
      <View style={styles.streakCounterText}>
        <Text style={styles.streakCounterValue}>
          {streak} day{streak === 1 ? "" : "s"}
        </Text>
        <Text style={styles.streakCounterLabel}>Current Streak</Text>
      </View>
      <View style={styles.streakCounterDivider} />
      <View style={styles.streakCounterWeek}>
        <Text style={styles.streakCounterWeekValue}>{trainedDays}/7</Text>
        <Text style={styles.streakCounterWeekLabel}>This Week</Text>
      </View>
    </View>
  );
}

function IconButton({
  icon,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => [
        styles.navIcon,
        pressed && styles.navIconPressed,
        disabled && styles.navIconDisabled,
      ]}
    >
      <Ionicons name={icon} size={18} color={COLORS.text} />
    </Pressable>
  );
}

export default function MuscleMapScreen() {
  const insets = useSafeAreaInsets();
  const [weekOffset, setWeekOffset] = useState(0);
  const [mapSide, setMapSide] = useState<MuscleSide>("front");
  const { data, stats, dailyActivity, loading, error, refetch } =
    useWeeklyMuscleHits(weekOffset);

  const isCurrentWeek = weekOffset === 0;
  const weekBounds = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);
  const weekRange = formatWeekRange(weekBounds.start, weekBounds.end);

  const streak = useMemo(() => {
    if (isCurrentWeek) {
      return stats?.currentStreak ?? computeTrailingStreak(dailyActivity);
    }
    return computeLongestStreak(dailyActivity);
  }, [isCurrentWeek, stats?.currentStreak, dailyActivity]);

  const mostTrained = useMemo(() => {
    if (!data.length) return null;
    return [...data].sort((a, b) => b.timesHit - a.timesHit)[0];
  }, [data]);

  const muscleCount = data.length;

  const avgSets = useMemo(() => {
    if (!stats || stats.totalWorkouts === 0) return "0";
    return (stats.totalSets / stats.totalWorkouts).toFixed(1);
  }, [stats]);

  const restDays = useMemo(() => {
    if (!stats) return 0;
    const daysElapsed = isCurrentWeek
      ? Math.min(7, dayjs().diff(weekBounds.start, "day") + 1)
      : 7;
    return Math.max(0, daysElapsed - stats.daysTrained);
  }, [stats, isCurrentWeek, weekBounds.start]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.page, { paddingTop: insets.top }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 26 + insets.bottom },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isCurrentWeek ? "This Week" : weekRange}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <IconButton
                icon="chevron-back"
                onPress={() => setWeekOffset((value) => value - 1)}
                disabled={loading}
              />
              <IconButton
                icon="chevron-forward"
                onPress={() => setWeekOffset((value) => Math.min(0, value + 1))}
                disabled={loading || isCurrentWeek}
              />
            </View>
          </View>

          <View style={styles.rangeRow}>
            <Text style={styles.rangeText}>{weekRange}</Text>
            {streak > 0 && (
              <View style={styles.streakPill}>
                <Ionicons name="flame" size={13} color={COLORS.accent} />
                <Text style={styles.streakText}>{streak} day streak</Text>
              </View>
            )}
          </View>

          <DayActivity dailyActivity={dailyActivity} streak={streak} />

          {/* Hero visualization — front and back shown together, matching
              the reference image, rather than behind a toggle. */}
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroEyebrow}>Weekly Recovery</Text>
                <Text style={styles.heroTitle}>
                  {muscleCount > 0
                    ? `${muscleCount} muscle groups hit`
                    : "No muscle groups yet"}
                </Text>
              </View>
            </View>

            <View style={styles.mapToggle}>
              {(["front", "back"] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setMapSide(option)}
                  style={[
                    styles.mapToggleButton,
                    mapSide === option && styles.mapToggleButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.mapToggleText,
                      mapSide === option && styles.mapToggleTextActive,
                    ]}
                  >
                    {option === "front" ? "Front" : "Back"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.mapRow}>
              {loading ? (
                <ActivityIndicator color={COLORS.accent} size="large" />
              ) : error ? (
                <View style={styles.errorState}>
                  <Ionicons
                    name="warning-outline"
                    size={22}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable onPress={refetch}>
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                </View>
              ) : (
                <AnatomicalMap side={mapSide} data={data} />
              )}
            </View>

            {mostTrained && (
              <View style={styles.heroFooter}>
                <View>
                  <Text style={styles.heroFooterLabel}>Most Trained</Text>
                  <Text style={styles.heroFooterValue}>
                    {normalizeGroup(mostTrained.muscleGroupName)}
                  </Text>
                </View>
                <Text style={styles.heroFooterCount}>
                  {mostTrained.timesHit}×
                </Text>
              </View>
            )}
          </View>

          {/* Weekly metrics */}
          {stats && (
            <View style={styles.statsCard}>
              <View style={styles.statsHeader}>
                <View>
                  <Text style={styles.statsKicker}>Weekly Output</Text>
                  <Text style={styles.statsTitle}>Training summary</Text>
                </View>
                <Ionicons
                  name="stats-chart-outline"
                  size={19}
                  color={COLORS.accent}
                />
              </View>

              <View style={styles.highlightStats}>
                <View style={styles.highlightStat}>
                  <Text style={styles.primaryStatLabel}>WEIGHT LIFTED</Text>
                  <Text style={styles.primaryStatValue}>
                    {typeof stats.totalVolume === "number"
                      ? stats.totalVolume.toLocaleString()
                      : "—"}
                  </Text>
                  <Text style={styles.highlightUnit}>LB VOLUME</Text>
                </View>
                <View style={styles.highlightDivider} />
                <View style={styles.highlightStat}>
                  <Text style={styles.primaryStatLabel}>PRS</Text>
                  <Text style={styles.primaryStatValue}>
                    {stats.personalRecords ?? 0}
                  </Text>
                  <Text style={styles.highlightUnit}>ALL-TIME BESTS</Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{stats.totalWorkouts}</Text>
                  <Text style={styles.metricLabel}>Workouts</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{stats.totalSets}</Text>
                  <Text style={styles.metricLabel}>Sets</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{stats.totalExercises}</Text>
                  <Text style={styles.metricLabel}>Exercises</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricValue}>{stats.daysTrained}/7</Text>
                  <Text style={styles.metricLabel}>Days</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailText}>{avgSets} sets/workout</Text>
                <Text style={styles.detailBullet}>•</Text>
                <Text style={styles.detailText}>
                  {restDays} rest day{restDays === 1 ? "" : "s"}
                </Text>
                {streak > 0 && (
                  <>
                    <Text style={styles.detailBullet}>•</Text>
                    <Text style={styles.detailText}>{streak} day streak</Text>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Muscle list */}
          {data.length > 0 && (
            <View style={styles.groupsSection}>
              <View style={styles.groupsHeader}>
                <Text style={styles.groupsTitle}>Muscle groups</Text>
                <Text style={styles.groupsCaption}>sessions</Text>
              </View>

              <View style={styles.groupsList}>
                {[...data]
                  .sort((a, b) => b.timesHit - a.timesHit)
                  .map((hit) => (
                    <View key={hit.muscleGroupName} style={styles.groupRow}>
                      <View style={styles.groupLeft}>
                        <View
                          style={[
                            styles.groupIndicator,
                            {
                              backgroundColor:
                                hit.timesHit >= 2
                                  ? PRIMARY_COLOR
                                  : SECONDARY_COLOR,
                            },
                          ]}
                        />
                        <Text style={styles.groupName}>
                          {normalizeGroup(hit.muscleGroupName)}
                        </Text>
                      </View>
                      <Text style={styles.groupCount}>{hit.timesHit}×</Text>
                    </View>
                  ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingTop: 16,
  },
  kicker: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
  },
  title: {
    marginTop: 5,
    color: COLORS.text,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
  },
  headerActions: {
    flexDirection: "row",
    gap: 7,
  },
  navIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16181D",
    borderWidth: 1,
    borderColor: "#26282F",
  },
  navIconPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  navIconDisabled: {
    opacity: 0.3,
  },

  rangeRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rangeText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#17181D",
    borderWidth: 1,
    borderColor: "#2B2B30",
  },
  streakText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "700",
  },

  activityRow: {
    marginTop: 17,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#17181D",
    borderWidth: 1,
    borderColor: "#2B2B30",
  },
  streakCounterIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,214,31,0.12)",
  },
  streakCounterText: {
    flex: 1,
    marginLeft: 11,
  },
  streakCounterValue: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },
  streakCounterLabel: {
    marginTop: 2,
    color: COLORS.textFaint,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  streakCounterDivider: {
    width: StyleSheet.hairlineWidth,
    height: 30,
    backgroundColor: "#34363D",
    marginHorizontal: 14,
  },
  streakCounterWeek: {
    alignItems: "center",
    minWidth: 48,
  },
  streakCounterWeekValue: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: "800",
  },
  streakCounterWeekLabel: {
    marginTop: 2,
    color: COLORS.textFaint,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  hero: {
    marginTop: 18,
    borderRadius: 28,
    backgroundColor: "#111318",
    borderWidth: 1,
    borderColor: "#282A31",
    overflow: "hidden",
  },
  heroTop: {
    paddingHorizontal: 18,
    paddingTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mapToggle: {
    alignSelf: "center",
    flexDirection: "row",
    marginTop: 14,
    padding: 3,
    borderRadius: 11,
    backgroundColor: "#17191E",
    borderWidth: 1,
    borderColor: "#292B32",
  },
  mapToggleButton: {
    minWidth: 78,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  mapToggleButtonActive: {
    backgroundColor: COLORS.accent,
  },
  mapToggleText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  mapToggleTextActive: {
    color: COLORS.bg,
  },
  heroEyebrow: {
    color: COLORS.textFaint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  mapRow: {
    minHeight: 280,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  errorState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 28,
  },
  errorText: {
    color: COLORS.textMuted,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
  },
  retryText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "800",
  },
  legendBlock: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 22,
  },
  legendRowCenter: {
    flexDirection: "row",
    justifyContent: "center",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
  heroFooter: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "#17191E",
    borderWidth: 1,
    borderColor: "#25272D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroFooterLabel: {
    color: COLORS.textFaint,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  heroFooterValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 3,
  },
  heroFooterCount: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: "900",
  },

  statsCard: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: "#111318",
    borderWidth: 1,
    borderColor: "#282A31",
    padding: 18,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsKicker: {
    color: COLORS.textFaint,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  statsTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 4,
  },
  primaryStat: {
    marginTop: 18,
  },
  highlightStats: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  highlightStat: {
    flex: 1,
  },
  highlightDivider: {
    width: StyleSheet.hairlineWidth,
    height: 54,
    marginHorizontal: 16,
    backgroundColor: "#292B32",
  },
  primaryStatLabel: {
    color: COLORS.textFaint,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  primaryStatValue: {
    marginTop: 2,
    color: COLORS.accent,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "900",
  },
  highlightUnit: {
    marginTop: 1,
    color: COLORS.textFaint,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  statDivider: {
    marginTop: 14,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#292B32",
  },
  metricsRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metric: {
    alignItems: "center",
    flex: 1,
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },
  metricLabel: {
    marginTop: 3,
    color: COLORS.textFaint,
    fontSize: 10,
  },
  detailRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  detailText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  detailBullet: {
    color: COLORS.textFaint,
    fontSize: 11,
  },

  groupsSection: {
    marginTop: 20,
  },
  groupsHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 3,
  },
  groupsTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  groupsCaption: {
    color: COLORS.textFaint,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  groupsList: {
    marginTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#292B32",
  },
  groupRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#24262C",
  },
  groupLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  groupIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  groupName: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
  },
  groupCount: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "800",
  },
});
