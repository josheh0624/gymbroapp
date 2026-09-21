import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/api/supabase';
import { useThemeColors } from '@/styles/appStyles';
import { useThemeStore } from '@/store/themeStore';
import { Ionicons } from '@expo/vector-icons';

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function YearlyHeatmap() {
  const colors = useThemeColors();
  const { theme } = useThemeStore();
  const isLight = theme === "light";
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [activityDates, setActivityDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const startDate = `${selectedYear}-01-01T00:00:00.000Z`;
      const endDate = `${selectedYear}-12-31T23:59:59.999Z`;

      const { data, error } = await supabase
        .from('workout_log')
        .select('completed_at')
        .eq('user_id', userData.user.id)
        .gte('completed_at', startDate)
        .lte('completed_at', endDate);

      if (!error && data) {
        const dates = new Set<string>();
        data.forEach((log) => {
          // Parse as UTC to match the db
          const dateStr = log.completed_at.split('T')[0];
          dates.add(dateStr);
        });
        setActivityDates(dates);
      }
      setLoading(false);
    }
    fetchLogs();
  }, [selectedYear]);

  // Generate grid structure
  const { weeks, monthLabels } = useMemo(() => {
    const firstDayOfYear = new Date(selectedYear, 0, 1);
    const lastDayOfYear = new Date(selectedYear, 11, 31);
    
    // Find the Sunday on or before Jan 1
    const startDate = new Date(firstDayOfYear);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // Find the Saturday on or after Dec 31
    const endDate = new Date(lastDayOfYear);
    if (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    const weeksArray: Date[][] = [];
    let currentDate = new Date(startDate);
    const mLabels: { text: string, colIndex: number }[] = [];
    let lastMonth = -1;

    while (currentDate <= endDate) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const dayCopy = new Date(currentDate);
        week.push(dayCopy);
        
        if (dayCopy.getFullYear() === selectedYear && dayCopy.getMonth() !== lastMonth && dayCopy.getDate() <= 7) {
          mLabels.push({ text: MONTHS[dayCopy.getMonth()], colIndex: weeksArray.length });
          lastMonth = dayCopy.getMonth();
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeksArray.push(week);
    }

    return { weeks: weeksArray, monthLabels: mLabels };
  }, [selectedYear]);

  const squareSize = 14;
  const gap = 4;

  return (
    <View style={styles.container}>
      {/* Header: Title & Year Selector */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Days Trained</Text>
        <View style={styles.yearSelector}>
          <TouchableOpacity onPress={() => setSelectedYear(y => y - 1)} style={styles.arrowButton}>
            <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.yearText, { color: colors.text }]}>{selectedYear}</Text>
          <TouchableOpacity 
            onPress={() => setSelectedYear(y => y + 1)} 
            style={styles.arrowButton}
            disabled={selectedYear === currentYear}
          >
            <Ionicons name="chevron-forward" size={16} color={selectedYear === currentYear ? 'transparent' : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Heatmap Grid */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        ref={scrollViewRef}
        onContentSizeChange={() => {
          if (selectedYear === currentYear) {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }
        }}
      >
        <View>
          {/* Month Labels Row */}
          <View style={[styles.monthLabelsRow, { height: 20 }]}>
            {monthLabels.map((label, idx) => (
              <Text 
                key={idx} 
                style={[
                  styles.monthLabelText, 
                  { color: colors.textMuted, position: 'absolute', left: label.colIndex * (squareSize + gap) }
                ]}
              >
                {label.text}
              </Text>
            ))}
          </View>

          <View style={styles.gridContainer}>
            {/* Day of Week Labels */}
            <View style={[styles.dayLabelsCol, { gap }]}>
              {DAYS_OF_WEEK.map((day, idx) => (
                <View key={idx} style={{ height: squareSize, justifyContent: 'center' }}>
                  {(idx === 1 || idx === 3 || idx === 5) && (
                    <Text style={[styles.dayLabelText, { color: colors.textMuted }]}>{day}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* The Weeks */}
            {loading ? (
               <View style={styles.loaderContainer}>
                 <ActivityIndicator size="small" color="#4169E1" />
               </View>
            ) : (
              weeks.map((week, wIdx) => (
                <View key={wIdx} style={{ gap }}>
                  {week.map((date, dIdx) => {
                    const isCurrentYear = date.getFullYear() === selectedYear;
                    const dateStr = date.toISOString().split('T')[0];
                    const isTrained = activityDates.has(dateStr);
                    const isFuture = date > new Date();

                    let bgColor = isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.05)";
                    if (isTrained) bgColor = "#4169E1";
                    if (!isCurrentYear) bgColor = "transparent";

                    return (
                      <View 
                        key={dIdx} 
                        style={{
                          width: squareSize,
                          height: squareSize,
                          borderRadius: 4,
                          backgroundColor: bgColor,
                          opacity: isFuture ? 0.2 : 1
                        }}
                      />
                    );
                  })}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
    paddingTop: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  arrowButton: {
    padding: 4,
  },
  yearText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  monthLabelsRow: {
    marginLeft: 32, // Offset for the Day labels column
    flexDirection: 'row',
  },
  monthLabelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dayLabelsCol: {
    width: 24,
    justifyContent: 'flex-start',
    marginRight: 4,
  },
  dayLabelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
