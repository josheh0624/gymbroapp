import { api } from "@/api/api";
import { ProfilePhoto } from "@/app/components/profile-photo"; // adjust to your actual alias
import { useAuthStore } from "@/store/authStore"; // adjust to your actual path
import { COLORS } from "@/styles/appStyles";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs, { type Dayjs } from "dayjs";
import { Stack, useFocusEffect } from "expo-router";
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
  // Assumption: the backend flags a day as a scheduled rest day (e.g. from
  // the user's active routine/program) separately from a day that was
  // simply skipped. If your API doesn't send this yet, it needs to — the
  // streak logic below can't tell "planned rest" from "missed workout"
  // without it.
  isRestDay?: boolean;
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

// A streak survives a trained day OR a scheduled rest day, and breaks the
// moment a day is neither — i.e. a day that should've had a workout but
// didn't.
function keepsStreak(day: DailyActivity) {
  return day.trained || Boolean(day.isRestDay);
}

function computeLongestStreak(days: DailyActivity[]) {
  let longest = 0;
  let current = 0;

  for (const day of days) {
    if (keepsStreak(day)) {
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

    if (keepsStreak(day)) {
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

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

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

const BODY_SCALE = 1.4;
const HEAD_CROP_HEIGHT = 60;
const BODY_BOX_HEIGHT = 500; // was 260 — tall enough for the full figure post-crop

function AnatomicalMap({
  side,
  data,
}: {
  side: MuscleSide;
  data: WeeklyMuscleHit[];
}) {
  return (
    <View style={styles.bodyCropBox}>
      <View style={{ transform: [{ translateY: -HEAD_CROP_HEIGHT }] }}>
        <Body
          data={bodyMapData(data)}
          side={side}
          gender="male"
          scale={BODY_SCALE}
          defaultFill={BODY_BASE}
          hiddenParts={["head", "hair"]}
          border="none"
        />
      </View>
    </View>
  );
}

function WeekDots({ dailyActivity }: { dailyActivity: DailyActivity[] }) {
  if (dailyActivity.length === 0) return <View style={styles.weekDotsRow} />;

  return (
    <View style={styles.weekDotsRow}>
      {dailyActivity.map((day) => (
        <View key={day.date} style={styles.weekDotItem}>
          <View style={[styles.weekDot, day.trained && styles.weekDotFilled]}>
            {day.trained && (
              <Ionicons name="checkmark" size={11} color={COLORS.bg} />
            )}
          </View>
          <Text style={styles.weekDotLabel}>
            {dayjs(day.date).format("dd").charAt(0)}
          </Text>
        </View>
      ))}
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
  const { user } = useAuthStore();
  const initials = useMemo(
    () => user?.username?.slice(0, 2).toUpperCase() ?? "?",
    [user?.username],
  );
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

  const hasActiveStreak = streak > 0;

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
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.eyebrow}>Activity</Text>
              </View>

              <View style={styles.headerRight}>
                <View
                  style={[
                    styles.streakBadge,
                    hasActiveStreak
                      ? styles.streakBadgeActive
                      : styles.streakBadgeInactive,
                  ]}
                >
                  <Ionicons
                    name={hasActiveStreak ? "flame" : "flame-outline"}
                    size={11}
                    color={hasActiveStreak ? COLORS.accent : COLORS.textFaint}
                  />
                  <Text
                    style={[
                      styles.streakBadgeText,
                      hasActiveStreak
                        ? styles.streakBadgeTextActive
                        : styles.streakBadgeTextInactive,
                    ]}
                  >
                    {streak}
                  </Text>
                </View>
                <ProfilePhoto size={36} />
              </View>
            </View>
          </View>

          <View style={styles.grid}>
            {/* Week Strip Widget */}
            <View style={[styles.widget, styles.widgetFull, styles.weekWidget]}>
              <View style={styles.weekWidgetTop}>
                <Text style={styles.weekWidgetLabel}>This Week</Text>
                <Text style={styles.weekPagerText}>{weekRange}</Text>
              </View>
              <View style={styles.weekStripInner}>
                <IconButton
                  icon="chevron-back"
                  onPress={() => setWeekOffset((value) => value - 1)}
                  disabled={loading}
                />
                <WeekDots dailyActivity={dailyActivity} />
                <IconButton
                  icon="chevron-forward"
                  onPress={() =>
                    setWeekOffset((value) => Math.min(0, value + 1))
                  }
                  disabled={loading || isCurrentWeek}
                />
              </View>
            </View>

            {/* Anatomical Map Widget */}
            <View style={[styles.widget, styles.widgetFull, styles.mapWidget]}>
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

            {/* 4 Stat Widgets (2x2 Grid) */}
            {stats && (
              <>
                <DashboardStat
                  label="Workouts"
                  value={stats.totalWorkouts}
                  icon="barbell"
                />
                <DashboardStat
                  label="Sets"
                  value={stats.totalSets}
                  icon="layers"
                />
                <DashboardStat
                  label="Volume"
                  value={
                    typeof stats.totalVolume === "number"
                      ? stats.totalVolume.toLocaleString()
                      : "—"
                  }
                  icon="analytics"
                />
                <DashboardStat
                  label="PRs"
                  value={stats.personalRecords ?? 0}
                  icon="trophy"
                />
              </>
            )}

            {/* Muscle list Widget */}
            {data.length > 0 && (
              <View
                style={[styles.widget, styles.widgetFull, styles.listWidget]}
              >
                <View style={styles.groupsHeader}>
                  <Text style={styles.groupsTitle}>Muscles Targeted</Text>
                  <Text style={styles.groupsCaption}>Sessions</Text>
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
          </View>
        </ScrollView>
      </View>
    </>
  );
}

function DashboardStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={[styles.widget, styles.widgetHalf, styles.statWidget]}>
      <View style={styles.statIconContainer}>
        <Ionicons name={icon} size={20} color={COLORS.accent} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 64 },
  eyebrow: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "900",
  },

  header: { paddingTop: 16, marginBottom: 24, paddingHorizontal: 4 },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1C1D22",
    borderWidth: 1.5,
    borderColor: "#2B2B30",
  },
  streakBadgeActive: {
    backgroundColor: "rgba(255, 214, 31, 0.12)",
    borderColor: "rgba(255, 214, 31, 0.3)",
  },
  streakBadgeInactive: { opacity: 0.55 },
  streakBadgeText: { color: COLORS.text, fontSize: 11, fontWeight: "800" },
  streakBadgeTextActive: { color: COLORS.accent },
  streakBadgeTextInactive: { color: COLORS.textFaint },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  widget: {
    backgroundColor: "#1C1D22",
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
  },
  widgetFull: { width: "100%" },
  widgetHalf: { width: "48%" },

  weekWidget: { paddingHorizontal: 16, paddingVertical: 18 },
  weekWidgetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  weekWidgetLabel: {
    color: COLORS.textFaint,
    fontSize: 11,
    fontWeight: "normal",
  },
  weekPagerText: { color: COLORS.text, fontSize: 13, fontWeight: "800" },
  weekStripInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekDotsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  weekDotItem: { alignItems: "center", gap: 6 },
  weekDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#34363D",
  },
  weekDotFilled: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  weekDotLabel: {
    color: COLORS.textFaint,
    fontSize: 10,
    fontWeight: "normal",
  },
  navIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconPressed: { opacity: 0.6 },
  navIconDisabled: { opacity: 0.25 },

  mapWidget: { paddingHorizontal: 0, paddingBottom: 0, overflow: "hidden" },
  mapToggle: {
    alignSelf: "center",
    flexDirection: "row",
    marginTop: 0,
    padding: 3,
    borderRadius: 11,
    backgroundColor: "#111214",
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
  mapToggleButtonActive: { backgroundColor: COLORS.accent },
  mapToggleText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },
  mapToggleTextActive: { color: COLORS.bg },
  mapRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 0,
    paddingBottom: 4,
  },
  bodyCropBox: {
    height: BODY_BOX_HEIGHT,
    width: "100%",
    overflow: "hidden",
    alignItems: "center",
  },
  errorState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 28,
    height: 200,
  },
  errorText: {
    color: COLORS.textMuted,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
  },
  retryText: { color: COLORS.accent, fontSize: 13, fontWeight: "800" },
  heroFooter: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 13,
    borderRadius: 17,
    backgroundColor: "#111214",
    borderWidth: 1,
    borderColor: "#25272D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroFooterLabel: {
    color: COLORS.textFaint,
    fontSize: 9,
    fontWeight: "normal",
  },
  heroFooterValue: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 3,
  },
  heroFooterCount: { color: COLORS.accent, fontSize: 18, fontWeight: "900" },

  statWidget: {
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: 120,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 214, 31, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statContent: { alignItems: "flex-start" },
  statValue: { color: COLORS.text, fontSize: 26, fontWeight: "900" },
  statLabel: {
    color: COLORS.textFaint,
    fontSize: 11,
    fontWeight: "normal",
    marginTop: 4,
  },

  listWidget: { paddingHorizontal: 0, paddingBottom: 10 },
  groupsHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
    marginTop: 4,
  },
  groupsTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  groupsCaption: {
    color: COLORS.textFaint,
    fontSize: 10,
  },
  groupsList: {
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
    paddingHorizontal: 20,
  },
  groupLeft: { flexDirection: "row", alignItems: "center", gap: 9 },
  groupIndicator: { width: 7, height: 7, borderRadius: 3.5 },
  groupName: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  groupCount: { color: COLORS.accent, fontSize: 13, fontWeight: "800" },
});
