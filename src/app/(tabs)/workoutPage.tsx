import dayjs from "dayjs";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import WeekStrip from "../components/week-strip";
import AddWorkoutButton from "../workoutPage/add-button/add-workout-button";
import WorkoutList from "../workoutPage/workout-list/workout-list";
import Workout from "../workoutPage/workout-model";

export default function WorkoutScreen() {

    const [workouts, setWorkouts] = useState<Workout[]>([]);

    const currentDate = dayjs().format("MMMM D, YYYY");

    //handle adding of workouts
    function HandleAddWorkout(workout : Workout) {
        setWorkouts((prev) => [...prev, workout]);
    }

    return (
        <View style={styles.container}>
            <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{currentDate}</Text>
            </View>
            <View style={styles.weekCalendarContainer}>
                <WeekStrip />
            </View>
            <View style={{flex: 1, width: '100%', height: '100%', paddingTop: 10,}}>
                <WorkoutList 
                workouts={workouts}
                setWorkouts={setWorkouts}
                />
            </View>
            
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", width: "90%", position: "absolute", bottom: 120}}>
                <AddWorkoutButton onAddWorkout={HandleAddWorkout}/>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#25292e',
        alignItems: "center",
        
    },
    text: {
        color: "#fff",
        fontSize: 18,
    },
    dateContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 6,
        paddingBottom: 20,
        paddingLeft:18,
        paddingRight:10,
        width: "100%",
    },
    dateText: {
        color: "#fff",
        fontSize: 18,
        alignSelf: "flex-start", // Align the text to the left
        fontWeight: 500,
    },
    weekCalendarContainer: {
        width: "100%",
    },
    weekCalendar: {
        width: "100%",
        height: 50,
    },
});