import Workout from "@/app/models/workout-model";

export const PushDay: Workout = {
    id: Date.now(),
    name: "Push Day",
    days: [1,4],
    exercises: [
      {
        id: "bench",
        name: "Barbell Bench Press",
        hit_area: "Chest",
        sets: 3,
        reps: 6,
      },
      {
        id: "incline-db",
        name: "Incline Dumbbell Press",
        hit_area: "Upper Chest",
        sets: 3,
        reps: 8,
      },
      {
        id: "shoulder-press",
        name: "Seated Dumbbell Shoulder Press",
        hit_area: "Shoulders",
        sets: 3,
        reps: 8,
      },
      {
        id: "lateral-raises",
        name: "Dumbbell Lateral Raises",
        hit_area: "Side Delts",
        sets: 3,
        reps: 12,
      },
      {
        id: "tricep-pushdown",
        name: "Cable Triceps Pushdowns",
        hit_area: "Triceps",
        sets: 3,
        reps: 10,
      },
      {
        id: "overhead-extension",
        name: "Overhead Triceps Extension",
        hit_area: "Triceps",
        sets: 3,
        reps: 10,
      },
    ],
}