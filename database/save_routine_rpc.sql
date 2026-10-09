-- ============================================================================
-- GymBro Application - Atomic Routine Persistence Stored Procedure (RPC)
-- Streamlines 10-20 client queries into a single atomic database transaction.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.save_workout_routine_atomic(
  p_routine_name TEXT,
  p_workouts JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_routine_id UUID;
  v_workout RECORD;
  v_workout_id UUID;
  v_workout_days INT[];
  v_exercise RECORD;
  v_exercise_id UUID;
  v_order_idx INT := 0;
  v_ex_idx INT := 0;
BEGIN
  -- 1. Ensure user is authenticated
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to save custom routines.';
  END IF;

  -- 2. Create the workout_routines record
  INSERT INTO public.workout_routines (name, user_id, is_prebuilt)
  VALUES (COALESCE(p_routine_name, 'Custom Workout Routine'), v_user_id, false)
  RETURNING id INTO v_routine_id;

  -- 3. Loop through each workout day in the JSON payload
  FOR v_workout IN SELECT * FROM jsonb_to_recordset(p_workouts) AS x(
    name TEXT,
    days INT[],
    exercises JSONB
  )
  LOOP
    -- Insert workout
    INSERT INTO public.workouts (name, days, user_id)
    VALUES (
      COALESCE(v_workout.name, 'Workout Day'),
      COALESCE(v_workout.days, ARRAY[1]::INT[]),
      v_user_id
    )
    RETURNING id INTO v_workout_id;

    -- Link workout to routine
    INSERT INTO public.workout_routine_days (routine_id, workout_id, order_index)
    VALUES (v_routine_id, v_workout_id, v_order_idx);
    v_order_idx := v_order_idx + 1;

    -- 4. Loop through exercises for this workout
    v_ex_idx := 0;
    IF v_workout.exercises IS NOT NULL THEN
      FOR v_exercise IN SELECT * FROM jsonb_to_recordset(v_workout.exercises) AS y(
        name TEXT,
        sets INT,
        reps INT,
        weight NUMERIC
      )
      LOOP
        -- Find existing exercise ID
        SELECT id INTO v_exercise_id
        FROM public.exercises
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(v_exercise.name))
        LIMIT 1;

        -- Fallback if not found
        IF v_exercise_id IS NULL THEN
          SELECT id INTO v_exercise_id FROM public.exercises LIMIT 1;
        END IF;

        IF v_exercise_id IS NOT NULL THEN
          INSERT INTO public.workout_exercises (
            workout_id,
            exercise_id,
            sets,
            reps,
            weight,
            order_index
          )
          VALUES (
            v_workout_id,
            v_exercise_id,
            COALESCE(v_exercise.sets, 3),
            COALESCE(v_exercise.reps, 10),
            COALESCE(v_exercise.weight, 0),
            v_ex_idx
          );
          v_ex_idx := v_ex_idx + 1;
        END IF;
      END LOOP;
    END IF;
  END LOOP;

  -- Return success with the new routine id
  RETURN jsonb_build_object(
    'success', true,
    'routine_id', v_routine_id,
    'routine_name', p_routine_name
  );
END;
$$;
