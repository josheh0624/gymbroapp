-- ============================================
-- Supabase RPC Functions for Gymbro
-- ============================================

CREATE OR REPLACE FUNCTION get_completed_exercises(p_user_id UUID, p_workout_id UUID, p_date_str TEXT)
RETURNS TABLE (workout_exercise_id UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT wl.workout_exercise_id
  FROM public.workout_log wl
  JOIN public.workout_exercises we ON we.id = wl.workout_exercise_id
  WHERE wl.user_id = p_user_id
    AND we.workout_id = p_workout_id
    AND (wl.completed_at AT TIME ZONE 'UTC')::date = p_date_str::date;
END;
$$;

CREATE OR REPLACE FUNCTION toggle_exercise_done(p_user_id UUID, p_we_id UUID, p_is_done BOOLEAN, p_date_str TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_is_done THEN
    INSERT INTO public.workout_log (user_id, workout_exercise_id, completed_at)
    VALUES (p_user_id, p_we_id, p_date_str::timestamptz)
    ON CONFLICT (user_id, workout_exercise_id, ((completed_at AT TIME ZONE 'UTC')::date)) DO NOTHING;
  ELSE
    DELETE FROM public.workout_log
    WHERE user_id = p_user_id
      AND workout_exercise_id = p_we_id
      AND (completed_at AT TIME ZONE 'UTC')::date = p_date_str::date;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_muscle_summary(p_user_id UUID, p_start_date TEXT, p_end_date TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_muscle_hits JSONB;
  v_stats JSONB;
  v_daily JSONB;
  v_streak INTEGER := 0;
  v_completed_dates DATE[];
  v_check_date DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- 1. Muscle Hits (MATCHES UI `WeeklyMuscleHit`)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'muscleGroupName', counts.name,
    'timesHit', counts.val
  )), '[]'::jsonb)
  INTO v_muscle_hits
  FROM (
    SELECT mg.name, COUNT(wl.id)::integer as val
    FROM public.workout_log wl
    JOIN public.workout_exercises we ON we.id = wl.workout_exercise_id
    JOIN public.exercises e ON e.id = we.exercise_id
    JOIN public.muscle_groups mg ON mg.id = e.muscle_group_id
    WHERE wl.user_id = p_user_id
      AND (wl.completed_at AT TIME ZONE 'UTC')::date BETWEEN p_start_date::date AND p_end_date::date
    GROUP BY mg.id, mg.name
  ) counts;

  -- 2. Daily Activity (MATCHES UI `DailyActivity`)
  WITH days AS (
    SELECT generate_series(p_start_date::date, p_end_date::date, '1 day'::interval)::date AS d
  ),
  completed_workouts AS (
    SELECT (wl.completed_at AT TIME ZONE 'UTC')::date AS d, we.workout_id
    FROM public.workout_log wl
    JOIN public.workout_exercises we ON we.id = wl.workout_exercise_id
    WHERE wl.user_id = p_user_id
    GROUP BY (wl.completed_at AT TIME ZONE 'UTC')::date, we.workout_id
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', to_char(grouped.d, 'YYYY-MM-DD'),
    'trained', grouped.trained,
    'workoutCount', grouped.workoutCount
  )), '[]'::jsonb)
  INTO v_daily
  FROM (
    SELECT days.d, 
           (COUNT(cw.workout_id) > 0) AS trained, 
           COUNT(cw.workout_id)::integer AS workoutCount
    FROM days
    LEFT JOIN completed_workouts cw ON cw.d = days.d
    GROUP BY days.d
    ORDER BY days.d
  ) grouped;

  -- 3. Stats (MATCHES UI `WeeklyStats`)
  SELECT jsonb_build_object(
    'totalWorkouts', COALESCE((
      SELECT COUNT(DISTINCT (we.workout_id, (wl.completed_at AT TIME ZONE 'UTC')::date))
      FROM public.workout_log wl
      JOIN public.workout_exercises we ON we.id = wl.workout_exercise_id
      WHERE wl.user_id = p_user_id
        AND (wl.completed_at AT TIME ZONE 'UTC')::date BETWEEN p_start_date::date AND p_end_date::date
    ), 0),
    'totalVolume', COALESCE((
      SELECT SUM(we.weight * we.sets * we.reps)
      FROM public.workout_log wl
      JOIN public.workout_exercises we ON we.id = wl.workout_exercise_id
      WHERE wl.user_id = p_user_id
        AND (wl.completed_at AT TIME ZONE 'UTC')::date BETWEEN p_start_date::date AND p_end_date::date
    ), 0),
    'totalSets', COALESCE((
      SELECT SUM(we.sets)
      FROM public.workout_log wl
      JOIN public.workout_exercises we ON we.id = wl.workout_exercise_id
      WHERE wl.user_id = p_user_id
        AND (wl.completed_at AT TIME ZONE 'UTC')::date BETWEEN p_start_date::date AND p_end_date::date
    ), 0),
    'totalExercises', COALESCE((
      SELECT COUNT(DISTINCT we.exercise_id)
      FROM public.workout_log wl
      JOIN public.workout_exercises we ON we.id = wl.workout_exercise_id
      WHERE wl.user_id = p_user_id
        AND (wl.completed_at AT TIME ZONE 'UTC')::date BETWEEN p_start_date::date AND p_end_date::date
    ), 0),
    'daysTrained', (
      SELECT COUNT(DISTINCT (wl.completed_at AT TIME ZONE 'UTC')::date)
      FROM public.workout_log wl
      WHERE wl.user_id = p_user_id
        AND (wl.completed_at AT TIME ZONE 'UTC')::date BETWEEN p_start_date::date AND p_end_date::date
    ),
    'personalRecords', 0
  ) INTO v_stats;

  -- 4. Streak Calculation
  SELECT array_agg(DISTINCT (wl.completed_at AT TIME ZONE 'UTC')::date)
  INTO v_completed_dates
  FROM public.workout_log wl
  WHERE wl.user_id = p_user_id;

  IF v_completed_dates IS NULL THEN
    v_completed_dates := ARRAY[]::DATE[];
  END IF;

  v_check_date := v_today;
  IF v_today = ANY(v_completed_dates) THEN
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  ELSE
    v_check_date := v_check_date - 1;
    IF v_check_date = ANY(v_completed_dates) THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - 1;
    END IF;
  END IF;

  WHILE v_streak > 0 AND v_check_date = ANY(v_completed_dates) LOOP
    v_streak := v_streak + 1;
    v_check_date := v_check_date - 1;
  END LOOP;

  -- Merge Streak into Stats
  v_stats := jsonb_set(v_stats, '{currentStreak}', to_jsonb(v_streak));

  RETURN jsonb_build_object(
    'muscleHits', v_muscle_hits,
    'stats', v_stats,
    'dailyActivity', v_daily
  );
END;
$$;
