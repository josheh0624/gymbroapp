import Workout from "@/app/models/workout-model";

export const LowerDay: Workout = {
  id: Date.now() + 1,
  name: "Lower Day",
  days: 2,
  exercises: [
    {
      id: "back-squat",
      name: "Back Squat",
      hit_area: "Quads",
      sets: 3,
      reps: 6,
    },
    {
      id: "romanian-deadlift",
      name: "Romanian Deadlift",
      hit_area: "Hamstrings",
      sets: 3,
      reps: 8,
    },
    {
      id: "leg-press",
      name: "Leg Press",
      hit_area: "Quads",
      sets: 3,
      reps: 10,
    },
    {
      id: "leg-curl",
      name: "Seated Leg Curl",
      hit_area: "Hamstrings",
      sets: 3,
      reps: 10,
    },
    {
      id: "leg-extension",
      name: "Leg Extension",
      hit_area: "Quads",
      sets: 3,
      reps: 12,
    },
    {
      id: "standing-calf-raise",
      name: "Standing Calf Raise",
      hit_area: "Calves",
      sets: 4,
      reps: 12,
    },
  ],
};