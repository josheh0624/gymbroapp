import { BlurView } from "expo-blur";
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
        <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
          <Text style={styles.emptyText}>No custom routines yet.</Text>
        </BlurView>
      )}

      <Text style={styles.sectionTitle}>Prebuilt Routines</Text>
      {prebuiltRoutines.length > 0 ? (
        prebuiltRoutines.map((routine) => (
          <PrebuiltWorkoutThumbnail routine={routine} key={routine.id} />
        ))
      ) : (
        <BlurView intensity={20} tint="dark" style={styles.emptyCard}>
          <Text style={styles.emptyText}>No prebuilt routines found.</Text>
        </BlurView>
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
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    marginLeft: 20,
    marginBottom: 12,
    marginTop: 16,
  },
  emptyCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
