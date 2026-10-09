import { supabase } from "@/api/supabase";
import AiChatModal from "@/app/components/ai-chat-modal";
import ExerciseProgressionChart from "@/app/components/exercise-progression-chart";
import { MeshGradientBackground } from "@/app/components/MeshGradientBackground";
import { YearlyHeatmap } from "@/app/components/YearlyHeatmap";
import { useAuthStore } from "@/store/authStore";
import { useHealthStore } from "@/store/healthStore";
import { useRoutineStore } from "@/store/routineStore"; // adjust to your actual path
import { useThemeStore } from "@/store/themeStore";
import { COLORS, ThemeColors, useThemeColors } from "@/styles/appStyles";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import dayjs, { type Dayjs } from "dayjs";
import { BlurView } from "expo-blur";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useWeeklyMuscleHits,
  getWeekBounds,
  formatWeekRange,
  computeLongestStreak,
  computeTrailingStreak,
  WeeklyMuscleHit,
  DailyActivity,
  WeeklyStats,
} from "@/app/hooks/useWeeklyMuscleActivity";
import { MuscleAnatomyViewer } from "@/app/components/MuscleAnatomyViewer";

function WeekDots({ dailyActivity }: { dailyActivity: DailyActivity[] }) {
  const colors = useThemeColors();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  if (dailyActivity.length === 0) return <View style={styles.weekDotsRow} />;

  return (
    <View style={styles.weekDotsRow}>
      {dailyActivity.map((day) => (
        <View key={day.date} style={styles.weekDotItem}>
          <View style={[styles.weekDot, day.trained && styles.weekDotFilled]}>
            {day.trained && (
              <Ionicons
                name="checkmark"
                size={11}
                color={isLight ? "#FFF" : "#141518"}
              />
            )}
          </View>
          <Text style={styles.weekDotLabel}>
            {dayjs(day.date).format("dd").charAt(0)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function IconButton({
  icon,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useThemeColors();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => [
        styles.navIcon,
        pressed && styles.navIconPressed,
        disabled && styles.navIconDisabled,
      ]}
    >
      <Ionicons name={icon} size={18} color={COLORS.text} />
    </Pressable>
  );
}

export default function MuscleMapScreen() {
  const dayWidth = (Dimensions.get("window").width - 32 - 40) / 7;
  const colors = useThemeColors();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  const styles = useMemo(() => getStyles(colors, isLight), [colors, isLight]);

  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const activeSession = useRoutineStore((s) => s.activeSession);
  const initials = useMemo(
    () => user?.username?.slice(0, 2).toUpperCase() ?? "?",
    [user?.username],
  );
  const [weekOffset, setWeekOffset] = useState(0);
  const stepsScrollRef = useRef<ScrollView>(null);
  const calsScrollRef = useRef<ScrollView>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const {
    data,
    stats,
    prevStats,
    monthlyStats,
    monthlyActivity,
    dailyActivity,
    loading,
    error,
    refetch,
  } = useWeeklyMuscleHits(weekOffset);

  const isCurrentWeek = weekOffset === 0;
  const weekBounds = useMemo(() => getWeekBounds(weekOffset), [weekOffset]);
  const weekRange = formatWeekRange(weekBounds.start, weekBounds.end);

  const router = useRouter();

  const {
    hasPermissions,
    requestPermissions,
    fetchWeeklyData,
    dailyData,
    isLoading: healthLoading,
  } = useHealthStore();

  useFocusEffect(
    useCallback(() => {
      if (hasPermissions) {
        fetchWeeklyData();
      }
    }, [hasPermissions]),
  );

  const streak = useMemo(() => {
    if (isCurrentWeek) {
      return stats?.currentStreak ?? computeTrailingStreak(dailyActivity);
    }
    return computeLongestStreak(dailyActivity);
  }, [isCurrentWeek, stats?.currentStreak, dailyActivity]);

  const hasActiveStreak = streak > 0;

  const workedOutToday = useMemo(() => {
    const todayStr = dayjs().format("YYYY-MM-DD");
    const todayActivity = dailyActivity.find((d) => d.date === todayStr);
    return todayActivity?.trained ?? false;
  }, [dailyActivity]);

  const setStreakData = useRoutineStore((s) => s.setStreakData);
  useEffect(() => {
    setStreakData(streak, workedOutToday);
  }, [streak, workedOutToday, setStreakData]);

  const mostTrained = useMemo(() => {
    if (!data.length) return null;
    return [...data].sort((a, b) => b.timesHit - a.timesHit)[0];
  }, [data]);

  const muscleCount = data.length;

  const avgSets = useMemo(() => {
    if (!stats || stats.totalWorkouts === 0) return "0";
    return (stats.totalSets / stats.totalWorkouts).toFixed(1);
  }, [stats]);

  const restDays = useMemo(() => {
    if (!stats) return 0;
    const daysElapsed = isCurrentWeek
      ? Math.min(7, dayjs().diff(weekBounds.start, "day") + 1)
      : 7;
    return Math.max(0, daysElapsed - stats.daysTrained);
  }, [stats, isCurrentWeek, weekBounds.start]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.page}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          bounces={false}
        >
          {/* Big Background Container for everything up to the Muscle Map */}
          <View style={styles.gradientContainer}>
            <MeshGradientBackground />

            <View style={{ paddingTop: (activeSession ? 0 : insets.top) + 16 }}>
              {/* Brand Header */}
              <View style={styles.brandHeader}>
                <Text style={styles.brandTitle}>gymBro</Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    zIndex: 2,
                    gap: 12,
                  }}
                >
                  <View
                    style={[
                      styles.streakPill,
                      workedOutToday && { backgroundColor: "#4169E1" },
                    ]}
                  >
                    <Ionicons
                      name="flame"
                      size={20}
                      color={workedOutToday ? "#FFFFFF" : "#4169E1"}
                    />
                    <Text
                      style={[
                        styles.streakText,
                        workedOutToday && { color: "#FFFFFF" },
                      ]}
                    >
                      {streak}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Week Strip (Borderless) */}
              <View style={styles.weekStripMinimal}>
                <View style={styles.weekWidgetTop}>
                  <Text style={styles.weekPagerText}>
                    {isCurrentWeek ? "This Week" : weekRange}
                  </Text>
                  <View style={styles.weekStripInner}>
                    <Pressable
                      onPress={() => setWeekOffset((o) => o - 1)}
                      style={styles.navIcon}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={16}
                        color={colors.text}
                      />
                    </Pressable>
                    <Pressable
                      onPress={() => setWeekOffset((o) => o + 1)}
                      disabled={isCurrentWeek}
                      style={[
                        styles.navIcon,
                        isCurrentWeek && { opacity: 0.25 },
                      ]}
                    >
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.text}
                      />
                    </Pressable>
                  </View>
                </View>

                {dailyActivity.length > 0 && (
                  <View style={styles.weekDotsRow}>
                    {dailyActivity.map((day) => (
                      <View key={day.date} style={styles.weekDotItem}>
                        <View
                          style={[
                            styles.weekDot,
                            day.trained && styles.weekDotFilled,
                          ]}
                        >
                          {day.trained && (
                            <Ionicons
                              name="checkmark"
                              size={14}
                              color={isLight ? "#FFF" : "#141518"}
                            />
                          )}
                        </View>
                        <Text style={styles.weekDotLabel}>
                          {dayjs(day.date).format("dd").charAt(0)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Muscle Anatomy Activity */}
              <MuscleAnatomyViewer
                data={data}
                loading={loading}
                error={error}
                refetch={refetch}
                colors={colors}
                isLight={isLight}
              />
            </View>
          </View>

          {/* Yearly Consistency Chart */}
          <View
            style={[
              styles.servicesSection,
              { marginTop: 40, paddingTop: 0, paddingBottom: 0 },
            ]}
          >
            <View style={[styles.chartContainer, { paddingHorizontal: 0 }]}>
              <YearlyHeatmap />
            </View>
          </View>
          <View style={{ marginTop: 16 }}>
            <ExerciseProgressionChart />
          </View>

          {/* HealthKit Integration */}
          {!hasPermissions ? (
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  padding: 24,
                  alignItems: "center",
                  marginBottom: 24,
                  marginHorizontal: 16,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => requestPermissions()}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "rgba(255, 59, 48, 0.1)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <MaterialCommunityIcons
                  name="heart-pulse"
                  size={24}
                  color="#FF3B30"
                />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "800",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Connect Apple Fitness
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                Sync your daily steps and active calories directly from Apple
                Health.
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ paddingHorizontal: 16 }}>
              {/* Steps Graph */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, marginBottom: 16 },
                ]}
              >
                <View style={[styles.cardHeader, { paddingHorizontal: 20 }]}>
                  <Text style={styles.cardTitle}>Daily Steps</Text>
                  <MaterialCommunityIcons
                    name="shoe-sneaker"
                    size={20}
                    color="#FF9500"
                  />
                </View>
                {healthLoading ? (
                  <View
                    style={{
                      height: 160,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator color="#FF9500" />
                  </View>
                ) : (
                  <View style={{ paddingHorizontal: 20 }}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={dayWidth * 7}
                      decelerationRate="fast"
                      ref={stepsScrollRef}
                      onContentSizeChange={() =>
                        stepsScrollRef.current?.scrollToEnd({ animated: false })
                      }
                      style={{ height: 160 }}
                      contentContainerStyle={{
                        alignItems: "flex-end",
                        paddingBottom: 20,
                      }}
                    >
                      {dailyData.map((day, i) => {
                        const maxSteps = Math.max(
                          ...dailyData.map((d) => d.steps),
                          5000,
                        );
                        const heightPercent = (day.steps / maxSteps) * 100;
                        const dateObj = new Date(day.date + "T12:00:00Z");
                        const dayName = dateObj.toLocaleDateString("en-US", {
                          weekday: "short",
                        });
                        const isToday = i === dailyData.length - 1;

                        return (
                          <View
                            key={day.date}
                            style={{ alignItems: "center", width: dayWidth }}
                          >
                            <Text
                              style={{
                                color: colors.text,
                                fontSize: 10,
                                fontWeight: "700",
                                marginBottom: 6,
                              }}
                            >
                              {day.steps > 0
                                ? day.steps > 999
                                  ? (day.steps / 1000).toFixed(1) + "k"
                                  : day.steps
                                : ""}
                            </Text>
                            <View
                              style={{
                                width: 24,
                                height: 100,
                                justifyContent: "flex-end",
                              }}
                            >
                              <View
                                style={{
                                  width: "100%",
                                  height: `${heightPercent}%`,
                                  backgroundColor: isToday
                                    ? "#FF9500"
                                    : "rgba(255, 149, 0, 0.2)",
                                  borderRadius: 6,
                                  minHeight: 4,
                                }}
                              />
                            </View>
                            <Text
                              style={{
                                color: isToday ? colors.text : colors.textMuted,
                                fontSize: 11,
                                marginTop: 8,
                                fontWeight: isToday ? "700" : "500",
                              }}
                            >
                              {dayName}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Calories Graph */}
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, marginBottom: 24 },
                ]}
              >
                <View style={[styles.cardHeader, { paddingHorizontal: 20 }]}>
                  <Text style={styles.cardTitle}>Active Calories</Text>
                  <MaterialCommunityIcons
                    name="fire"
                    size={20}
                    color="#FF3B30"
                  />
                </View>
                {healthLoading ? (
                  <View
                    style={{
                      height: 160,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator color="#FF3B30" />
                  </View>
                ) : (
                  <View style={{ paddingHorizontal: 20 }}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      snapToInterval={dayWidth * 7}
                      decelerationRate="fast"
                      ref={calsScrollRef}
                      onContentSizeChange={() =>
                        calsScrollRef.current?.scrollToEnd({ animated: false })
                      }
                      style={{ height: 160 }}
                      contentContainerStyle={{
                        alignItems: "flex-end",
                        paddingBottom: 20,
                      }}
                    >
                      {dailyData.map((day, i) => {
                        const maxCals = Math.max(
                          ...dailyData.map((d) => d.activeEnergyBurned),
                          500,
                        );
                        const heightPercent =
                          (day.activeEnergyBurned / maxCals) * 100;
                        const dateObj = new Date(day.date + "T12:00:00Z");
                        const dayName = dateObj.toLocaleDateString("en-US", {
                          weekday: "short",
                        });
                        const isToday = i === dailyData.length - 1;

                        return (
                          <View
                            key={day.date}
                            style={{ alignItems: "center", width: dayWidth }}
                          >
                            <Text
                              style={{
                                color: colors.text,
                                fontSize: 10,
                                fontWeight: "700",
                                marginBottom: 6,
                              }}
                            >
                              {day.activeEnergyBurned > 0
                                ? Math.round(day.activeEnergyBurned)
                                : ""}
                            </Text>
                            <View
                              style={{
                                width: 24,
                                height: 100,
                                justifyContent: "flex-end",
                              }}
                            >
                              <View
                                style={{
                                  width: "100%",
                                  height: `${heightPercent}%`,
                                  backgroundColor: isToday
                                    ? "#FF3B30"
                                    : "rgba(255, 59, 48, 0.2)",
                                  borderRadius: 6,
                                  minHeight: 4,
                                }}
                              />
                            </View>
                            <Text
                              style={{
                                color: isToday ? colors.text : colors.textMuted,
                                fontSize: 11,
                                marginTop: 8,
                                fontWeight: isToday ? "700" : "500",
                              }}
                            >
                              {dayName}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          )}
          {/* Weekly Stats "Modular" Grid */}

          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Weekly Stats</Text>

            <View style={styles.servicesGrid}>
              {(() => {
                const renderStat = (
                  icon: string,
                  label: string,
                  value: number,
                  prevValue: number | undefined | null,
                  unit: string = "",
                ) => {
                  const diff =
                    prevValue !== undefined && prevValue !== null
                      ? value - prevValue
                      : 0;
                  // For stats like 'Workouts', a positive diff is good.
                  const isPositive = diff > 0;
                  const isNegative = diff < 0;
                  const color = isPositive ? "#30D158" : "#FF453A";
                  const bgColor = isPositive
                    ? colors.successBg
                    : colors.errorBg;

                  return (
                    <View style={styles.servicePill}>
                      <View style={styles.serviceIconWrap}>
                        <Ionicons
                          name={icon as any}
                          size={16}
                          color="#4169E1"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Text
                            style={styles.serviceValue}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {value}
                            {unit}
                          </Text>
                          {diff !== 0 && (
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                backgroundColor: bgColor,
                                paddingHorizontal: 4,
                                paddingVertical: 2,
                                borderRadius: 6,
                              }}
                            >
                              <Ionicons
                                name={
                                  isPositive ? "trending-up" : "trending-down"
                                }
                                size={10}
                                color={color}
                                style={{ marginRight: 2 }}
                              />
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: "800",
                                  color: color,
                                }}
                              >
                                {Math.abs(diff)}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.serviceLabel} numberOfLines={1}>
                          {label}
                        </Text>
                      </View>
                    </View>
                  );
                };

                const current = stats || {
                  totalWorkouts: 0,
                  daysTrained: 0,
                  totalSets: 0,
                  totalExercises: 0,
                  totalVolume: 0,
                };
                const prev = prevStats || {
                  totalWorkouts: 0,
                  daysTrained: 0,
                  totalSets: 0,
                  totalExercises: 0,
                  totalVolume: 0,
                };

                // Calculate averages safely
                const avgSets =
                  current.totalWorkouts > 0
                    ? Math.round(current.totalSets / current.totalWorkouts)
                    : 0;
                const prevAvgSets =
                  prev.totalWorkouts > 0
                    ? Math.round(prev.totalSets / prev.totalWorkouts)
                    : 0;

                return (
                  <>
                    {renderStat(
                      "barbell",
                      "Workouts",
                      current.totalWorkouts,
                      prev.totalWorkouts,
                    )}
                    {renderStat(
                      "time",
                      "Days Trained",
                      current.daysTrained,
                      prev.daysTrained,
                    )}
                    {renderStat(
                      "layers",
                      "Total Sets",
                      current.totalSets,
                      prev.totalSets,
                    )}
                    {renderStat(
                      "calculator",
                      "Avg Sets/WO",
                      avgSets,
                      prevAvgSets,
                    )}
                    {renderStat(
                      "fitness",
                      "Total Exercises",
                      current.totalExercises,
                      prev.totalExercises,
                    )}
                    {renderStat(
                      "analytics",
                      "Total Volume",
                      current.totalVolume || 0,
                      prev.totalVolume || 0,
                      " lb",
                    )}
                  </>
                );
              })()}
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Floating AI Button (Bottom Right above tabs bar) */}
        <Pressable
          style={({ pressed }) => [
            styles.aiButton,
            pressed && styles.aiButtonPressed,
          ]}
          onPress={() => setIsChatOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="AI"
        >
          <Text style={styles.aiButtonText}>AI</Text>
        </Pressable>

        {/* AI Chat Modal */}
        <AiChatModal
          visible={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </View>
    </>
  );
}

const getStyles = (colors: ThemeColors, isLight: boolean) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.bg },
    gradientContainer: {
      borderBottomLeftRadius: 60,
      borderBottomRightRadius: 60,
      overflow: "hidden",
      marginHorizontal: 0,
      marginTop: 0,
    },
    brandHeader: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 16,
      position: "relative",
    },
    brandTitle: {
      position: "absolute",
      left: 0,
      right: 0,
      textAlign: "center",
      color: colors.text,
      fontSize: 22,
      fontWeight: "900",
      letterSpacing: -0.5,
      zIndex: 1,
    },
    headerTop: {
      alignItems: "flex-start",
      justifyContent: "center",
      paddingHorizontal: 20,
      marginBottom: 32,
      marginTop: 8,
    },
    welcomeContainer: { alignItems: "flex-start" },
    welcomeBack: {
      color: colors.textMuted,
      fontSize: 16,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    userName: {
      color: colors.text,
      fontSize: 34,
      fontWeight: "bold",
      letterSpacing: 0.35,
    },
    streakPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.accentMuted,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      gap: 6,
    },
    streakText: {
      color: "#4169E1",
      fontSize: 16,
      fontWeight: "800",
    },
    glassCard: {
      marginHorizontal: 8,
      borderRadius: 48,
      padding: 20,
      marginBottom: 8,
      backgroundColor: colors.surface, // Smoked glass base
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      overflow: "hidden",
    },
    weekStripMinimal: {
      width: "100%",
      paddingHorizontal: 24,
      marginBottom: 32,
    },
    weekWidgetTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    weekPagerText: { color: colors.text, fontSize: 18, fontWeight: "800" },
    weekStripInner: { flexDirection: "row", alignItems: "center" },
    navIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
      backgroundColor: colors.surfaceBorder,
    },
    navIconPressed: { opacity: 0.5 },
    navIconDisabled: { opacity: 0.25 },
    weekDotsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 0,
    },
    weekDotItem: { alignItems: "center", gap: 6 },
    weekDot: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: colors.surfaceBorder,
      backgroundColor: "rgba(0,0,0,0.1)",
    },
    weekDotFilled: { backgroundColor: colors.text, borderColor: colors.text },
    weekDotLabel: {
      color: colors.text,
      fontSize: 12,
      fontWeight: "600",
    },
    mapContainer: { position: "relative" },
    loadingOverlay: {
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    errorState: { padding: 40, alignItems: "center" },
    errorText: { color: "#ff6b6b", marginBottom: 12, textAlign: "center" },
    retryBtn: {
      backgroundColor: colors.surfaceBorder,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    retryText: { color: colors.text, fontSize: 13, fontWeight: "bold" },
    mapToggle: {
      flexDirection: "row",
      alignSelf: "center",
      backgroundColor: isLight ? "transparent" : "rgba(0,0,0,0.3)",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 20,
      padding: 4,
      marginBottom: 20,
      zIndex: 2,
    },
    mapToggleButton: {
      paddingHorizontal: 20,
      paddingVertical: 6,
      borderRadius: 16,
    },
    mapToggleButtonActive: { backgroundColor: "#4169E1" },
    mapToggleText: { color: colors.text, fontSize: 13, fontWeight: "bold" },
    mapToggleTextActive: { color: "#141518" },
    bodyCropBox: {
      height: 500, // INCREASED TO AVOID CLIPPING LEGS
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "flex-start",
    },
    servicesSection: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 40,
      marginTop: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: "600",
      letterSpacing: 0.35,
      marginBottom: 16,
    },
    servicesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 12,
    },
    servicePill: {
      width: "48%",
      backgroundColor: colors.surface,
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    serviceIconWrap: {
      backgroundColor: colors.accentMuted,
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    serviceValue: { color: colors.text, fontSize: 15, fontWeight: "700" },
    serviceLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: "500",
      marginTop: 2,
    },
    chartContainer: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    chartBarsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
    },
    chartCol: {
      alignItems: "center",
      width: "22%",
    },
    barBackground: {
      width: 20,
      height: 100,
      backgroundColor: isLight ? "transparent" : "rgba(0,0,0,0.3)",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
      borderRadius: 10,
      justifyContent: "flex-end",
      marginBottom: 10,
    },
    card: {
      borderRadius: 24,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 20,
      paddingBottom: 16,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
    },
    barFill: {
      width: "100%",
      borderRadius: 10,
    },
    chartLabel: {
      color: colors.textMuted,
      fontSize: 9,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    chartValue: {
      color: colors.text,
      fontSize: 13,
      fontWeight: "800",
      marginTop: 4,
    },
    aiButton: {
      position: "absolute",
      right: 20,
      bottom: 104,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "#4169E1",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 999,
      elevation: 10,
      shadowColor: "#4169E1",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      borderWidth: 1.5,
      borderColor: "rgba(255, 255, 255, 0.25)",
    },
    aiButtonPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.94 }],
    },
    aiButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.5,
    },
  });
