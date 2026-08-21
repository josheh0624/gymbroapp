import { useRoutineStore } from "@/store/routineStore";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

interface Props {
  routineId: string;
}

export default function AddToRoutine({ routineId }: Props) {
  const setActiveRoutine = useRoutineStore((s) => s.setActiveRoutine);
  const fetchRoutineById = useRoutineStore((s) => s.fetchRoutineById);

  const handleAddWorkout = async () => {
    await fetchRoutineById(routineId);
    setActiveRoutine(routineId);
    router.replace({ pathname: "/" });
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={handleAddWorkout}
      hitSlop={8}
    >
      <FontAwesome6 name="plus" size={18} color="#141518" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffd61f",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ffd61f",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
});
