import WorkoutRoutine from "@/models/workout-routine-model";
import { StyleSheet, View } from "react-native";
import WorkoutThumbnail from "./workout-thumbnail/workout-thumbnail";

interface Props {
  activeRoutine?: WorkoutRoutine;
  selectedWeekdayID: number;
  selectedDate: Date;
}

export default function WorkoutList({
  activeRoutine,
  selectedWeekdayID,
  selectedDate,
}: Props) {
  // functions to map out thumbnails based on workouts in the routine

  const normalizeWeekday = (value: number | string) => {
    const normalizedValue = Number(value);
    return normalizedValue === 0 ? 7 : normalizedValue;
  };

  // ?? means if value is missing then use an empty array []
  const workouts = activeRoutine?.workouts ?? []; //stores workouts[]

  return (
    <View style={styles.container}>
      {workouts.map((workout, index) => {
        const normalizedSelectedDay = normalizeWeekday(selectedWeekdayID);
        const isVisible = workout.days.some(
          (d) => normalizeWeekday(d) === normalizedSelectedDay,
        );

        const selectedDateString = selectedDate
          ? selectedDate.toISOString().split("T")[0]
          : (() => {
              const d = new Date();
              const diff = selectedWeekdayID - d.getDay();
              d.setDate(d.getDate() + diff);
              return d.toISOString().split("T")[0];
            })();

        return (
          <WorkoutThumbnail
            workout={workout}
            visible={isVisible}
            key={`${workout.id ?? "workout"}-${index}`}
            routineID={activeRoutine?.id ?? ""}
            selectedDateString={selectedDateString}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignContent: "center",
    width: "100%",
  },
});
