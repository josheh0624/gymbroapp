import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { GlassView } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import liquidGlassStyles from "../../../styles/liquidglass";

const COLORS = {
  accent: "#ffd61f",
  surfaceBorder: "rgba(255,255,255,0.09)",
};

export default function AddWorkoutButton() {
  const router = useRouter();

  return (
    <Pressable
      style={styles.container}
      onPress={() =>
        router.push("/workoutPage/add-workout-nav/add-workout-nav")
      }
    >
      <GlassView
        style={liquidGlassStyles.tintedGlassAddButton}
        glassEffectStyle="regular"
        tintColor="rgba(255,214,31,0.18)"
      />

      <FontAwesome6 name="plus" size={22} color={COLORS.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
});
