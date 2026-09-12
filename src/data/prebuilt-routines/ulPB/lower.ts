import Workout from "@/models/workout-model";

export const LowerDay: Workout = {
  id: "lower-day",
  name: "Lower Day",
  days: [2, 5],
  exercises: [
    {
      id: "back-squat",
      name: "Back Squat",
      muscleGroupName: "Quads",
      sets: 3,
      reps: 6,
    },
    {
      id: "romanian-deadlift",
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
      name: "Seated Leg Curl",
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
      id: "standing-calf-raise",
      name: "Standing Calf Raise",
      muscleGroupName: "Calves",
      sets: 4,
      reps: 12,
    },
  ],
};
