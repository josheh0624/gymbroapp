import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

const COLORS = {
  accent: "#ffd61f",
  surfaceBorder: "rgba(255,255,255,0.09)",
};

export default function AddCustomButton() {
  const router = useRouter();

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={() => {
        router.push("/workoutPage/add-workout-nav/custom-workout");
      }}
    >
      <FontAwesome6 name="plus" size={16} color="#141518" />
      <Text style={styles.text}>Create Custom Routine</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.accent,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontSize: 16,
    fontWeight: "800",
    color: "#141518",
  },
});
