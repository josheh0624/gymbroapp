import { useRoutineStore } from "@/store/routineStore";
import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import moment from "moment";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import WorkoutRoutine from "../../models/workout-routine-model";
import WeekStrip from "../components/week-strip";
import AddWorkoutButton from "../workoutPage/add-button/add-workout-button";
import WorkoutList from "../workoutPage/workout-list/workout-list";

export default function WorkoutScreen() {
  // routine stuff — pulled from store instead of local state
  const addRoutine = useRoutineStore((state) => state.addRoutine);
  const setActiveRoutine = useRoutineStore((state) => state.setActiveRoutine);
  const activeRoutineId = useRoutineStore((state) => state.activeRoutineId);
  const routine = useRoutineStore((state) =>
    state.routines.find((r) => r.id === activeRoutineId),
  );

  const params = useLocalSearchParams<{ addedRoutine?: string | string[] }>();

  useEffect(() => {
    const encodedRoutine = Array.isArray(params.addedRoutine)
      ? params.addedRoutine[0]
      : params.addedRoutine;

    if (!encodedRoutine) return;

    try {
      const parsedRoutine = JSON.parse(encodedRoutine) as WorkoutRoutine;

      if (!parsedRoutine?.workoutRoutine) return;

      addRoutine(parsedRoutine); // store dedupes by id already
      setActiveRoutine(parsedRoutine.id); // mark it as the one to display
    } catch {
      console.warn("Unable to parse the routine payload.");
    }
  }, [params.addedRoutine]);

  //date stuff

  const currentDate = dayjs().format("MMMM D, YYYY");

  function getWeekdayID(date: moment.Moment): number {
    //get the number corresponding to each day of the week
    const day = date.day();
    return day;
  }
  const [selectedWeekdayID, setSelectedWeekdayID] = useState<number>(
    getWeekdayID(moment()),
  );

  return (
    <View style={styles.container}>
      <View style={styles.dateContainer}>
        <Text style={styles.dateText}>{currentDate}</Text>
      </View>
      <View style={styles.weekCalendarContainer}>
        <WeekStrip
          setSelectedWeekdayID={setSelectedWeekdayID}
          getWeekdayID={getWeekdayID}
        />
      </View>
      <View style={{ flex: 1, width: "100%", height: "100%", paddingTop: 10 }}>
        <WorkoutList routine={routine} selectedWeekdayID={selectedWeekdayID} />
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          width: "90%",
          position: "absolute",
          bottom: 120,
        }}
      >
        <AddWorkoutButton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 18,
  },
  dateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 20,
    paddingLeft: 18,
    paddingRight: 10,
    width: "100%",
  },
  dateText: {
    color: "#fff",
    fontSize: 18,
    alignSelf: "flex-start", // Align the text to the left
    fontWeight: 500,
  },
  weekCalendarContainer: {
    width: "100%",
  },
  weekCalendar: {
    width: "100%",
    height: 50,
  },
});
