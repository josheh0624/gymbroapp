import { BlurView } from "expo-blur";
import moment from "moment";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const COLORS = {
  surface: "rgba(255,255,255,0.045)",
  surfaceBorder: "rgba(255,255,255,0.09)",
  text: "#F5F6F7",
  textMuted: "rgba(255,255,255,0.5)",
  red: "#FF2A3C",
};

type Props = {
  setSelectedWeekdayID: Dispatch<SetStateAction<number>>;
  getWeekdayID(date: moment.Moment): number;
};

export default function WeekStrip({
  setSelectedWeekdayID,
  getWeekdayID,
}: Props) {
  const today = new Date();
  const startOfWeek = useMemo(() => {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay());
    date.setHours(0, 0, 0, 0);
    return date;
  }, [today]);

  const [selectedIndex, setSelectedIndex] = useState(today.getDay());

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      return date;
    });
  }, [startOfWeek]);

  const handleSelectDay = (date: Date, index: number) => {
    setSelectedIndex(index);
    setSelectedWeekdayID(getWeekdayID(moment(date)));
  };

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.container}>
        {weekDays.map((day, index) => {
          const isSelected = selectedIndex === index;
          const isToday = day.toDateString() === today.toDateString();

          return (
            <Pressable
              key={`${day.toISOString()}-${index}`}
              onPress={() => handleSelectDay(day, index)}
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

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    backgroundColor: COLORS.surface,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  dayColumn: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: 42,
    gap: 8,
  },
  dayLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  selectedDayLabel: {
    color: COLORS.red,
  },
  dayNumberBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDayNumberBox: {
    backgroundColor: COLORS.red,
  },
  dayNumber: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  selectedDayNumber: {
    color: COLORS.text,
    fontWeight: "800",
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.red,
  },
  dotHidden: {
    opacity: 0,
  },
});
