import Workout from "./workout-model";

export default interface WorkoutRoutine {
    name: string,
    id: string,
    workoutRoutine: Workout[];
}