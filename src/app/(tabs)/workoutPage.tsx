import dayjs from "dayjs";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import WeekStrip from "../components/week-strip";
import Workout from "../models/workout-model";
import WorkoutRoutine from "../models/workout-routine-model";
import AddWorkoutButton from "../workoutPage/add-button/add-workout-button";
import WorkoutList from "../workoutPage/workout-list/workout-list";

export default function WorkoutScreen() {

    const [routine, setRoutine] = useState<WorkoutRoutine>();
    const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    // recieves params from add button as a single routine or a array
    const params = useLocalSearchParams<{ addedRoutine?: string | string[] }>();

    const currentDate = dayjs().format("MMMM D, YYYY");

    //use effect runs after component renders
    ///run effect whenever addedRoutine value changes
    useEffect(() => {
        // recieve array of routines and get the workouts from them


        const encodedRoutine = Array.isArray(params.addedRoutine) ? params.addedRoutine[0] : params.addedRoutine; //recieve routine from params

        if (!encodedRoutine) {
            return; //no routine data - end here
        }

        try {
            const parsedRoutine = JSON.parse(encodedRoutine) as WorkoutRoutine; //converts string sent over back to TS object

            if (!parsedRoutine?.workoutRoutine) { 
                return; //stop if parsed routine does not have a workoutRoutine array
            }

            setRoutine(parsedRoutine); //stores routine in routine useState
            setRoutines((prev) => //adds routine to routines list if not already there
                prev.some((existingRoutine) => existingRoutine.id === parsedRoutine.id) //prev is previous state - prev.some checks if same routine ID already exists
                    ? prev //if it exists keep the old list
                    : [...prev, parsedRoutine] //if not add the new routine
            );
            setWorkouts((prev) => {
                const existingWorkoutIds = new Set(prev.map((workout) => workout.id)); //stores prev workouts in this variable
                const newWorkouts = parsedRoutine.workoutRoutine.filter( // take new workouts
                    (workout) => !existingWorkoutIds.has(workout.id) //and append tem to workouts if it has a new ID
                );

                return newWorkouts.length > 0 ? [...prev, ...newWorkouts] : prev; //new workouts or prev if newWorkouts.length has items
            });
        } catch {
            console.warn("Unable to parse the routine payload."); //JSON parsing fails
        }
    }, [params.addedRoutine]); //run effect whenever addedRoutine value changes

    return (
        <View style={styles.container}>
            <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{currentDate}</Text>
            </View>
            <View style={styles.weekCalendarContainer}>
                <WeekStrip />
            </View>
            <View style={{flex: 1, width: '100%', height: '100%', paddingTop: 10,}}>
                <WorkoutList routine={routine} />
            </View>
            
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", width: "90%", position: "absolute", bottom: 120}}>
                <AddWorkoutButton />
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