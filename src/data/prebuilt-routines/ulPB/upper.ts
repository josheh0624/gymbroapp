import Workout from "@/models/workout-model";

export const UpperDay: Workout = {
  id: "upper-day",
  name: "Upper Day",
  days: [1, 4],
  exercises: [
    {
      id: "bench-press",
      name: "Barbell Bench Press",
      muscleGroupName: "Chest",
      sets: 3,
      reps: 6,
    },
    {
      id: "barbell-row",
      name: "Barbell Row",
      muscleGroupName: "Back",
      sets: 3,
      reps: 8,
    },
    {
      id: "incline-db-press",
      name: "Incline Dumbbell Press",
      muscleGroupName: "Upper Chest",
      sets: 3,
      reps: 8,
    },
    {
      id: "lat-pulldown",
      name: "Lat Pulldown",
      muscleGroupName: "Lats",
      sets: 3,
      reps: 10,
    },
    {
      id: "lateral-raise",
      name: "Dumbbell Lateral Raise",
      muscleGroupName: "Side Delts",
      sets: 3,
      reps: 12,
    },
    {
      id: "tricep-pushdown",
      name: "Cable Triceps Pushdown",
      muscleGroupName: "Triceps",
      sets: 3,
      reps: 10,
    },
    {
      id: "db-curl",
      name: "Dumbbell Curl",
      muscleGroupName: "Biceps",
      sets: 3,
      reps: 10,
    },
  ],
};
