import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useThemeColors } from "@/styles/appStyles";

export default function NotFoundScreen() {
  const colors = useThemeColors();
  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <Text style={[styles.button, { color: colors.text }]}>404 - Page Not Found</Text>
        <Link href="/(tabs)/accountPage" style={[styles.button, { color: colors.text }]}>
          Go to Home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    fontSize: 20,
    textDecorationLine: "underline",
    color: "#fff",
  },
});
