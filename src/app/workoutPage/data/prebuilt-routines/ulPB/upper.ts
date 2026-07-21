import Workout from "@/app/models/workout-model";

export const UpperDay: Workout = {
  id: Date.now(),
  name: "Upper Day",
  day: 1,
  exercises: [
    {
      id: "bench-press",
      name: "Barbell Bench Press",
      hit_area: "Chest",
      sets: 3,
      reps: 6,
    },
    {
      id: "barbell-row",
      name: "Barbell Row",
      hit_area: "Back",
      sets: 3,
      reps: 8,
    },
    {
      id: "incline-db-press",
      name: "Incline Dumbbell Press",
      hit_area: "Upper Chest",
      sets: 3,
      reps: 8,
    },
    {
      id: "lat-pulldown",
      name: "Lat Pulldown",
      hit_area: "Lats",
      sets: 3,
      reps: 10,
    },
    {
      id: "lateral-raise",
      name: "Dumbbell Lateral Raise",
      hit_area: "Side Delts",
      sets: 3,
      reps: 12,
    },
    {
      id: "tricep-pushdown",
      name: "Cable Triceps Pushdown",
      hit_area: "Triceps",
      sets: 3,
      reps: 10,
    },
    {
      id: "db-curl",
      name: "Dumbbell Curl",
      hit_area: "Biceps",
      sets: 3,
      reps: 10,
    },
  ],
};