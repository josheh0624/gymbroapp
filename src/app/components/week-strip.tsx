import { GlassView } from 'expo-glass-effect';
import moment from 'moment';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
    setSelectedWeekdayID: Dispatch<SetStateAction<number>>;
    getWeekdayID(date: moment.Moment): number;
};

export default function WeekStrip({ setSelectedWeekdayID, getWeekdayID }: Props) {
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
            <GlassView
                style={[StyleSheet.absoluteFill, styles.glassBackground]}
                glassEffectStyle="clear"
            />
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
                            <Text style={[styles.dayLabel, isSelected && styles.selectedDayLabel]}>
                                {day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toUpperCase()}
                            </Text>
                            <View style={[styles.dayNumberBox, isSelected && styles.selectedDayNumberBox]}>
                                <Text style={[styles.dayNumber, isSelected && styles.selectedDayNumber]}>
                                    {day.getDate()}
                                </Text>
                            </View>
                            <View style={[styles.todayDot, !(isToday && !isSelected) && styles.dotHidden]} />
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: 16,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    glassBackground: {
        borderRadius: 20,
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 12,
    },
    dayColumn: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: 42,
        gap: 8,
    },
    dayLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    selectedDayLabel: {
        color: '#ff3b30',
    },
    dayNumberBox: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedDayNumberBox: {
        backgroundColor: '#ff3b30',
    },
    dayNumber: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    selectedDayNumber: {
        color: '#fff',
        fontWeight: '800',
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#ff3b30',
    },
    dotHidden: {
        opacity: 0,
    },
});