import { useEffect } from 'react';
import { LogBox } from 'react-native';
import CalendarStrip from "react-native-calendar-strip";




export default function WeekStrip() {

    useEffect(() => {
        LogBox.ignoreLogs(['A props object containing a "key" prop']);
    }, []);

    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    sunday.setHours(0,0,0,0);


    return (
        <CalendarStrip
            scrollable={false}
            useIsoWeekday={false}
            startingDate={sunday}
            selectedDate={today}
            
            style={{ height: 70 }}
            calendarColor={'#25292e'}
            showMonth={false}
            dateNumberStyle={{ 
                color: '#fff',
                fontSize: 24,
             }}
            dateNameStyle={{ color: '#fff' }}
            highlightDateNumberStyle={{ 
                color: '#ff0000',
                fontSize: 20,
            }}
            highlightDateNameStyle={{ 
                color: '#ff0000',
            }}
            iconContainer={{ flex: 0.1 }}
            markedDates={[
                { date: today, dots: [{ color: '#ff0000', selected: true }] },
            ]}
            daySelectionAnimation={{
                type: "border",
                duration: 0,
                borderWidth: 0,
                borderHighlightColor: "transparent",
            }}

            customDatesStyles={() => ({
                dateContainerStyle: {
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    justifyContent: "center",
                    alignItems: "center",
                    color: 'red',
                },
            })}
        />
    )
}

