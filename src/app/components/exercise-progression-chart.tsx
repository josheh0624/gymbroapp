import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { ScrollView, Pressable, Modal, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { BlurView } from "expo-blur";
import { supabase } from "@/api/supabase";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useThemeColors } from "@/styles/appStyles";
import { LineChart } from "react-native-gifted-charts";
import dayjs from "dayjs";
import Ionicons from "@expo/vector-icons/Ionicons";

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
  const { weightUnit } = useSettingsStore();
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | number | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

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
      const rawWeight = log.weight;
      const weight = weightUnit === "kgs" ? Number((rawWeight * 0.453592).toFixed(1)) : rawWeight;
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
      <BlurView intensity={isLight ? 40 : 20} tint={isLight ? "extraLight" : "dark"} style={[styles.glassCard, { justifyContent: "center", alignItems: "center", height: 200 }]}>
        <ActivityIndicator color={colors.accent} />
      </BlurView>
    );
  }

  if (availableExercises.length === 0) {
    return (
      <BlurView intensity={isLight ? 40 : 20} tint={isLight ? "extraLight" : "dark"} style={styles.glassCard}>
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
    <BlurView intensity={isLight ? 40 : 20} tint={isLight ? "extraLight" : "dark"} style={styles.glassCard}>
      <View style={styles.innerContainer}>
      <Text style={styles.sectionTitle}>Exercise Progression</Text>
      
      <View style={styles.dropdownContainer}>
        <Pressable
          style={styles.dropdownButton}
          onPress={() => setDropdownVisible(true)}
        >
          <Text style={styles.dropdownButtonText}>
            {availableExercises.find(e => e.id === selectedExerciseId)?.name || "Select Exercise"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.text} />
        </Pressable>
      </View>

      <Modal visible={dropdownVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Exercise</Text>
            <ScrollView style={styles.modalScroll}>
              {availableExercises.map((ex) => {
                const isActive = ex.id === selectedExerciseId;
                return (
                  <TouchableOpacity
                    key={ex.id}
                    style={[styles.modalOption, isActive && styles.modalOptionActive]}
                    onPress={() => {
                      setSelectedExerciseId(ex.id);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, isActive && styles.modalOptionTextActive]}>
                      {ex.name}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={20} color={colors.text} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

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
  dropdownContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  dropdownButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 40,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  modalScroll: {
    paddingHorizontal: 16,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  modalOptionActive: {
    backgroundColor: colors.surface,
  },
  modalOptionText: {
    color: colors.text,
    fontSize: 16,
  },
  modalOptionTextActive: {
    fontWeight: "bold",
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
