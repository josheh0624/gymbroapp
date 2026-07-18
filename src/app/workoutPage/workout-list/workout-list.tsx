import { StyleSheet, View } from "react-native";
import Workout from "../workout-model";
import WorkoutThumbnail from "./workout-thumbnail/workout-thumbnail";

interface Props {
    workouts: Workout[];
    setWorkouts: React.Dispatch<React.SetStateAction<Workout[]>>;
}

export default function WorkoutList({workouts, setWorkouts}: Props){

    return (
        <View style={styles.container}>
            {workouts.map((workout) => (
                <WorkoutThumbnail 
                    workout={workout} 
                    key={workout.id}
                    workouts={workouts}
                    setWorkouts={setWorkouts}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignContent: "center",
        width: '100%',
    },
});