import Exercise from "./excerciseModel";

//workout object for thumbnail and todo
export default interface Workout {
    name: string;
    id: number;
    day: number;
    exercises: Exercise[];
}

