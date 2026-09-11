-- ============================================
-- WORKOUT SESSIONS (one row per time a workout is actually performed)
-- ============================================
CREATE TABLE workout_sessions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workout_id    UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    routine_id    UUID REFERENCES workout_routines(id), -- nullable, in case it's an ad-hoc session
    started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at      TIMESTAMPTZ,
    bodyweight_lbs NUMERIC(6,2),
    notes         TEXT
);

CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_workout_sessions_workout_id ON workout_sessions(workout_id);

-- ============================================
-- SETS (the actual atomic data — weight/reps/RPE per set performed)
-- ============================================
CREATE TABLE workout_exercise_sets (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id            UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
    workout_exercise_id   UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
    set_number            INTEGER NOT NULL,
    weight                NUMERIC(6,2),
    reps                  INTEGER,
    rpe                   NUMERIC(3,1),          -- e.g. 8.5
    set_type              TEXT NOT NULL DEFAULT 'working', -- working | warmup | drop | amrap | failure
    is_done               BOOLEAN NOT NULL DEFAULT false,
    completed_at          TIMESTAMPTZ,
    UNIQUE (session_id, workout_exercise_id, set_number)
);

CREATE INDEX idx_workout_exercise_sets_session_id ON workout_exercise_sets(session_id);
CREATE INDEX idx_workout_exercise_sets_workout_exercise_id ON workout_exercise_sets(workout_exercise_id);

-- ============================================
-- PERSONAL RECORDS (cached, one row per exercise + rep range, per user)
-- ============================================
CREATE TABLE personal_records (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exercise_id   INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    rep_range     INTEGER NOT NULL,        -- e.g. 1, 3, 5, 8, 12
    weight        NUMERIC(6,2) NOT NULL,
    set_id        UUID REFERENCES workout_exercise_sets(id) ON DELETE SET NULL,
    achieved_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, exercise_id, rep_range)
);

CREATE INDEX idx_personal_records_user_exercise ON personal_records(user_id, exercise_id);

-- Small additions to existing tables
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE workout_exercises
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS superset_group INTEGER; -- exercises sharing a number are a superset