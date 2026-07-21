import WorkoutRoutine from "@/app/models/workout-routine-model";

import { PushPullLegs } from "./pplPB/ppl-prebuilt";
import { UpperLower } from "./ulPB/ul-prebuilt";

export const prebuiltRoutines: WorkoutRoutine[] = [
    PushPullLegs,
    UpperLower,
];