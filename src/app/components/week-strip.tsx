import { useThemeColors } from "@/styles/appStyles";
import moment from "moment";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const COLORS = {
  text: "#FFFFFF",
  textMuted: "rgba(255,255,255,0.5)",
  accent: "#ffd33d",
  accentText: "#141518",
};

type Props = {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

export default function WeekStrip({
  selectedDate,
  onSelectDate,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const today = new Date();
  const startOfWeek = useMemo(() => {
    const date = new Date(today);
    const dow = today.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    date.setDate(today.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [today]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  }, [startOfWeek]);

  const handleSelectDay = (date: Date) => {
    onSelectDate(date);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {weekDays.map((day, index) => {
          const isSelected = day.toDateString() === selectedDate.toDateString();
          const isToday = day.toDateString() === today.toDateString();

          return (
            <Pressable
              key={`${day.toISOString()}-${index}`}
              onPress={() => handleSelectDay(day)}
              style={styles.dayColumn}
              hitSlop={4}
            >
              <Text
                style={[styles.dayLabel, isSelected && styles.selectedDayLabel]}
              >
                {day
                  .toLocaleDateString("en-US", { weekday: "short" })
                  .slice(0, 3)
                  .toUpperCase()}
              </Text>
              <View
                style={[
                  styles.dayNumberBox,
                  isSelected && styles.selectedDayNumberBox,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.selectedDayNumber,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
              <View
                style={[
                  styles.todayDot,
                  !(isToday && !isSelected) && styles.dotHidden,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  wrapper: {
    marginHorizontal: 8,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 18,
  },
  dayColumn: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: 42,
    gap: 8,
  },
  dayLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "normal",
  },
  selectedDayLabel: {
    color: colors.accent,
    fontWeight: "bold",
  },
  dayNumberBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDayNumberBox: {
    backgroundColor: colors.accent,
  },
  dayNumber: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 18,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  selectedDayNumber: {
    color: colors.accentText,
    fontWeight: "900",
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  dotHidden: {
    opacity: 0,
  },
});
