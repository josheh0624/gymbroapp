import Workout from "@/app/models/workout-model";

export const LegDay: Workout = {
    id: Date.now(),
    name: "Leg Day",
    days: 3,
    exercises: [
      {
        id: "squat",
        name: "Barbell Back Squat",
        hit_area: "Quads",
        sets: 3,
        reps: 6,
      },
      {
        id: "rdl",
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
        name: "Leg Curl",
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
        id: "calf-raises",
        name: "Standing Calf Raises",
        hit_area: "Calves",
        sets: 4,
        reps: 12,
      },
    ],
};