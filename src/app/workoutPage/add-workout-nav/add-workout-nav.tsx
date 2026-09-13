import { Stack, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AddCustomButton from "./add-custom-button";
import PrebuiltWorkoutList from "./prebuilt-workout-list";

const COLORS = {
  bg: "#141518",
  text: "#F5F6F7",
  textFaint: "#8A8F98",
  accent: "#ffd61f",
  surfaceBorder: "rgba(255,255,255,0.09)",
};

export default function AddWorkoutNAV() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Routines",
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: "#25262E" },
          headerShadowVisible: false,
          headerTintColor: COLORS.text,
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: "800",
            color: COLORS.text,
          },
        }}
      />

      <View style={styles.container}>
        <LinearGradient
          colors={["#25262E", "#141518"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          
          <PrebuiltWorkoutList />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <AddCustomButton />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    color: COLORS.textFaint,
    fontSize: 12,
    fontWeight: "normal",
    marginBottom: 12,
    marginHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
});
