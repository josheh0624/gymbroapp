import { useThemeStore } from "@/store/themeStore";
import { useMemo } from "react";
import { COLORS, useThemeColors, ThemeColors } from "@/styles/appStyles";
import WorkoutModel from "@/models/workout-model";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";


interface Props {
  workout: WorkoutModel;
  visible: boolean;
  routineID: string;
  selectedDateString?: string;
}

export default function WorkoutThumbnail({
  workout,
  visible,
  routineID,
  selectedDateString,
}: Props) {
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  const router = useRouter();

  const exerciseCount = workout.exercises.length;

  return (
    <Pressable
      style={({ pressed }) => [
        !visible && styles.hidden,
        pressed && styles.pressed,
      ]}
      pointerEvents={visible ? "auto" : "none"}
      onPress={() => {
        console.log("Navigating with:", { workoutId: workout.id, routineID });
        router.push(
          `/workoutPage/workout-list/workout-thumbnail/${workout.id}?routineID=${routineID}&selectedDateString=${selectedDateString || ''}` as any,
        );
      }}
    >
      <BlurView intensity={isLight ? 40 : 25} tint={isLight ? "extraLight" : "dark"} style={styles.workoutCard}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {workout.name}
            </Text>
            <Text style={styles.subtitle}>
              {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
        </View>

        <View style={styles.exerciseList}>
          {workout.exercises.map((exercise, index) => (
            <View
              key={`${exercise.name}-${index}`}
              style={[
                styles.exerciseRow,
                index !== exerciseCount - 1 && styles.exerciseRowDivider,
              ]}
            >
              <Text style={styles.exerciseName} numberOfLines={1}>
                {exercise.name}
              </Text>
              <Text style={styles.exerciseMeta}>
                {exercise.sets} × {exercise.reps}
              </Text>
            </View>
          ))}
        </View>
      </BlurView>
    </Pressable>
  );
}

const getStyles = (colors: ThemeColors, isLight: boolean) => StyleSheet.create({
  workoutCard: {
    marginHorizontal: 0,
    minHeight: 140,
    marginBottom: 0, // removed bottom gap because list container has gap 16
    borderRadius: 24,
    backgroundColor: isLight ? "transparent" : "rgba(20,21,24,0.3)",
    overflow: "hidden",
    padding: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  pressed: {
    opacity: 0.85,
  },
  hidden: {
    display: "none",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerText: {
    flexShrink: 1,
    paddingRight: 8,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  exerciseList: {
    flex: 1,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  exerciseRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceBorder,
  },
  exerciseName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
    paddingRight: 12,
  },
  exerciseMeta: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
});
