// excerciseModel.ts
export default interface Exercise {
  id: string;
  name: string;
  muscleGroupName?: string; // renamed from hit_area; optional since not every route joins it
  sets: number;
  reps: number;
  orderIndex: number;
  workoutExerciseId?: string; // workout_exercises row id — needed to mark done / set weight
  weight?: number | null;
  isDone?: boolean;
}
