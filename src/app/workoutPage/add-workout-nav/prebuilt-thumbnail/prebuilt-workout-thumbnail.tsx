import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AddToRoutine from "./add-to-routine-button";

interface RoutineListItem {
  id: string;
  name: string;
  workout_count: number;
}

interface Props {
  routine: RoutineListItem;
}

export default function PrebuiltWorkoutThumbnail({ routine }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.workoutCard, pressed && styles.pressed]}
    >
      <View style={styles.countBadge}>
        <FontAwesome6 name="dumbbell" size={10} color="#ffd61f" />
        <Text style={styles.countText}>{routine.workout_count}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.text} numberOfLines={1}>
          {routine.name}
        </Text>
      </View>

      <View style={styles.addButtonWrapper}>
        <AddToRoutine routineId={routine.id} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  workoutCard: {
    marginHorizontal: 16,
    height: 160,
    marginBottom: 14,
    borderRadius: 24,
    backgroundColor: "#1C1D22",
    padding: 20,
    justifyContent: "space-between",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
  countBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,214,31,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countText: {
    color: "#ffd61f",
    fontSize: 12,
    fontWeight: "700",
  },
  textContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingRight: 48,
  },
  text: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  addButtonWrapper: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
});
