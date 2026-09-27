import Workout from "@/models/workout-model";

export const LegDay: Workout = {
  id: "leg-day",
  name: "Leg Day",
  days: [3, 6],
  exercises: [
    {
      id: "squat",
      name: "Barbell Back Squat",
      muscleGroupName: "Quads",
      sets: 3,
      reps: 6,
    },
    {
      id: "rdl",
      name: "Romanian Deadlift",
      muscleGroupName: "Hamstrings",
      sets: 3,
      reps: 8,
    },
    {
      id: "leg-press",
      name: "Leg Press",
      muscleGroupName: "Quads",
      sets: 3,
      reps: 10,
    },
    {
      id: "leg-curl",
      name: "Leg Curl",
      muscleGroupName: "Hamstrings",
      sets: 3,
      reps: 10,
    },
    {
      id: "leg-extension",
      name: "Leg Extension",
      muscleGroupName: "Quads",
      sets: 3,
      reps: 12,
    },
    {
      id: "calf-raises",
      name: "Standing Calf Raises",
      muscleGroupName: "Calves",
      sets: 4,
      reps: 12,
    },
  ],
};
