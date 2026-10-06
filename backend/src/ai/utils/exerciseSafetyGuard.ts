import { SanitizedUserContext } from "./sanitizer";

/**
 * High-Risk / Contraindicated Movement Blacklist with safe biomechanical replacements.
 */
interface MovementSafetyRule {
  pattern: RegExp;
  safeReplacement: string;
  muscleGroup: string;
  rationale: string;
}

const DANGEROUS_MOVEMENT_RULES: MovementSafetyRule[] = [
  {
    pattern: /behind[\s-]the[\s-]neck[\s-]*(barbell\s*)?(shoulder\s*)?press/i,
    safeReplacement: "Barbell Overhead Press (To Front)",
    muscleGroup: "Shoulders",
    rationale:
      "Avoids severe shoulder impingement and excessive external rotation at the glenohumeral joint.",
  },
  {
    pattern: /behind[\s-]the[\s-]neck[\s-]*(lat\s*)?pulldown/i,
    safeReplacement: "Lat Pulldown (To Upper Chest)",
    muscleGroup: "Back",
    rationale:
      "Protects the rotator cuff and cervical spine from hyperextension under load.",
  },
  {
    pattern: /(suicide[\s-]grip|thumbless[\s-]grip)\s*(bench\s*press)?/i,
    safeReplacement: "Barbell Bench Press (Standard Thumbaround Grip)",
    muscleGroup: "Chest",
    rationale:
      "Prevents catastrophic bar slip and dropped weights onto thoracic/cervical area.",
  },
  {
    pattern: /(close[\s-]grip\s*)?upright\s*(barbell\s*)?row/i,
    safeReplacement: "Cable Face Pull",
    muscleGroup: "Shoulders",
    rationale:
      "Eliminates internal rotation with abduction that causes subacromial shoulder impingement.",
  },
  {
    pattern: /heavy\s*jefferson\s*curl/i,
    safeReplacement: "Romanian Deadlift",
    muscleGroup: "Hamstrings",
    rationale:
      "Allows progressive overload with neutral spinal alignment under load.",
  },
];

export interface SafeRoutineExercise {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface SafeRoutineWorkout {
  name: string;
  days: number[];
  exercises: SafeRoutineExercise[];
}

export interface SafeWorkoutRoutine {
  routineName: string;
  workouts: SafeRoutineWorkout[];
}

/**
 * Enforces exercise biomechanics safety and 1RM overload limits on generated routines.
 */
export function applyExerciseSafetyGuardrail(
  routine: any,
  userContext?: SanitizedUserContext,
): SafeWorkoutRoutine {
  if (!routine || typeof routine !== "object" || !Array.isArray(routine.workouts)) {
    return routine;
  }

  const bench1RM = userContext?.benchPR || null;
  const squat1RM = userContext?.squatPR || null;
  const deadlift1RM = userContext?.deadliftPR || null;

  const sanitizedWorkouts: SafeRoutineWorkout[] = routine.workouts.map(
    (workout: any) => {
      const sanitizedExercises: SafeRoutineExercise[] = (
        workout.exercises || []
      ).map((exercise: any) => {
        let name = String(exercise.name || "Exercise");
        let muscleGroup = String(exercise.muscleGroup || "Full Body");
        let sets = Math.min(Math.max(Number(exercise.sets) || 3, 1), 6);
        let reps = Math.min(Math.max(Number(exercise.reps) || 10, 1), 30);
        let weight = Number(exercise.weight) || 0;

        // 1. Check for Dangerous / Contraindicated Movements
        for (const rule of DANGEROUS_MOVEMENT_RULES) {
          if (rule.pattern.test(name)) {
            console.warn(
              `[SAFETY GUARD] Replaced dangerous movement "${name}" with "${rule.safeReplacement}". Rationale: ${rule.rationale}`,
            );
            name = rule.safeReplacement;
            muscleGroup = rule.muscleGroup;
            break;
          }
        }

        // 2. 1RM Overload Biomechanics Guard
        // Working sets for 4-12 reps should never exceed ~85-90% of the user's 1RM
        const lowerName = name.toLowerCase();

        if (bench1RM && lowerName.includes("bench") && !lowerName.includes("dumbbell")) {
          const maxSafeWorkingWeight = Math.round(bench1RM * 0.85);
          if (weight > maxSafeWorkingWeight) {
            console.warn(
              `[OVERLOAD GUARD] Prescribed bench weight (${weight} lbs) exceeded safe working threshold for 1RM (${bench1RM} lbs). Clamping to 80% 1RM (${Math.round(bench1RM * 0.8)} lbs).`,
            );
            weight = Math.round(bench1RM * 0.8);
          }
        } else if (squat1RM && lowerName.includes("squat") && !lowerName.includes("goblet") && !lowerName.includes("bodyweight")) {
          const maxSafeWorkingWeight = Math.round(squat1RM * 0.85);
          if (weight > maxSafeWorkingWeight) {
            console.warn(
              `[OVERLOAD GUARD] Prescribed squat weight (${weight} lbs) exceeded safe working threshold for 1RM (${squat1RM} lbs). Clamping to 80% 1RM (${Math.round(squat1RM * 0.8)} lbs).`,
            );
            weight = Math.round(squat1RM * 0.8);
          }
        } else if (deadlift1RM && lowerName.includes("deadlift") && !lowerName.includes("romanian")) {
          const maxSafeWorkingWeight = Math.round(deadlift1RM * 0.85);
          if (weight > maxSafeWorkingWeight) {
            console.warn(
              `[OVERLOAD GUARD] Prescribed deadlift weight (${weight} lbs) exceeded safe working threshold for 1RM (${deadlift1RM} lbs). Clamping to 80% 1RM (${Math.round(deadlift1RM * 0.8)} lbs).`,
            );
            weight = Math.round(deadlift1RM * 0.8);
          }
        } else if (!bench1RM && !squat1RM && !deadlift1RM) {
          // If no PRs recorded (beginner baseline), prevent crazy hallucinations over 225 lbs
          if (weight > 225) {
            console.warn(
              `[OVERLOAD GUARD] Beginner prescribed excessive weight (${weight} lbs). Clamping to 135 lbs working set.`,
            );
            weight = 135;
          }
        }

        return {
          name,
          muscleGroup,
          sets,
          reps,
          weight,
        };
      });

      return {
        name: String(workout.name || "Workout Day"),
        days: Array.isArray(workout.days) ? workout.days : [1, 3, 5],
        exercises: sanitizedExercises,
      };
    },
  );

  return {
    routineName: String(routine.routineName || "Custom Workout Routine"),
    workouts: sanitizedWorkouts,
  };
}
