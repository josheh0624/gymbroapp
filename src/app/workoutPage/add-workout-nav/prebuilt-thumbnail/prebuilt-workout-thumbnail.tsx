import { useMemo } from "react";
import { COLORS, useThemeColors, ThemeColors } from "@/styles/appStyles";
import { useRoutineStore } from "@/store/routineStore";
import { useThemeStore } from "@/store/themeStore";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import AddToRoutine from "./add-to-routine-button";

interface RoutineListItem {
  id: string;
  name: string;
  is_prebuilt: boolean;
  workout_count: number;
}

interface Props {
  routine: RoutineListItem;
}

export default function PrebuiltWorkoutThumbnail({ routine }: Props) {
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const styles = useMemo(() => getStyles(colors), [colors]);

  const router = useRouter();
  const deleteRoutine = useRoutineStore((s) => s.deleteRoutine);

  const handleDelete = () => {
    Alert.alert(
      "Delete Routine",
      `Are you sure you want to delete "${routine.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteRoutine(routine.id),
        },
      ],
    );
  };

  const handleEdit = () => {
    router.push({
      pathname: "/workoutPage/add-workout-nav/custom-workout",
      params: { id: routine.id },
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.workoutCardWrapper, pressed && styles.pressed]}
    >
      <BlurView intensity={isLight ? 40 : 20} tint={isLight ? "extraLight" : "dark"} style={styles.workoutCard}>
      <View style={styles.infoSection}>
        <Text style={styles.text} numberOfLines={1}>
          {routine.name}
        </Text>
        <View style={styles.countBadge}>
          <FontAwesome6 name="layer-group" size={10} color="#4169E1" />
          <Text style={styles.countText}>{routine.workout_count} Workouts</Text>
        </View>
      </View>

      <View style={styles.actionsWrapper}>
        {!routine.is_prebuilt && (
          <>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => [
                styles.actionBtn,
                styles.deleteBtn,
                pressed && styles.pressedBtn,
              ]}
            >
              <Ionicons name="trash" size={18} color="#FF453A" />
            </Pressable>
            <Pressable
              onPress={handleEdit}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.pressedBtn,
              ]}
            >
              <Ionicons name="pencil" size={18} color={colors.text} />
            </Pressable>
          </>
        )}
        <AddToRoutine routineId={routine.id} />
      </View>
      </BlurView>
    </Pressable>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  workoutCardWrapper: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  workoutCard: {
    borderRadius: 24,
    backgroundColor: colors.glassStrong,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.glassStrongBorder,
    overflow: "hidden",
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
  pressedBtn: {
    opacity: 0.6,
  },
  infoSection: {
    flex: 1,
    paddingRight: 12,
    gap: 6,
  },
  text: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  countBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    color: "#4169E1",
    fontSize: 11,
    fontWeight: "800",
  },
  actionsWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glassStrong,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: colors.errorBg,
  },
});
