import { useMemo } from "react";
import { COLORS, useThemeColors, ThemeColors } from "@/styles/appStyles";
import { Stack, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AddCustomButton from "./add-custom-button";
import PrebuiltWorkoutList from "./prebuilt-workout-list";


export default function AddWorkoutNAV() {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Routines",
          headerBackButtonDisplayMode: "minimal",
          headerStyle: { backgroundColor: colors.gradientTop },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontSize: 22,
            fontWeight: "800",
            color: colors.text,
          },
        }}
      />

      <View style={styles.container}>
        <LinearGradient
          colors={[colors.gradientTop, colors.bg]}
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

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: "normal",
    marginBottom: 12,
    marginHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
});
