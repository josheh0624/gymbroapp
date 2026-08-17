import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { GlassView } from "expo-glass-effect";
import { Pressable, StyleSheet, Text } from "react-native";

const COLORS = {
  accent: "#ffd61f",
  surfaceBorder: "rgba(255,255,255,0.09)",
};

export default function AddCustomButton() {
  return (
    <Pressable
      style={styles.container}
      onPress={() => {
        // TODO: route to custom routine builder
      }}
    >
      <GlassView
        style={StyleSheet.absoluteFill}
        glassEffectStyle="regular"
        tintColor="rgba(255,214,31,0.14)"
      />
      <FontAwesome6 name="plus" size={16} color={COLORS.accent} />
      <Text style={styles.text}>Create Custom Routine</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    width: "100%",
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.accent,
  },
});
