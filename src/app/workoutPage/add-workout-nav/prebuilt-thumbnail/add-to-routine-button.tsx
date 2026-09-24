import { useMemo } from "react";
import { COLORS, useThemeColors, ThemeColors } from "@/styles/appStyles";
import { useRoutineStore } from "@/store/routineStore";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { router } from "expo-router";
import { Alert, Pressable, StyleSheet } from "react-native";
import { withAsyncLock } from "@/utils/asyncUtils";
import Ionicons from "@expo/vector-icons/Ionicons";

interface Props {
  routineId: string;
}

export default function AddToRoutine({ routineId }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const setActiveRoutine = useRoutineStore((s) => s.setActiveRoutine);
  const fetchRoutineById = useRoutineStore((s) => s.fetchRoutineById);
  const activeRoutineId = useRoutineStore((s) => s.activeRoutineId);
  const activeSession = useRoutineStore((s) => s.activeSession);

  const isActive = activeRoutineId === routineId;

  const handleToggleWorkout = withAsyncLock(async () => {
    if (activeSession) {
      Alert.alert(
        "Workout in Progress",
        "You cannot change or remove your routine while a workout is currently active. Please finish your workout first."
      );
      return;
    }

    if (isActive) {
      setActiveRoutine(null);
    } else {
      await fetchRoutineById(routineId);
      setActiveRoutine(routineId);
    }
    router.back();
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button, 
        isActive && styles.activeButton,
        pressed && styles.pressed
      ]}
      onPress={handleToggleWorkout}
      hitSlop={8}
    >
      {isActive ? (
        <Ionicons name="close" size={20} color={colors.text} />
      ) : (
        <FontAwesome6 name="plus" size={18} color={colors.bg} />
      )}
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
  activeButton: {
    backgroundColor: colors.surfaceBorder,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
});
