ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;