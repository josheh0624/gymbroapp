-- This script seeds the Prebuilt 'Push Pull Legs' routine into the database

DO $$
DECLARE
  v_routine_id UUID;
  v_push_id UUID;
  v_pull_id UUID;
  v_leg_id UUID;
BEGIN
  -- 1. Create the Routine if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM workout_routines WHERE name = 'Push Pull Legs') THEN
    INSERT INTO workout_routines (name, is_prebuilt) VALUES ('Push Pull Legs', true) RETURNING id INTO v_routine_id;
  ELSE
    SELECT id INTO v_routine_id FROM workout_routines WHERE name = 'Push Pull Legs';
    UPDATE workout_routines SET is_prebuilt = true WHERE id = v_routine_id;
  END IF;

  -- 2. Create Workouts if they don't exist
  -- PUSH DAY
  IF NOT EXISTS (SELECT 1 FROM workouts WHERE name = 'Push Day' AND id IN (SELECT workout_id FROM workout_routine_days WHERE routine_id = v_routine_id)) THEN
    INSERT INTO workouts (name) VALUES ('Push Day') RETURNING id INTO v_push_id;
    INSERT INTO workout_routine_days (routine_id, workout_id, order_index) VALUES (v_routine_id, v_push_id, 0);

    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_push_id, id, 4, 6, 0 FROM exercises WHERE name = 'Barbell Bench Press';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_push_id, id, 3, 10, 1 FROM exercises WHERE name = 'Incline Dumbbell Press';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_push_id, id, 3, 8, 2 FROM exercises WHERE name = 'Overhead Press';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_push_id, id, 3, 12, 3 FROM exercises WHERE name = 'Cable Crossover';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_push_id, id, 3, 15, 4 FROM exercises WHERE name = 'Lateral Raises';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_push_id, id, 3, 12, 5 FROM exercises WHERE name = 'Tricep Pushdown';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_push_id, id, 3, 12, 6 FROM exercises WHERE name = 'Overhead Tricep Extension';
  END IF;

  -- PULL DAY
  IF NOT EXISTS (SELECT 1 FROM workouts WHERE name = 'Pull Day' AND id IN (SELECT workout_id FROM workout_routine_days WHERE routine_id = v_routine_id)) THEN
    INSERT INTO workouts (name) VALUES ('Pull Day') RETURNING id INTO v_pull_id;
    INSERT INTO workout_routine_days (routine_id, workout_id, order_index) VALUES (v_routine_id, v_pull_id, 1);

    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_pull_id, id, 2, 5, 0 FROM exercises WHERE name = 'Deadlift';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_pull_id, id, 4, 8, 1 FROM exercises WHERE name = 'Pull-Ups';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_pull_id, id, 3, 10, 2 FROM exercises WHERE name = 'Barbell Row';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_pull_id, id, 3, 12, 3 FROM exercises WHERE name = 'Seated Cable Row';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_pull_id, id, 3, 15, 4 FROM exercises WHERE name = 'Face Pulls';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_pull_id, id, 3, 10, 5 FROM exercises WHERE name = 'Barbell Curl';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_pull_id, id, 3, 12, 6 FROM exercises WHERE name = 'Hammer Curl';
  END IF;

  -- LEG DAY
  IF NOT EXISTS (SELECT 1 FROM workouts WHERE name = 'Leg Day' AND id IN (SELECT workout_id FROM workout_routine_days WHERE routine_id = v_routine_id)) THEN
    INSERT INTO workouts (name) VALUES ('Leg Day') RETURNING id INTO v_leg_id;
    INSERT INTO workout_routine_days (routine_id, workout_id, order_index) VALUES (v_routine_id, v_leg_id, 2);

    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_leg_id, id, 3, 6, 0 FROM exercises WHERE name = 'Barbell Back Squat';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_leg_id, id, 3, 10, 1 FROM exercises WHERE name = 'Romanian Deadlift';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_leg_id, id, 3, 12, 2 FROM exercises WHERE name = 'Leg Press';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_leg_id, id, 3, 12, 3 FROM exercises WHERE name = 'Leg Curl (Lying)';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_leg_id, id, 3, 10, 4 FROM exercises WHERE name = 'Hip Thrust';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_leg_id, id, 4, 15, 5 FROM exercises WHERE name = 'Standing Calf Raises';
    INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, order_index)
    SELECT v_leg_id, id, 3, 12, 6 FROM exercises WHERE name = 'Hanging Leg Raise';
  END IF;

END $$;
