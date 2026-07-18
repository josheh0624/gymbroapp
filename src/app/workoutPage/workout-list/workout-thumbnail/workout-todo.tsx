import NotFoundScreen from "@/app/+not-found";
import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import Workout from "../../workout-model";

interface Props {
    workouts: Workout[];
    setWorkouts: React.Dispatch<React.SetStateAction<Workout[]>>;
}

export default function WorkoutTodo({workouts, setWorkouts}: Props) {

    //unique workoutID
    const { workoutID } = useLocalSearchParams<{ workoutID: string }>();

    //find workout in Workouts that matches ID
    const workout = workouts.find((w) => w.id === Number(workoutID));
    if(!workout) return (
        <>
            <View>
                
                <NotFoundScreen />
            </View>
        </>
    );

    return (
        <>
        <View>
            <Text>good</Text>
        </View>
        </>
    );
}