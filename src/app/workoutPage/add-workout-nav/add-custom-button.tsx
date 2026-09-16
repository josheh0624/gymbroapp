import { useMemo } from "react";
import { COLORS, useThemeColors, ThemeColors } from "@/styles/appStyles";
import { useThemeStore } from "@/store/themeStore";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";


export default function AddCustomButton() {
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => {
        router.push("/workoutPage/add-workout-nav/custom-workout");
      }}
    >
      <FontAwesome6 name="plus" size={16} color={isLight ? "#141518" : colors.bg} />
      <Text style={styles.text}>Create Custom Routine</Text>
    </Pressable>
  );
}

const getStyles = (colors: ThemeColors, isLight: boolean) => StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontSize: 16,
    fontWeight: "800",
    color: isLight ? "#141518" : colors.bg,
  },
});
