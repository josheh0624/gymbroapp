import WorkoutRoutine from "@/app/models/workout-routine-model";
import { LegDay } from "./leg-day";
import { PullDay } from "./pull-day";
import { PushDay } from "./push-day";

export const PushPullLegs: WorkoutRoutine = {
    id: "ppl",
    name: "Push Pull Legs",
    workoutRoutine: [
        PushDay,
        PullDay,
        LegDay,
    ],
};