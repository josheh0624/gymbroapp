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
    //get the start of the week (sunday)
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
        <View style={styles.container}>
            {weekDays.map((day, index) => {
                const isSelected = selectedIndex === index;
                const isToday = day.toDateString() === today.toDateString();

                return (
                    <Pressable
                        key={`${day.toISOString()}-${index}`}
                        onPress={() => handleSelectDay(day, index)}
                        style={[styles.dayButton, isSelected && styles.selectedDayButton]}
                    >
                        <Text style={[styles.dayLabel, isSelected && styles.selectedDayLabel]}>
                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                        </Text>
                        <Text style={[styles.dayNumber, isSelected && styles.selectedDayNumber]}>
                            {day.getDate()}
                        </Text>
                        {isToday  ? <View style={styles.todayDot} /> : null}
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    dayButton: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 42,
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    selectedDayButton: {
        backgroundColor: '#ff3b30',
    },
    dayLabel: {
        color: '#fff',
        fontSize: 12,
        marginBottom: 4,
    },
    selectedDayLabel: {
        color: '#fff',
        fontWeight: '700',
    },
    dayNumber: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    selectedDayNumber: {
        color: '#fff',
    },
    todayDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#ff3b30',
        marginTop: 4,
    },
});

