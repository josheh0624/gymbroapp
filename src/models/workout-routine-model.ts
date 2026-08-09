import Workout from "./workout-model";

//workout routine model to store individual days
export default interface WorkoutRoutine {
    name: string,
    id: string,
    workoutRoutine: Workout[];
}