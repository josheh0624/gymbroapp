import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { ScrollView, Pressable } from "react-native";
import { BlurView } from "expo-blur";
import { supabase } from "@/api/supabase";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useThemeColors } from "@/styles/appStyles";
import { LineChart } from "react-native-gifted-charts";
import dayjs from "dayjs";

type LogEntry = {
  completed_at: string;
  weight: number;
  workout_exercises: {
    exercises: {
      id: string | number;
      name: string;
    };
  };
};

export default function ExerciseProgressionChart() {
  const { user } = useAuthStore();
  const isLight = useThemeStore((state) => state.theme === "light");
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | number | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      if (!user?.id) return;
      setLoading(true);
      try {
        const thirtyDaysAgo = dayjs().subtract(30, "day").toISOString();
        const { data, error } = await supabase
          .from("workout_log")
          .select(`
            completed_at,
            weight,
            workout_exercises (
              exercises (
                id,
                name
              )
            )
          `)
          .eq("user_id", user.id)
          .gte("completed_at", thirtyDaysAgo)
          .order("completed_at", { ascending: true });

        if (error) throw error;
        setLogs((data as any[]) || []);
      } catch (err) {
        console.error("Error fetching progression logs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [user?.id]);

  // Extract unique exercises from the logs
  const availableExercises = useMemo(() => {
    const map = new Map<string | number, string>();
    logs.forEach((log) => {
      const ex = log.workout_exercises?.exercises;
      const weight = log.weight;
      if (ex && weight != null) {
        map.set(ex.id, ex.name);
      }
    });
    const list = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    // Sort alphabetically
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [logs]);

  // Auto-select first exercise
  useEffect(() => {
    if (availableExercises.length > 0 && selectedExerciseId === null) {
      setSelectedExerciseId(availableExercises[0].id);
    }
  }, [availableExercises, selectedExerciseId]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!selectedExerciseId) return [];
    
    // Filter logs for selected exercise
    const filtered = logs.filter((log) => {
      const ex = log.workout_exercises?.exercises;
      const weight = log.weight;
      return ex?.id === selectedExerciseId && weight != null;
    });

    // Group by day to prevent multiple dots on same day (take max weight for the day)
    const dailyMax = new Map<string, number>();
    filtered.forEach((log) => {
      const date = dayjs(log.completed_at).format("MMM D");
      const weight = log.weight;
      const existing = dailyMax.get(date) || 0;
      if (weight > existing) {
        dailyMax.set(date, weight);
      }
    });

    return Array.from(dailyMax.entries()).map(([date, weight]) => ({
      value: weight,
      label: date,
      dataPointText: String(weight),
    }));
  }, [logs, selectedExerciseId]);

  if (loading) {
    return (
      <BlurView intensity={20} tint={isLight ? "light" : "dark"} style={[styles.glassCard, { justifyContent: "center", alignItems: "center", height: 200 }]}>
        <ActivityIndicator color={colors.accent} />
      </BlurView>
    );
  }

  if (availableExercises.length === 0) {
    return (
      <BlurView intensity={20} tint={isLight ? "light" : "dark"} style={styles.glassCard}>
        <View style={styles.innerContainer}>
          <Text style={styles.sectionTitle}>Exercise Progression</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No weighted exercises logged in the past 30 days.</Text>
          </View>
        </View>
      </BlurView>
    );
  }

  return (
    <BlurView intensity={20} tint={isLight ? "light" : "dark"} style={styles.glassCard}>
      <View style={styles.innerContainer}>
      <Text style={styles.sectionTitle}>Exercise Progression</Text>
      
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          {availableExercises.map((ex) => {
            const isActive = ex.id === selectedExerciseId;
            return (
              <Pressable
                key={ex.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setSelectedExerciseId(ex.id)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {ex.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.chartWrapper}>
        {chartData.length > 0 ? (
          <LineChart
            data={chartData}
            width={Dimensions.get("window").width - 80}
            height={180}
            spacing={60}
            initialSpacing={20}
            color1={colors.accent}
            dataPointsColor1={colors.accent}
            startFillColor1={colors.accentMuted}
            endFillColor1="transparent"
            startOpacity={0.8}
            endOpacity={0.1}
            yAxisTextStyle={{ color: colors.textFaint, fontSize: 10 }}
            xAxisLabelTextStyle={{ color: colors.textFaint, fontSize: 10 }}
            textFontSize={10}
            textColor1={colors.text}
            hideRules
            thickness={3}
            areaChart
            curved
            isAnimated
            animationDuration={800}
            yAxisThickness={0}
            xAxisThickness={0}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No data to chart.</Text>
          </View>
        )}
      </View>
      </View>
    </BlurView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  glassCard: {
    marginHorizontal: 16,
    borderRadius: 32,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: "hidden",
    marginBottom: 24,
  },
  innerContainer: {
    paddingTop: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  chipsContainer: {
    marginBottom: 20,
    marginTop: 4,
  },
  chipsScroll: {
    paddingHorizontal: 24,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#000",
    fontWeight: "700",
  },
  chartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  emptyContainer: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  }
});
