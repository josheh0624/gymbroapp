import WorkoutRoutine from "@/app/models/workout-routine-model";
import { StyleSheet, View } from "react-native";
import { prebuiltRoutines } from "../../data/prebuilt-routines";
import PrebuiltWorkoutThumbnail from "./prebuilt-workout-thumbnail";

export default function PrebuiltWorkoutList() {

    const validRoutines: WorkoutRoutine[] = Array.isArray(prebuiltRoutines)
        ? prebuiltRoutines.filter(
            (routine): routine is WorkoutRoutine => Boolean(routine)
        )
        : [];

    return (
        <View style={styles.container}>
            {validRoutines.length > 0
                ? validRoutines.map((routine, index) => (
                    <PrebuiltWorkoutThumbnail
                        routine={routine}
                        key={routine.id ?? index.toString()}
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