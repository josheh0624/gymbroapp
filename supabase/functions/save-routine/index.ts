import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization or environment configuration." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user token." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const routine = body.routine;

    if (!routine) {
      return new Response(
        JSON.stringify({ error: "Routine payload is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const routineName = (routine.routineName || routine.name || "Custom Workout Routine").trim();
    const rawWorkouts = Array.isArray(routine.workouts)
      ? routine.workouts
      : Array.isArray(routine.days)
      ? routine.days
      : [];

    if (rawWorkouts.length === 0) {
      return new Response(
        JSON.stringify({ error: "Routine contains no workout days." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize workouts structure
    const normalizedWorkouts = rawWorkouts.map((w: any, idx: number) => {
      const name = (w.name || w.dayName || `Day ${idx + 1}`).trim();
      const days = Array.isArray(w.days)
        ? w.days
        : typeof w.dayOrder === "number"
        ? [w.dayOrder]
        : [(idx % 7) + 1];

      const rawExercises = Array.isArray(w.exercises) ? w.exercises : [];
      const exercises = rawExercises.map((ex: any) => ({
        name: (ex.name || "Exercise").trim(),
        muscleGroup: ex.muscleGroup || "General",
        sets: Number(ex.sets || ex.targetSets || 3),
        reps: Number(ex.reps || ex.targetReps || 10),
        weight: Number(ex.weight || 0),
      }));

      return { name, days, exercises };
    });

    // 1. Try atomic stored procedure if available in Postgres
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc(
        "save_workout_routine_atomic",
        {
          p_routine_name: routineName,
          p_workouts: normalizedWorkouts,
        }
      );

      if (!rpcError && rpcResult?.routine_id) {
        return new Response(
          JSON.stringify({ success: true, routineId: rpcResult.routine_id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch {
      // Proceed to direct table fallback
    }

    // 2. Fallback: Multi-step relational persistence matching app schema
    // Fetch available exercises for ID resolution
    const { data: existingExercises } = await supabase
      .from("exercises")
      .select("id, name");

    const exerciseMap: Record<string, string> = {};
    if (existingExercises) {
      for (const ex of existingExercises) {
        if (ex.name) {
          exerciseMap[ex.name.toLowerCase().trim()] = ex.id;
        }
      }
    }

    const resolvedExerciseIds: Record<string, string> = {};

    for (const workout of normalizedWorkouts) {
      for (const ex of workout.exercises) {
        const cleanName = ex.name.trim();
        const key = cleanName.toLowerCase();

        if (exerciseMap[key]) {
          resolvedExerciseIds[cleanName] = exerciseMap[key];
          continue;
        }

        const matched = existingExercises?.find(
          (e: any) =>
            e.name.toLowerCase().includes(key) ||
            key.includes(e.name.toLowerCase())
        );

        if (matched) {
          resolvedExerciseIds[cleanName] = matched.id;
          continue;
        }

        try {
          const { data: newEx } = await supabase
            .from("exercises")
            .insert({
              name: cleanName,
              muscle_group_id: 1,
              user_id: user.id,
            })
            .select("id")
            .single();

          if (newEx?.id) {
            resolvedExerciseIds[cleanName] = newEx.id;
            exerciseMap[key] = newEx.id;
            continue;
          }
        } catch {
          // Fall back to first available exercise if RLS constrains custom insert
        }

        if (existingExercises && existingExercises.length > 0) {
          resolvedExerciseIds[cleanName] = existingExercises[0].id;
        }
      }
    }

    // Create routine record in workout_routines
    const { data: routineRecord, error: rError } = await supabase
      .from("workout_routines")
      .insert({
        name: routineName,
        user_id: user.id,
        is_prebuilt: false,
      })
      .select("id")
      .single();

    if (rError || !routineRecord) {
      throw rError || new Error("Failed to create workout routine record.");
    }

    const routineId = routineRecord.id;
    const createdWorkoutIds: string[] = [];

    // Create each workout and link exercises
    for (const workout of normalizedWorkouts) {
      const { data: workoutRecord, error: wError } = await supabase
        .from("workouts")
        .insert({
          name: workout.name,
          days: workout.days,
          user_id: user.id,
        })
        .select("id")
        .single();

      if (wError || !workoutRecord) continue;
      createdWorkoutIds.push(workoutRecord.id);

      if (workout.exercises.length > 0) {
        const exercisesToInsert = workout.exercises
          .map((ex, idx) => {
            const exerciseId = resolvedExerciseIds[ex.name.trim()];
            if (!exerciseId) return null;
            return {
              workout_id: workoutRecord.id,
              exercise_id: exerciseId,
              sets: ex.sets || 3,
              reps: ex.reps || 10,
              weight: ex.weight || 0,
              order_index: idx,
            };
          })
          .filter(Boolean);

        if (exercisesToInsert.length > 0) {
          await supabase.from("workout_exercises").insert(exercisesToInsert);
        }
      }
    }

    // Link workouts to routine
    if (createdWorkoutIds.length > 0) {
      const daysPayload = createdWorkoutIds.map((workoutId, idx) => ({
        routine_id: routineId,
        workout_id: workoutId,
        order_index: idx,
      }));

      await supabase.from("workout_routine_days").insert(daysPayload);
    }

    return new Response(
      JSON.stringify({ success: true, routineId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Failed to persist routine." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
