import Workout from "@/models/workout-model";

export const PushDay: Workout = {
  id: "push-day",
  name: "Push Day",
  days: [1, 4],
  exercises: [
    {
      id: "bench",
      name: "Barbell Bench Press",
      muscleGroupName: "Chest",
      sets: 3,
      reps: 6,
    },
    {
      id: "incline-db",
      name: "Incline Dumbbell Press",
      muscleGroupName: "Upper Chest",
      sets: 3,
      reps: 8,
    },
    {
      id: "shoulder-press",
      name: "Seated Dumbbell Shoulder Press",
      muscleGroupName: "Shoulders",
      sets: 3,
      reps: 8,
    },
    {
      id: "lateral-raises",
      name: "Dumbbell Lateral Raises",
      muscleGroupName: "Side Delts",
      sets: 3,
      reps: 12,
    },
    {
      id: "tricep-pushdown",
      name: "Cable Triceps Pushdowns",
      muscleGroupName: "Triceps",
      sets: 3,
      reps: 10,
    },
    {
      id: "overhead-extension",
      name: "Overhead Triceps Extension",
      muscleGroupName: "Triceps",
      sets: 3,
      reps: 10,
    },
  ],
};
