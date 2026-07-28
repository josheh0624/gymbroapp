import NotFoundScreen from "@/app/+not-found";
import { useRoutineStore } from "@/store/routineStore";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";


export default function WorkoutTodo() {

    //unique workoutID
    const { id, routineID } = useLocalSearchParams<{ id: string; routineID: string }>();

    const routine = useRoutineStore((s) => s.routines.find((r) => r.id === routineID)) //gets routine that matches id

    //find workout in Workouts that matches ID
    const workout = routine?.workoutRoutine.find((w) => w.id === id);
    
    if(!workout) return (
        <>
            <View>
                <NotFoundScreen />
            </View>
        </>
    );

    return (
        <View>
            <Text>{workout.name}</Text>
        </View>
    );
}