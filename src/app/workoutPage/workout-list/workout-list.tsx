import WorkoutRoutine from "@/app/models/workout-routine-model";
import { StyleSheet, View } from "react-native";
import WorkoutThumbnail from "./workout-thumbnail/workout-thumbnail";

interface Props {
    routine?: WorkoutRoutine;
}

export default function WorkoutList({routine}: Props){
    // functions to map out thumbnails based on workouts in the routine

    // ?? means if value is missing then use an empty array []
    const workouts = routine?.workoutRoutine ?? []; //stores workouts[]

    return (
        <View style={styles.container}>
            {workouts.map((workout, index) => (
                <WorkoutThumbnail 
                    workout={workout} 
                    key={`${workout.id ?? "workout"}-${index}`}
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