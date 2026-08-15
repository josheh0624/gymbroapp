import { useRoutineStore } from "@/store/routineStore";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WorkoutRoutine from "../../models/workout-routine-model";
import WeekStrip from "../components/week-strip";
import AddWorkoutButton from "../workoutPage/add-button/add-workout-button";
import WorkoutList from "../workoutPage/workout-list/workout-list";

const COLORS = {
  bg: "#0A0B0D",
  text: "#F5F6F7",
  textFaint: "#565A60",
};

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
      if (!parsedRoutine?.workoutRoutine) return;
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>WORKOUT</Text>
          <Text style={styles.dateText}>{currentDate}</Text>
        </View>

        <View style={styles.weekCalendarContainer}>
          <WeekStrip
            setSelectedWeekdayID={setSelectedWeekdayID}
            getWeekdayID={getWeekdayID}
          />
        </View>

        <View style={styles.listContainer}>
          <WorkoutList
            routine={routine}
            selectedWeekdayID={selectedWeekdayID}
          />
        </View>

        <View style={styles.addButtonWrap}>
          <AddWorkoutButton />
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
  header: {
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
  weekCalendarContainer: {
    width: "100%",
    marginBottom: 6,
  },
  listContainer: {
    flex: 1,
    width: "100%",
    paddingTop: 10,
  },
  addButtonWrap: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
