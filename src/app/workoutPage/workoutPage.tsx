import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { ProfilePhoto } from "@/app/components/profile-photo";
import { useRoutineStore } from "@/store/routineStore";
import { COLORS } from "@/styles/appStyles";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs from "dayjs";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import moment from "moment";
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WorkoutRoutine from "../../models/workout-routine-model";
import WeekStrip from "../components/week-strip";
import WorkoutList from "./workout-list/workout-list";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function DockButton({
  onPress,
  size,
  style,
  children,
}: {
  onPress: () => void;
  size: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, {
      toValue,
      speed: 40,
      bounciness: 6,
      useNativeDriver: true,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.92)}
      onPressOut={() => animateTo(1)}
      hitSlop={8}
    >
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            transform: [{ scale }],
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function WorkoutScreen() {
  const router = useRouter();
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

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const selectedWeekdayID = selectedDate.getDay();

  const normalizeWeekday = (value: number | string) => {
    const normalized = Number(value);
    return normalized === 0 ? 7 : normalized;
  };

  const normalizedSelectedDay = normalizeWeekday(selectedWeekdayID);
  const visibleWorkouts = (routine?.workouts ?? []).filter((w) =>
    w.days.some((d) => normalizeWeekday(d) === normalizedSelectedDay),
  );

  const startWorkout = visibleWorkouts[0];

  const hasRoutine = !!routine;
  const hasWorkoutToday = visibleWorkouts.length > 0;
  const isSelectedToday = selectedWeekdayID === moment().day();
  const sectionLabel = isSelectedToday
    ? "Today"
    : WEEKDAY_NAMES[selectedWeekdayID];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_bottom",
        }}
      />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Full-Page Dark Gradient */}
          <View style={styles.gradientContainer}>
            <LinearGradient
              colors={["#25262E", "#141518"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            <View style={{ paddingTop: insets.top, paddingBottom: 180 }}>
              <View style={styles.topBar}>
                <Pressable
                  onPress={() => router.back()}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.iconBtn,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Ionicons name="chevron-down" size={24} color="#FFF" />
                </Pressable>

                <Text style={styles.dateTextInline}>{currentDate}</Text>

                <Pressable
                  hitSlop={8}
                  onPress={() => router.push("/(tabs)/accountPage" as any)}
                >
                  <ProfilePhoto size={38} color="#FFF" />
                </Pressable>
              </View>

              <View style={styles.headerCentered}>
                <Text style={styles.workoutTitleCentered}>Workout</Text>
              </View>

              <View style={styles.weekCalendarContainer}>
                <WeekStrip
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
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
                    selectedDate={selectedDate}
                  />
                ) : (
                  <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
                    <Ionicons
                      name={hasRoutine ? "moon-outline" : "barbell-outline"}
                      size={26}
                      color="rgba(255,255,255,0.4)"
                    />
                    <Text style={styles.emptyTitle}>
                      {hasRoutine ? "Rest day" : "No active routine"}
                    </Text>
                    <Text style={styles.emptyBody}>
                      {hasRoutine
                        ? "Nothing scheduled for this day. Tap + to add one."
                        : "Create or select a routine to start filling out your week."}
                    </Text>
                  </BlurView>
                )}
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Floating Bottom Dock (Frosted Glass) */}
        <BlurView
          intensity={25}
          tint="dark"
          style={[styles.bottomDock, { paddingBottom: insets.bottom + 12 }]}
        >
          <View style={styles.dockRow}>
            <View style={styles.dockItem}>
              <DockButton
                size={56}
                style={styles.changeRoutineButton}
                onPress={() =>
                  router.push(
                    "/workoutPage/add-workout-nav/add-workout-nav" as any,
                  )
                }
              >
                <Ionicons name="swap-horizontal" size={20} color="#FFF" />
              </DockButton>
              <Text style={styles.dockLabel}>Swap Routine</Text>
            </View>
            <View style={styles.dockItem}>
              <DockButton
                size={72}
                style={styles.playButton}
                onPress={() => {
                  if (!startWorkout || !routine) return; // guard: no workout scheduled today
                  const selectedDateString = selectedDate.toISOString().split("T")[0];
                  router.push(
                    `/workoutPage/workout-list/workout-thumbnail/${startWorkout.id}?routineID=${routine.id}&selectedDateString=${selectedDateString}` as any
                  );
                }}
              >
                <Ionicons
                  name="play"
                  size={32}
                  color={startWorkout ? COLORS.bg : COLORS.textMuted}
                />
              </DockButton>
              <Text style={styles.dockLabel}>Play</Text>
            </View>
            <View style={styles.dockItem}>
              <DockButton
                size={56}
                style={styles.addWorkoutButton}
                onPress={() => {
                  router.push({
                    pathname:
                      "/workoutPage/add-workout-nav/add-workout-nav" as any,
                    params: { activeRoutineId: routine?.id },
                  });
                }}
              >
                <Ionicons name="add" size={24} color="#FFF" />
              </DockButton>
              <Text style={styles.dockLabel}>Add Workout</Text>
            </View>
          </View>
        </BlurView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  gradientContainer: {
    flex: 1,
    minHeight: "100%",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 56,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  dateTextInline: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  headerCentered: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -16, // Eliminates the gap between the Date and WORKOUT
    marginBottom: 8,
  },
  workoutTitleCentered: {
    color: "#FFF",
    fontSize: 34,
    fontWeight: "bold",
    letterSpacing: 0.35,
    lineHeight: 41,
  },
  weekCalendarContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.35,
  },
  sectionCount: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "700",
  },
  listContainer: {
    gap: 16,
    paddingHorizontal: 16,
  },
  emptyCard: {
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  emptyTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyBody: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  bottomDock: {
    position: "absolute",
    left: 4,
    right: 4,
    bottom: 4,
    paddingTop: 20,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  dockRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingHorizontal: 16,
  },
  dockItem: {
    alignItems: "center",
    gap: 8,
  },
  dockLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
  },
  changeRoutineButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  addWorkoutButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  playButton: {
    backgroundColor: "#ffd33d",
    shadowColor: "#ffd33d",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
});
