import { useRoutineStore } from "@/store/routineStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs from "dayjs";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
import { useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WorkoutRoutine from "../../models/workout-routine-model";
import WeekStrip from "../components/week-strip";
import WorkoutList from "../workoutPage/workout-list/workout-list";

const COLORS = {
  bg: "#141518",
  text: "#F5F6F7",
  textFaint: "#565A60",
  textMuted: "rgba(255,255,255,0.5)",
  accent: "#ffd61f",
  surface: "rgba(255,255,255,0.045)",
  surfaceBorder: "rgba(255,255,255,0.09)",
};

const WEEKDAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export default function WorkoutScreen() {
  const addRoutine = useRoutineStore((state) => state.addRoutine);
  const setActiveRoutine = useRoutineStore((state) => state.setActiveRoutine);
  const activeRoutineId = useRoutineStore((state) => state.activeRoutineId);
  const routine = useRoutineStore((state) =>
    state.routines.find((r) => r.id === activeRoutineId),
  );

  const params = useLocalSearchParams<{ addedRoutine?: string | string[] }>();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const encodedRoutine = Array.isArray(params.addedRoutine)
      ? params.addedRoutine[0]
      : params.addedRoutine;

    if (!encodedRoutine) return;

    try {
      const parsedRoutine = JSON.parse(encodedRoutine) as WorkoutRoutine;
      if (!parsedRoutine?.workouts) return;
      addRoutine(parsedRoutine);
      setActiveRoutine(parsedRoutine.id);
    } catch {
      console.warn("Unable to parse the routine payload.");
    }
  }, [params.addedRoutine]);

  const currentDate = dayjs().format("MMMM D, YYYY");

  function getWeekdayID(date: moment.Moment): number {
    return date.day();
  }

  const [selectedWeekdayID, setSelectedWeekdayID] = useState<number>(
    getWeekdayID(moment()),
  );

  const normalizeWeekday = (value: number | string) => {
    const normalized = Number(value);
    return normalized === 0 ? 7 : normalized;
  };

  const normalizedSelectedDay = normalizeWeekday(selectedWeekdayID);
  const visibleWorkouts = (routine?.workouts ?? []).filter((w) =>
    w.days.some((d) => normalizeWeekday(d) === normalizedSelectedDay),
  );

  const hasRoutine = !!routine;
  const hasWorkoutToday = visibleWorkouts.length > 0;
  const isSelectedToday = selectedWeekdayID === moment().day();
  const sectionLabel = isSelectedToday
    ? "TODAY"
    : WEEKDAY_NAMES[selectedWeekdayID];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>WORKOUT</Text>
            <Text style={styles.dateText}>{currentDate}</Text>
          </View>

          <Pressable
            style={styles.settingsButton}
            hitSlop={8}
            onPress={() => {
              // TODO: route to routine settings / switch active routine
            }}
          >
            <GlassView
              style={StyleSheet.absoluteFill}
              glassEffectStyle="regular"
              tintColor="rgba(255,255,255,0.06)"
            />
            <Ionicons name="settings-outline" size={18} color={COLORS.text} />
          </Pressable>
        </View>

        <View style={styles.weekCalendarContainer}>
          <WeekStrip
            setSelectedWeekdayID={setSelectedWeekdayID}
            getWeekdayID={getWeekdayID}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>{sectionLabel}</Text>
          {hasWorkoutToday && (
            <Text style={styles.sectionCount}>
              {visibleWorkouts.length} scheduled
            </Text>
          )}
        </View>

        <View style={styles.listContainer}>
          {hasWorkoutToday ? (
            <WorkoutList
              activeRoutine={routine}
              selectedWeekdayID={selectedWeekdayID}
            />
          ) : (
            <View style={styles.emptyCard}>
              <BlurView
                intensity={20}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <Ionicons
                name={hasRoutine ? "moon-outline" : "barbell-outline"}
                size={26}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>
                {hasRoutine ? "Rest day" : "No active routine"}
              </Text>
              <Text style={styles.emptyBody}>
                {hasRoutine
                  ? "Nothing scheduled for this day. Tap + to add one."
                  : "Create or select a routine to start filling out your week."}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  eyebrow: {
    color: COLORS.textFaint,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 4,
    marginBottom: 6,
  },
  dateText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  weekCalendarContainer: {
    width: "100%",
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionLabel: {
    color: COLORS.textFaint,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 3,
  },
  sectionCount: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  listContainer: {
    flex: 1,
    width: "100%",
  },
  emptyCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  emptyBody: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 18,
  },
});
