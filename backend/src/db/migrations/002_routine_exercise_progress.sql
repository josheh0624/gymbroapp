CREATE TABLE IF NOT EXISTS routine_exercise_progress (
    routine_id UUID NOT NULL REFERENCES workout_routines(id) ON DELETE CASCADE,
    workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    is_done BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    PRIMARY KEY (routine_id, workout_exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_routine_exercise_progress_exercise
  ON routine_exercise_progress(workout_exercise_id);

INSERT INTO routine_exercise_progress (
  routine_id,
  workout_exercise_id,
  is_done,
  completed_at
)
SELECT DISTINCT
  wrd.routine_id,
  we.id,
  we.is_done,
  we.completed_at
FROM workout_routine_days wrd
JOIN workout_exercises we ON we.workout_id = wrd.workout_id
ON CONFLICT (routine_id, workout_exercise_id) DO NOTHING;
