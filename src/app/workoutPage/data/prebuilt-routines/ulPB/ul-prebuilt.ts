import WorkoutRoutine from "@/app/models/workout-routine-model";
import { LowerDay } from "./lower";
import { UpperDay } from "./upper";

export const UpperLower: WorkoutRoutine = {
    id: "upper-lower",
    name: "Upper / Lower",
    workoutRoutine: [
        UpperDay,
        LowerDay,
    ],
};