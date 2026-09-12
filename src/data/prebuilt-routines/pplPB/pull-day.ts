import Workout from "@/models/workout-model";

export const PullDay: Workout = {
  id: "pull-day",
  name: "Pull Day",
  days: [2, 5],
  exercises: [
    {
      id: "pullups",
      name: "Pull-Ups or Lat Pulldowns",
      muscleGroupName: "Lats",
      sets: 3,
      reps: 8,
    },
    {
      id: "barbell-row",
      name: "Barbell Bent-Over Row",
      muscleGroupName: "Back",
      sets: 3,
      reps: 6,
    },
    {
      id: "cable-row",
      name: "Seated Cable Row",
      muscleGroupName: "Mid Back",
      sets: 3,
      reps: 8,
    },
    {
      id: "face-pulls",
      name: "Face Pulls",
      muscleGroupName: "Rear Delts",
      sets: 3,
      reps: 12,
    },
    {
      id: "hammer-curls",
      name: "Dumbbell Hammer Curls",
      muscleGroupName: "Biceps",
      sets: 3,
      reps: 10,
    },
    {
      id: "ez-curls",
      name: "EZ Bar or Dumbbell Curls",
      muscleGroupName: "Biceps",
      sets: 3,
      reps: 10,
    },
  ],
};
