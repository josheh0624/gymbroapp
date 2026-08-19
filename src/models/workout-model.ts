// workout-model.ts
import Exercise from "./excerciseModel";

//workout object for thumbnail and todo
export default interface Workout {
  name: string;
  id: string;
  days: number[];
  order_index?: number; // present when nested under a routine, absent on standalone fetch
  exercises: Exercise[];
}
