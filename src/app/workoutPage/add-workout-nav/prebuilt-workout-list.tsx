import { useThemeStore } from "@/store/themeStore";
import { useMemo } from "react";
import { COLORS, useThemeColors, ThemeColors } from "@/styles/appStyles";
import { BlurView } from "expo-blur";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRoutineStore } from "../../../store/routineStore";
import PrebuiltWorkoutThumbnail from "./prebuilt-thumbnail/prebuilt-workout-thumbnail";


export default function PrebuiltWorkoutList() {
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const styles = useMemo(() => getStyles(colors), [colors]);

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
        <BlurView intensity={isLight ? 40 : 20} tint={isLight ? "extraLight" : "dark"} style={styles.emptyCard}>
          <Text style={styles.emptyText}>No custom routines yet.</Text>
        </BlurView>
      )}

      <Text style={styles.sectionTitle}>Prebuilt Routines</Text>
      {prebuiltRoutines.length > 0 ? (
        prebuiltRoutines.map((routine) => (
          <PrebuiltWorkoutThumbnail routine={routine} key={routine.id} />
        ))
      ) : (
        <BlurView intensity={isLight ? 40 : 20} tint={isLight ? "extraLight" : "dark"} style={styles.emptyCard}>
          <Text style={styles.emptyText}>No prebuilt routines found.</Text>
        </BlurView>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    alignContent: "center",
    width: "100%",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.35,
    marginLeft: 20,
    marginBottom: 12,
    marginTop: 16,
  },
  emptyCard: {
    marginHorizontal: 16,
    borderRadius: 24,
    backgroundColor: colors.surface,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: "hidden",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
});
