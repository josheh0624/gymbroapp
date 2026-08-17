import { StyleSheet, Text, View } from "react-native";
import { prebuiltRoutines } from "../../../data/prebuilt-routines";
import WorkoutRoutine from "../../../models/workout-routine-model";
import PrebuiltWorkoutThumbnail from "./prebuilt-thumbnail/prebuilt-workout-thumbnail";

const COLORS = {
  textMuted: "rgba(255,255,255,0.5)",
  surface: "rgba(255,255,255,0.045)",
  surfaceBorder: "rgba(255,255,255,0.09)",
};

export default function PrebuiltWorkoutList() {
  const validRoutines: WorkoutRoutine[] = Array.isArray(prebuiltRoutines)
    ? prebuiltRoutines.filter((routine): routine is WorkoutRoutine =>
        Boolean(routine),
      )
    : [];

  if (validRoutines.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No prebuilt routines available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {validRoutines.map((routine, index) => (
        <PrebuiltWorkoutThumbnail
          routine={routine}
          key={`${routine.id ?? "routine"}-${index}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignContent: "center",
    width: "100%",
  },
  emptyCard: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
