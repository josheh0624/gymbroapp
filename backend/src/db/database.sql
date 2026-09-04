
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  age INTEGER,
  height_ft NUMERIC(5,2),
  weight_lbs INTEGER,
  sex TEXT,
  image_url TEXT
);

-- ============================================
-- EXERCISES (list of individual exercises)
-- ============================================
CREATE TABLE muscle_groups (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  body_region TEXT -- e.g. 'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core'
);

CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  muscle_group_id INTEGER REFERENCES muscle_groups(id),
  is_custom BOOLEAN NOT NULL DEFAULT false,
  user_id INTEGER REFERENCES users(id) -- nullable, for your custom-exercise scoping
);

-- ============================================
-- WORKOUTS (a single workout, e.g. "Push Day")
-- ============================================
CREATE TABLE workouts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    days        SMALLINT[] NOT NULL DEFAULT '{}', -- e.g. {1,3,5} = Mon/Wed/Fri
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Join table: which exercises belong to which workout, with their sets/reps
-- (sets/reps live here, not on the exercise itself, since the same exercise
-- can have different sets/reps in different workouts)
CREATE TABLE workout_exercises (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id    UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id   INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sets          INTEGER NOT NULL,
    reps          INTEGER NOT NULL,
    order_index   INTEGER NOT NULL DEFAULT 0, -- preserves display order within the workout
    UNIQUE (workout_id, exercise_id),
    weight NUMERIC(6,2),
    is_done BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ;
);

-- ============================================
-- WORKOUT ROUTINES (a routine made of multiple workouts)
-- ============================================
CREATE TABLE workout_routines (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Join table: which workouts belong to which routine, and in what order
CREATE TABLE workout_routine_days (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id    UUID NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
    workout_id    UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    order_index   INTEGER NOT NULL DEFAULT 0,
    UNIQUE (routine_id, workout_id)
);

-- Helpful indexes for common lookups
CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_workout_routine_days_routine_id ON workout_routine_days(routine_id);