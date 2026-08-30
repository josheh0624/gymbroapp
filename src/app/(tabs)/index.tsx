import { api } from "@/lib/api";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Body, { type ExtendedBodyPart } from "react-native-body-highlighter";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  bg: "#141518",
  text: "#F5F6F7",
  textFaint: "#565A60",
  textMuted: "rgba(255,255,255,0.5)",
  accent: "#ffd61f",
  surface: "rgba(255,255,255,0.045)",
  surfaceBorder: "rgba(255,255,255,0.09)",
};

// Light red for 1 session this week, deep red for 2+ — still reads as
// "trained = red" but lets you spot under/over-trained groups at a glance.
const HIT_COLORS = ["#F87171", "#DC2626"];
const UNHIT_FILL = "#2B2D33";

// Maps muscle_groups.name -> this library's body-part slugs.
// Adjust the keys on the left to match what's actually in your table.
const MUSCLE_GROUP_TO_SLUG: Record<string, string[]> = {
  Chest: ["chest"],
  Back: ["upper-back", "lower-back"],
  Lats: ["upper-back"],
  "Upper Back": ["upper-back", "trapezius"],
  "Lower Back": ["lower-back"],
  Shoulders: ["deltoids"],
  Traps: ["trapezius"],
  Biceps: ["biceps"],
  Triceps: ["triceps"],
  Forearms: ["forearm"],
  Abs: ["abs", "obliques"],
  Core: ["abs", "obliques"],
  Quads: ["quadriceps"],
  Quadriceps: ["quadriceps"],
  Hamstrings: ["hamstring"],
  Glutes: ["gluteal"],
  Calves: ["calves"],
};

type WeeklyMuscleHit = {
  muscleGroupName: string;
  timesHit: number;
};

function useWeeklyMuscleHits() {
  const [data, setData] = useState<WeeklyMuscleHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await SecureStore.getItemAsync("token");
      const res = await fetch(`${api}/workouts/muscle-summary?range=week`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json: WeeklyMuscleHit[] = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't load this week's data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export default function MuscleMapScreen() {
  const { data, loading, error, refetch } = useWeeklyMuscleHits();
  const [side, setSide] = useState<"front" | "back">("front");

  const bodyData = useMemo(() => {
    const parts: ExtendedBodyPart[] = [];
    for (const hit of data) {
      const slugs = MUSCLE_GROUP_TO_SLUG[hit.muscleGroupName];
      if (!slugs) continue;
      const intensity = hit.timesHit >= 2 ? 2 : 1;
      for (const slug of slugs) {
        parts.push({ slug, intensity } as ExtendedBodyPart);
      }
    }
    return parts;
  }, [data]);

  return (
    <>
      <View style={styles.root}>
        <LinearGradient
          colors={["#1b1d23", COLORS.bg]}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Muscle Map</Text>
              <Text style={styles.subtitle}>
                {data.length > 0
                  ? `${data.length} muscle group${data.length === 1 ? "" : "s"} trained this week`
                  : "Nothing logged yet this week"}
              </Text>
            </View>

            <View style={styles.toggleRow}>
              {(["front", "back"] as const).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setSide(option)}
                  style={[
                    styles.toggleButton,
                    side === option && styles.toggleButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      side === option && styles.toggleTextActive,
                    ]}
                  >
                    {option === "front" ? "Front" : "Back"}
                  </Text>
                </Pressable>
              ))}
            </View>

            <BlurView intensity={20} tint="dark" style={styles.diagramCard}>
              {loading ? (
                <ActivityIndicator color={COLORS.accent} size="large" />
              ) : error ? (
                <View style={styles.errorState}>
                  <Text style={styles.errorText}>{error}</Text>
                  <Pressable onPress={refetch} style={styles.retryButton}>
                    <Text style={styles.retryText}>Retry</Text>
                  </Pressable>
                </View>
              ) : (
                <Body
                  data={bodyData}
                  side={side}
                  gender="male"
                  scale={1.4}
                  colors={HIT_COLORS}
                  defaultFill={UNHIT_FILL}
                  border="none"
                />
              )}
            </BlurView>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: HIT_COLORS[0] }]}
                />
                <Text style={styles.legendText}>Trained once</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: HIT_COLORS[1] }]}
                />
                <Text style={styles.legendText}>Trained 2+ times</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: UNHIT_FILL }]}
                />
                <Text style={styles.legendText}>Not yet</Text>
              </View>
            </View>

            {data.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                {data.map((hit) => (
                  <View key={hit.muscleGroupName} style={styles.chip}>
                    <Text style={styles.chipText}>{hit.muscleGroupName}</Text>
                    <Text style={styles.chipCount}>{hit.timesHit}×</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  title: { color: COLORS.text, fontSize: 24, fontWeight: "700" },
  subtitle: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
  toggleRow: {
    flexDirection: "row",
    alignSelf: "center",
    marginTop: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    padding: 4,
    gap: 4,
  },
  toggleButton: { paddingVertical: 8, paddingHorizontal: 24, borderRadius: 9 },
  toggleButtonActive: { backgroundColor: COLORS.accent },
  toggleText: { color: COLORS.textFaint, fontSize: 14, fontWeight: "600" },
  toggleTextActive: { color: COLORS.bg },
  diagramCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 380,
    overflow: "hidden",
  },
  errorState: { alignItems: "center", gap: 12, padding: 24 },
  errorText: { color: COLORS.textMuted, textAlign: "center" },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
  },
  retryText: { color: COLORS.bg, fontWeight: "700" },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: COLORS.textFaint, fontSize: 12 },
  chipRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: { color: COLORS.text, fontSize: 13, fontWeight: "500" },
  chipCount: { color: COLORS.accent, fontSize: 13, fontWeight: "700" },
});
