import { useMemo } from "react";
import { COLORS, useThemeColors, ThemeColors } from "@/styles/appStyles";
import { useRoutineStore } from "@/store/routineStore";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import { withAsyncLock } from "@/utils/asyncUtils";

interface Props {
  routineId: string;
}

export default function AddToRoutine({ routineId }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const setActiveRoutine = useRoutineStore((s) => s.setActiveRoutine);
  const fetchRoutineById = useRoutineStore((s) => s.fetchRoutineById);

  const handleAddWorkout = withAsyncLock(async () => {
    await fetchRoutineById(routineId);
    setActiveRoutine(routineId);
    router.back();
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={handleAddWorkout}
      hitSlop={8}
    >
      <FontAwesome6 name="plus" size={18} color={colors.bg} />
    </Pressable>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4169E1",
    justifyContent: "center",
    alignItems: "center",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
});
