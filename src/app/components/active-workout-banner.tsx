import { useRoutineStore } from "@/store/routineStore";
import { useThemeStore } from "@/store/themeStore";
import { COLORS, useThemeColors } from "@/styles/appStyles";
import { useSegments, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ActiveWorkoutBanner() {
  const activeSession = useRoutineStore((s) => s.activeSession);
  const segments = useSegments();
  const router = useRouter();
  const colors = useThemeColors();
  const isLight = useThemeStore((s) => s.theme === "light");
  const insets = useSafeAreaInsets();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!activeSession) return;
    setElapsedSeconds(Math.floor((Date.now() - activeSession.startTime) / 1000));
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - activeSession.startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Hide if no active session
  if (!activeSession) return null;

  // Hide if we are already inside the active workout screen
  const isInsideWorkout = segments[segments.length - 1] === "[id]";
  if (isInsideWorkout) return null;

  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;
  const formattedTime = hrs > 0 
    ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <Pressable
      onPress={() => {
        router.push(
          `/workoutPage/workout-list/workout-thumbnail/${activeSession.workoutId}?routineID=${activeSession.routineId}&selectedDateString=${activeSession.selectedDateString}` as any
        );
      }}
      style={[
        styles.banner,
        { backgroundColor: colors.accent, paddingTop: insets.top || 16 }
      ]}
    >
      <View style={styles.content}>
        <View style={styles.left}>
          <Ionicons name="fitness" size={20} color={isLight ? "#141518" : "#141518"} />
          <Text style={[styles.text, { color: isLight ? "#141518" : "#141518" }]}>
            Workout in Progress
          </Text>
        </View>
        <Text style={[styles.time, { color: isLight ? "#141518" : "#141518" }]}>
          {formattedTime}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
  },
  time: {
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
});
