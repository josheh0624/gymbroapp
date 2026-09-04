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

type WeeklyStats = {
  totalWorkouts: number;
  totalSets: number;
  totalExercises: number;
  daysTrained: number;
};

type WeeklySummaryResponse = {
  muscleHits: WeeklyMuscleHit[];
  stats: WeeklyStats;
};

function useWeeklyMuscleHits() {
  const [data, setData] = useState<WeeklyMuscleHit[]>([]);
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await SecureStore.getItemAsync("token"); // match your real key name
      const res = await fetch(`${api}/workouts/muscle-summary?range=week`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json: WeeklySummaryResponse = await res.json();
      setData(json.muscleHits);
      setStats(json.stats);
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

  return { data, stats, loading, error, refetch: fetchData };
}

export default function MuscleMapScreen() {
  const { data, stats, loading, error, refetch } = useWeeklyMuscleHits();
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

  const mostTrained = useMemo(() => {
    if (data.length === 0) return null;
    return data.reduce((max, curr) =>
      curr.timesHit > max.timesHit ? curr : max,
    );
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

            {stats && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionLabel}>This Week</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
                    <Text style={styles.statLabel}>Workouts</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.daysTrained}/7</Text>
                    <Text style={styles.statLabel}>Days trained</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalSets}</Text>
                    <Text style={styles.statLabel}>Sets</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalExercises}</Text>
                    <Text style={styles.statLabel}>Exercises</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{data.length}</Text>
                    <Text style={styles.statLabel}>Muscle groups</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text
                      style={[styles.statValue, styles.statValueAccent]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                    >
                      {mostTrained ? mostTrained.muscleGroupName : "—"}
                    </Text>
                    <Text style={styles.statLabel}>Most trained</Text>
                  </View>
                </View>
              </View>
            )}

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
  statsSection: { marginTop: 20, paddingHorizontal: 20 },
  sectionLabel: {
    color: COLORS.textFaint,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flexBasis: "31%",
    flexGrow: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 4,
  },
  statValue: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  statValueAccent: { color: COLORS.accent, fontSize: 16 },
  statLabel: { color: COLORS.textFaint, fontSize: 11, textAlign: "center" },
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
