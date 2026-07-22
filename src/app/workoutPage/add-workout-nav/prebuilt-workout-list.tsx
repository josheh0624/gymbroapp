import { StyleSheet, View } from "react-native";
import WorkoutRoutine from "../../models/workout-routine-model";
import { prebuiltRoutines } from "../data/prebuilt-routines";
import PrebuiltWorkoutThumbnail from "./prebuilt-thumbnail/prebuilt-workout-thumbnail";

export default function PrebuiltWorkoutList() {

    const validRoutines: WorkoutRoutine[] = Array.isArray(prebuiltRoutines)//if prebuilt array exists
        ? prebuiltRoutines.filter(
            (routine): routine is WorkoutRoutine => Boolean(routine) //filter it to only the workoutROtuines
        )
        : []; //else set to empty array

    return (
        <View style={styles.container}>
            {validRoutines.length > 0
                ? validRoutines.map((routine, index) => (
                    <PrebuiltWorkoutThumbnail
                        routine={routine}
                        key={`${routine.id ?? "routine"}-${index}`} //uses routines id if it exists, else uses routine-index num
                    />
                ))
            : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignContent: "center",
        width: '100%',
    },
});