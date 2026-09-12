import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRoutineStore } from "../../../store/routineStore";
import PrebuiltWorkoutThumbnail from "./prebuilt-thumbnail/prebuilt-workout-thumbnail";

const COLORS = {
  textMuted: "rgba(255,255,255,0.5)",
  surface: "rgba(255,255,255,0.045)",
  surfaceBorder: "rgba(255,255,255,0.09)",
};

export default function PrebuiltWorkoutList() {
  const { routineList, fetchRoutineList } = useRoutineStore();

  useEffect(() => {
    fetchRoutineList();
  }, []);

  const prebuiltRoutines = routineList.filter((r) => r.is_prebuilt);
  const customRoutines = routineList.filter((r) => !r.is_prebuilt);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Custom Routines</Text>
      {customRoutines.length > 0 ? (
        customRoutines.map((routine) => (
          <PrebuiltWorkoutThumbnail routine={routine} key={routine.id} />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No custom routines yet.</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Prebuilt Routines</Text>
      {prebuiltRoutines.length > 0 ? (
        prebuiltRoutines.map((routine) => (
          <PrebuiltWorkoutThumbnail routine={routine} key={routine.id} />
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No prebuilt routines found.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignContent: "center",
    width: "100%",
  },
  sectionTitle: {
    color: "#F5F6F7",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 20,
    marginBottom: 12,
    marginTop: 16,
  },
  emptyCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#1C1D22",
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
