import Workout from "@/app/models/workout-model";

export const PullDay: Workout = {
    id: Date.now(),
    name: "Pull Day",
    day: 3,
    exercises: [
      {
        id: "pullups",
        name: "Pull-Ups or Lat Pulldowns",
        hit_area: "Lats",
        sets: 3,
        reps: 8,
      },
      {
        id: "barbell-row",
        name: "Barbell Bent-Over Row",
        hit_area: "Back",
        sets: 3,
        reps: 6,
      },
      {
        id: "cable-row",
        name: "Seated Cable Row",
        hit_area: "Mid Back",
        sets: 3,
        reps: 8,
      },
      {
        id: "face-pulls",
        name: "Face Pulls",
        hit_area: "Rear Delts",
        sets: 3,
        reps: 12,
      },
      {
        id: "hammer-curls",
        name: "Dumbbell Hammer Curls",
        hit_area: "Biceps",
        sets: 3,
        reps: 10,
      },
      {
        id: "ez-curls",
        name: "EZ Bar or Dumbbell Curls",
        hit_area: "Biceps",
        sets: 3,
        reps: 10,
      },
    ],
}