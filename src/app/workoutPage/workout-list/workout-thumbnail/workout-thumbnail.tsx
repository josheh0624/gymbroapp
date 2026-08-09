import liquidGlassStyles from "@/styles/liquidglass";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import Workout from "../../../../models/workout-model";

interface Props {
  workout: Workout;
  selectedWeekdayID: number;
  visible: boolean;
  routineID: string;
}

export default function WorkoutThumbnail({
  workout,
  selectedWeekdayID,
  visible,
  routineID,
}: Props) {
  const normalizeWeekday = (value: number | string) => {
    const normalizedValue = Number(value);
    return normalizedValue === 0 ? 7 : normalizedValue;
  };

  const router = useRouter();

  return (
    <Pressable
      style={[styles.workoutCard, !visible && styles.hidden]}
      pointerEvents={visible ? "auto" : "none"}
      onPress={() => {
        console.log("Navigating with:", { workoutId: workout.id, routineID });
        router.push(
          `/workoutPage/workout-list/workout-thumbnail/${workout.id}?routineID=${routineID}`,
        );
      }}
    >
      <GlassView
        style={liquidGlassStyles.tintedGlassThumbnail}
        glassEffectStyle="clear"
      />
      <Text style={styles.text}>{workout.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  workoutCard: {
    width: "92%",
    height: 240,
    alignSelf: "center",
    marginBottom: 10,
  },
  hidden: {
    display: "none",
  },
  text: {
    color: "#fff",
    top: 0,
    padding: 20,
    fontSize: 24,
    fontWeight: 600,
  },
});
