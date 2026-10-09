import { SupabaseClient } from "@supabase/supabase-js";
import { SafeWorkoutRoutine } from "./exerciseSafetyGuard";

export interface SaveRoutineResponse {
  success: boolean;
  routineId?: string;
  error?: string;
}

/**
 * 1-Trip Atomic Routine Persistence:
 * Persists an AI-generated workout routine, its workouts, exercises, and days
 * in a streamlined server-side workflow.
 */
export async function saveRoutineForUser(
  supabase: SupabaseClient,
  userId: string,
  routine: SafeWorkoutRoutine,
): Promise<SaveRoutineResponse> {
  if (!routine || !Array.isArray(routine.workouts) || routine.workouts.length === 0) {
    return { success: false, error: "Routine contains no workout days." };
  }

  try {
    // 1. Fetch available exercises for name matching
    const { data: existingExercises, error: exFetchErr } = await supabase
      .from("exercises")
      .select("id, name");

    if (exFetchErr) {
      console.warn("[Routine Saver] Could not fetch exercises:", exFetchErr.message);
    }

    const exerciseMap: Record<string, string> = {};
    if (existingExercises) {
      for (const ex of existingExercises) {
        if (ex.name) {
          exerciseMap[ex.name.toLowerCase().trim()] = ex.id;
        }
      }
    }

    const fallbackMuscleGroupId = 1;
    const resolvedExerciseIds: Record<string, string> = {};

    // 2. Resolve or insert any custom exercise references
    for (const workout of routine.workouts) {
      for (const ex of workout.exercises) {
        const cleanName = ex.name.trim();
        const key = cleanName.toLowerCase();

        if (exerciseMap[key]) {
          resolvedExerciseIds[cleanName] = exerciseMap[key];
          continue;
        }

        // Fuzzy match check
        const matched = existingExercises?.find(
          (e) =>
            e.name.toLowerCase().includes(key) ||
            key.includes(e.name.toLowerCase()),
        );
        if (matched) {
          resolvedExerciseIds[cleanName] = matched.id;
          continue;
        }

        // Try inserting custom exercise under this user
        try {
          const { data: newEx, error: insertExErr } = await supabase
            .from("exercises")
            .insert({
              name: cleanName,
              muscle_group_id: fallbackMuscleGroupId,
              user_id: userId !== "dev-user" ? userId : null,
            })
            .select("id")
            .single();

          if (!insertExErr && newEx) {
            resolvedExerciseIds[cleanName] = newEx.id;
            exerciseMap[key] = newEx.id;
            continue;
          }
        } catch {
          // Ignore RLS insert constraint
        }

        // Final fallback to first existing exercise
        if (existingExercises && existingExercises.length > 0) {
          resolvedExerciseIds[cleanName] = existingExercises[0].id;
        }
      }
    }

    // 3. Create the workout_routines entry
    const { data: routineRecord, error: rError } = await supabase
      .from("workout_routines")
      .insert({
        name: routine.routineName,
        user_id: userId !== "dev-user" ? userId : null,
        is_prebuilt: false,
      })
      .select("id")
      .single();

    if (rError || !routineRecord) {
      return {
        success: false,
        error: rError?.message || "Failed to create workout routine record.",
      };
    }

    const routineId = routineRecord.id;
    const createdWorkoutIds: string[] = [];

    // 4. Create each workout and its associated exercises
    for (const workout of routine.workouts) {
      const { data: workoutRecord, error: wError } = await supabase
        .from("workouts")
        .insert({
          name: workout.name,
          days: workout.days && workout.days.length > 0 ? workout.days : [1],
          user_id: userId !== "dev-user" ? userId : null,
        })
        .select("id")
        .single();

      if (wError || !workoutRecord) {
        console.warn(
          `[Routine Saver] Failed to insert workout "${workout.name}":`,
          wError?.message,
        );
        continue;
      }

      createdWorkoutIds.push(workoutRecord.id);

      if (workout.exercises && workout.exercises.length > 0) {
        const exercisesToInsert: Array<{
          workout_id: string;
          exercise_id: string;
          sets: number;
          reps: number;
          weight: number;
          order_index: number;
        }> = [];

        workout.exercises.forEach((ex, idx) => {
          const exerciseId = resolvedExerciseIds[ex.name.trim()];
          if (exerciseId) {
            exercisesToInsert.push({
              workout_id: workoutRecord.id,
              exercise_id: exerciseId,
              sets: ex.sets || 3,
              reps: ex.reps || 10,
              weight: ex.weight || 0,
              order_index: idx,
            });
          }
        });

        if (exercisesToInsert.length > 0) {
          const { error: weError } = await supabase
            .from("workout_exercises")
            .insert(exercisesToInsert);

          if (weError) {
            console.warn(
              `[Routine Saver] Error inserting exercises for "${workout.name}":`,
              weError.message,
            );
          }
        }
      }
    }

    // 5. Link workouts to routine in workout_routine_days
    if (createdWorkoutIds.length > 0) {
      const daysPayload = createdWorkoutIds.map((workoutId, idx) => ({
        routine_id: routineId,
        workout_id: workoutId,
        order_index: idx,
      }));

      const { error: dError } = await supabase
        .from("workout_routine_days")
        .insert(daysPayload);

      if (dError) {
        console.warn(
          "[Routine Saver] Error linking routine days:",
          dError.message,
        );
      }
    }

    return {
      success: true,
      routineId,
    };
  } catch (err: any) {
    console.error("[Routine Saver Error]:", err);
    return {
      success: false,
      error: err.message || "Unexpected error persisting workout routine.",
    };
  }
}
