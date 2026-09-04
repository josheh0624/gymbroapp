import { useRoutineStore } from "@/store/routineStore";
import { COLORS, WORKOUT_PAGE_COLORS } from "@/styles/appStyles";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs from "dayjs";
import { BlurView } from "expo-blur";
import { GlassView } from "expo-glass-effect";
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

  const dockGlassOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(dockGlassOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }, 60);
    return () => clearTimeout(timer);
  }, []);

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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={8}
              android_ripple={{
                color: "rgba(255,255,255,0.15)",
                borderless: true,
                radius: 19,
              }}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <GlassView
                style={StyleSheet.absoluteFill}
                glassEffectStyle="regular"
                tintColor="rgba(255,255,255,0.06)"
              />
              <Ionicons name="chevron-down" size={20} color={COLORS.text} />
            </Pressable>
          </View>

          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Workout</Text>
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

        {/* bottom dock */}
        <View style={[styles.bottomDock, { paddingBottom: insets.bottom + 6 }]}>
          <View style={[StyleSheet.absoluteFill, styles.dockFallbackBg]} />

          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: dockGlassOpacity }]}
          >
            <GlassView
              style={StyleSheet.absoluteFill}
              glassEffectStyle="regular"
              tintColor="rgba(255,255,255,0.06)"
            />
          </Animated.View>

          <View style={styles.dockRow}>
            <View style={styles.dockItem}>
              <DockButton
                size={56}
                style={styles.changeRoutineButton}
                onPress={() =>
                  //change router location
                  router.push("/workoutPage/add-workout-nav/add-workout-nav")
                }
              >
                <Ionicons
                  name="swap-horizontal"
                  size={20}
                  color={COLORS.text}
                />
              </DockButton>
              <Text style={styles.dockLabel}>Swap Routine</Text>
            </View>
            <View style={styles.dockItem}>
              <DockButton
                size={72}
                style={styles.playButton}
                onPress={() => {
                  if (!startWorkout) return; // guard: no workout scheduled today
                  console.log("Navigating with:", {
                    workoutId: startWorkout.id,
                    routineID: routine?.id,
                  });
                  router.push(
                    `/workoutPage/workout-list/workout-thumbnail/${startWorkout.id}?routineID=${routine?.id}`,
                  );
                }}
              >
                <Ionicons
                  name="play"
                  size={30}
                  color={COLORS.bg}
                  style={{ marginLeft: 3 }}
                />
              </DockButton>
              <Text style={styles.startLabel}>Start</Text>
            </View>
            <View style={styles.dockItem}>
              <DockButton
                size={56}
                style={styles.addWorkoutButton}
                onPress={() =>
                  router.push("/workoutPage/add-workout-nav/add-workout-nav")
                }
              >
                <FontAwesome6 name="plus" size={20} color={COLORS.text} />
              </DockButton>
              <Text style={styles.dockLabel}>Add Workout</Text>
            </View>
          </View>
        </View>
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
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  dateText: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.2,
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
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 800,
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
  topBar: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  dockFallbackBg: {
    backgroundColor: COLORS.surface,
  },
  bottomDock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  dockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
  },
  dockItem: {
    alignItems: "center",
    gap: 12,
  },
  playButton: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  addWorkoutButton: {
    backgroundColor: WORKOUT_PAGE_COLORS.dockNeutral,
  },
  dockLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "500",
  },
  startLabel: {
    color: COLORS.accent,
    fontSize: 17,
    fontWeight: "800",
  },
  changeRoutineButton: {
    backgroundColor: WORKOUT_PAGE_COLORS.dockNeutral,
  },
});
