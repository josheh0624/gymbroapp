import WorkoutModel from "@/models/workout-model";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

const COLORS = {
  bg: "#141518",
  text: "#F5F6F7",
  textFaint: "#8A8F98",
  textMuted: "rgba(255,255,255,0.5)",
  accent: "#ffd61f",
  surfaceBorder: "rgba(255,255,255,0.09)",
};

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
  const router = useRouter();

  const exerciseCount = workout.exercises.length;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.workoutCard,
        !visible && styles.hidden,
        pressed && styles.pressed,
      ]}
      pointerEvents={visible ? "auto" : "none"}
      onPress={() => {
        console.log("Navigating with:", { workoutId: workout.id, routineID });
        router.push(
          `/workoutPage/workout-list/workout-thumbnail/${workout.id}?routineID=${routineID}&selectedDateString=${selectedDateString || ''}`,
        );
      }}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {workout.name}
          </Text>
          <Text style={styles.subtitle}>
            {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textFaint} />
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  workoutCard: {
    marginHorizontal: 16,
    minHeight: 180,
    marginBottom: 12,
    borderRadius: 24,
    backgroundColor: "#1C1D22",
    overflow: "hidden",
    padding: 20,
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
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.textMuted,
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
    borderBottomColor: COLORS.surfaceBorder,
  },
  exerciseName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
    paddingRight: 12,
  },
  exerciseMeta: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
});
