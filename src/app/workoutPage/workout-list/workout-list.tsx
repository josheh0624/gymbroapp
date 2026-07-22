import WorkoutRoutine from "@/app/models/workout-routine-model";
import { StyleSheet, View } from "react-native";
import WorkoutThumbnail from "./workout-thumbnail/workout-thumbnail";

interface Props {
    routine?: WorkoutRoutine;
    selectedWeekdayID: number,
}

export default function WorkoutList({routine, selectedWeekdayID}: Props){
    // functions to map out thumbnails based on workouts in the routine

    const normalizeWeekday = (value: number | string) => {
        const normalizedValue = Number(value);
        return normalizedValue === 0 ? 7 : normalizedValue;
    };

    // ?? means if value is missing then use an empty array []
    const workouts = routine?.workoutRoutine ?? []; //stores workouts[]

    //filter to only have workouts that match dayID
    const workoutsForSelectedDay = workouts.filter(
        (w) => w.days === selectedWeekdayID
    )

    return (
        <View style={styles.container}>
            {workouts.map((workout, index) => {
                const isVisible = normalizeWeekday(workout.days) === normalizeWeekday(selectedWeekdayID);

                return (
                    <WorkoutThumbnail 
                        workout={workout}
                        selectedWeekdayID={selectedWeekdayID}
                        visible={isVisible}
                        key={`${workout.id ?? "workout"}-${index}`}
                    />
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignContent: "center",
        width: '100%',
    },
});