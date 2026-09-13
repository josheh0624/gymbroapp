-- ============================================
-- 1. USERS & AUTH
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  age INTEGER,
  height_ft NUMERIC(5,2),
  weight_lbs INTEGER,
  sex TEXT,
  image_url TEXT
);

-- Trigger to automatically create a user profile when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'username', 'User_' || substr(new.id::text, 1, 8)));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ============================================
-- 2. EXERCISES & MUSCLE GROUPS
-- ============================================
CREATE TABLE public.muscle_groups (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  body_region TEXT
);

CREATE TABLE public.exercises (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  muscle_group_id INTEGER REFERENCES public.muscle_groups(id),
  is_custom BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE
);


-- ============================================
-- 3. ROUTINES & WORKOUTS
-- ============================================
CREATE TABLE public.workout_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_prebuilt BOOLEAN NOT NULL DEFAULT false,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    days SMALLINT[] NOT NULL DEFAULT '{}',
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.workout_routine_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL REFERENCES public.workout_routines(id) ON DELETE CASCADE,
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    UNIQUE (routine_id, workout_id)
);

CREATE TABLE public.workout_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
    sets INTEGER NOT NULL,
    reps INTEGER NOT NULL,
    weight NUMERIC(6,2),
    order_index INTEGER NOT NULL DEFAULT 0,
    UNIQUE (workout_id, exercise_id)
);


-- ============================================
-- 4. WORKOUT LOG (Historical Tracking)
-- ============================================
CREATE TABLE public.workout_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint so they only log an exercise once per calendar day (in UTC)
CREATE UNIQUE INDEX idx_workout_log_daily 
ON public.workout_log (user_id, workout_exercise_id, ((completed_at AT TIME ZONE 'UTC')::date));


-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_routine_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_log ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Muscle Groups & Exercises (Global Read)
CREATE POLICY "Anyone can read muscle groups" ON public.muscle_groups FOR SELECT USING (true);
CREATE POLICY "Anyone can read standard exercises" ON public.exercises FOR SELECT USING (user_id IS NULL);
CREATE POLICY "Users can read/write their custom exercises" ON public.exercises FOR ALL USING (user_id = auth.uid());

-- Routines & Workouts
CREATE POLICY "Anyone can read global routines" ON public.workout_routines FOR SELECT USING (user_id IS NULL);
CREATE POLICY "Users can manage their routines" ON public.workout_routines FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can read global workouts" ON public.workouts FOR SELECT USING (user_id IS NULL);
CREATE POLICY "Users can manage their workouts" ON public.workouts FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Anyone can read global routine days" ON public.workout_routine_days FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workout_routines r WHERE r.id = routine_id AND r.user_id IS NULL)
);
CREATE POLICY "Users can manage their routine days" ON public.workout_routine_days FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workout_routines r WHERE r.id = routine_id AND r.user_id = auth.uid())
);

CREATE POLICY "Anyone can read global workout exercises" ON public.workout_exercises FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id IS NULL)
);
CREATE POLICY "Users can manage their workout exercises" ON public.workout_exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM public.workouts w WHERE w.id = workout_id AND w.user_id = auth.uid())
);

-- Workout Logs
CREATE POLICY "Users can manage their own logs" ON public.workout_log FOR ALL USING (user_id = auth.uid());

-- ============================================
-- 6. SEED DATA
-- ============================================

-- Seed Muscle Groups
INSERT INTO public.muscle_groups (name, body_region) VALUES 
('Mid Chest', 'Chest'), ('Upper Chest', 'Chest'), ('Lower Chest', 'Chest'),
('Lats', 'Back'), ('Rhomboids', 'Back'), ('Lower Back', 'Back'), ('Traps', 'Back'), ('Rear Delts', 'Shoulders'),
('Front Delts', 'Shoulders'), ('Side Delts', 'Shoulders'),
('Quads', 'Legs'), ('Hamstrings', 'Legs'), ('Glutes', 'Legs'), ('Calves', 'Legs'), ('Abductors', 'Legs'), ('Adductors', 'Legs'),
('Biceps', 'Arms'), ('Triceps', 'Arms'), ('Forearms', 'Arms'),
('Abs', 'Core'), ('Obliques', 'Core'),
('Full Body', 'Full Body')
ON CONFLICT (name) DO NOTHING;

-- Seed Standard Exercises
INSERT INTO public.exercises (name, muscle_group_id)
SELECT v.exercise_name, mg.id
FROM (VALUES
  ('Barbell Bench Press', 'Mid Chest'), ('Incline Dumbbell Press', 'Upper Chest'), ('Cable Crossover', 'Mid Chest'),
  ('Deadlift', 'Lower Back'), ('Pull-Ups', 'Lats'), ('Barbell Row', 'Lats'), ('Seated Cable Row', 'Rhomboids'), ('Face Pulls', 'Rear Delts'), ('Lat Pulldown', 'Lats'),
  ('Overhead Press', 'Front Delts'), ('Lateral Raises', 'Side Delts'),
  ('Barbell Back Squat', 'Quads'), ('Romanian Deadlift', 'Hamstrings'), ('Leg Press', 'Quads'), ('Leg Curl (Lying)', 'Hamstrings'), ('Leg Curl (Seated)', 'Hamstrings'), ('Hip Thrust', 'Glutes'), ('Standing Calf Raises', 'Calves'), ('Leg Extension', 'Quads'),
  ('Barbell Curl', 'Biceps'), ('Hammer Curl', 'Biceps'), ('Dumbbell Curl', 'Biceps'),
  ('Tricep Pushdown', 'Triceps'), ('Overhead Tricep Extension', 'Triceps'),
  ('Hanging Leg Raise', 'Abs')
) AS v(exercise_name, hit_area)
JOIN public.muscle_groups mg ON mg.name = v.hit_area
ON CONFLICT (name) DO NOTHING;

-- Seed Prebuilt Routines
DO $$
DECLARE
  v_routine_id UUID; v_push_id UUID; v_pull_id UUID; v_leg_id UUID;
  v_ul_routine_id UUID; v_upper_id UUID; v_lower_id UUID;
BEGIN
  -- Push Pull Legs
  INSERT INTO public.workout_routines (name, is_prebuilt) VALUES ('Push Pull Legs', true) RETURNING id INTO v_routine_id;
  
  INSERT INTO public.workouts (name, days) VALUES ('Push Day', '{1,4}') RETURNING id INTO v_push_id;
  INSERT INTO public.workout_routine_days (routine_id, workout_id, order_index) VALUES (v_routine_id, v_push_id, 0);
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_push_id, id, 4, 6, 0 FROM public.exercises WHERE name = 'Barbell Bench Press';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_push_id, id, 3, 10, 1 FROM public.exercises WHERE name = 'Incline Dumbbell Press';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_push_id, id, 3, 8, 2 FROM public.exercises WHERE name = 'Overhead Press';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_push_id, id, 3, 12, 3 FROM public.exercises WHERE name = 'Cable Crossover';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_push_id, id, 3, 15, 4 FROM public.exercises WHERE name = 'Lateral Raises';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_push_id, id, 3, 12, 5 FROM public.exercises WHERE name = 'Tricep Pushdown';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_push_id, id, 3, 12, 6 FROM public.exercises WHERE name = 'Overhead Tricep Extension';

  INSERT INTO public.workouts (name, days) VALUES ('Pull Day', '{2,5}') RETURNING id INTO v_pull_id;
  INSERT INTO public.workout_routine_days (routine_id, workout_id, order_index) VALUES (v_routine_id, v_pull_id, 1);
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_pull_id, id, 2, 5, 0 FROM public.exercises WHERE name = 'Deadlift';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_pull_id, id, 4, 8, 1 FROM public.exercises WHERE name = 'Pull-Ups';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_pull_id, id, 3, 10, 2 FROM public.exercises WHERE name = 'Barbell Row';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_pull_id, id, 3, 12, 3 FROM public.exercises WHERE name = 'Seated Cable Row';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_pull_id, id, 3, 15, 4 FROM public.exercises WHERE name = 'Face Pulls';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_pull_id, id, 3, 10, 5 FROM public.exercises WHERE name = 'Barbell Curl';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_pull_id, id, 3, 12, 6 FROM public.exercises WHERE name = 'Hammer Curl';

  INSERT INTO public.workouts (name, days) VALUES ('Leg Day', '{3,6}') RETURNING id INTO v_leg_id;
  INSERT INTO public.workout_routine_days (routine_id, workout_id, order_index) VALUES (v_routine_id, v_leg_id, 2);
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_leg_id, id, 3, 6, 0 FROM public.exercises WHERE name = 'Barbell Back Squat';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_leg_id, id, 3, 10, 1 FROM public.exercises WHERE name = 'Romanian Deadlift';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_leg_id, id, 3, 12, 2 FROM public.exercises WHERE name = 'Leg Press';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_leg_id, id, 3, 12, 3 FROM public.exercises WHERE name = 'Leg Curl (Lying)';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_leg_id, id, 3, 10, 4 FROM public.exercises WHERE name = 'Hip Thrust';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_leg_id, id, 4, 15, 5 FROM public.exercises WHERE name = 'Standing Calf Raises';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_leg_id, id, 3, 12, 6 FROM public.exercises WHERE name = 'Hanging Leg Raise';

  -- Upper Lower
  INSERT INTO public.workout_routines (name, is_prebuilt) VALUES ('Upper / Lower', true) RETURNING id INTO v_ul_routine_id;

  INSERT INTO public.workouts (name, days) VALUES ('Upper Day', '{1,4}') RETURNING id INTO v_upper_id;
  INSERT INTO public.workout_routine_days (routine_id, workout_id, order_index) VALUES (v_ul_routine_id, v_upper_id, 0);
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_upper_id, id, 3, 6, 0 FROM public.exercises WHERE name = 'Barbell Bench Press';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_upper_id, id, 3, 8, 1 FROM public.exercises WHERE name = 'Barbell Row';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_upper_id, id, 3, 8, 2 FROM public.exercises WHERE name = 'Incline Dumbbell Press';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_upper_id, id, 3, 10, 3 FROM public.exercises WHERE name = 'Lat Pulldown';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_upper_id, id, 3, 12, 4 FROM public.exercises WHERE name = 'Lateral Raises';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_upper_id, id, 3, 10, 5 FROM public.exercises WHERE name = 'Tricep Pushdown';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_upper_id, id, 3, 10, 6 FROM public.exercises WHERE name = 'Dumbbell Curl';

  INSERT INTO public.workouts (name, days) VALUES ('Lower Day', '{2,5}') RETURNING id INTO v_lower_id;
  INSERT INTO public.workout_routine_days (routine_id, workout_id, order_index) VALUES (v_ul_routine_id, v_lower_id, 1);
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_lower_id, id, 3, 6, 0 FROM public.exercises WHERE name = 'Barbell Back Squat';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_lower_id, id, 3, 8, 1 FROM public.exercises WHERE name = 'Romanian Deadlift';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_lower_id, id, 3, 10, 2 FROM public.exercises WHERE name = 'Leg Press';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_lower_id, id, 3, 10, 3 FROM public.exercises WHERE name = 'Leg Curl (Seated)';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_lower_id, id, 3, 12, 4 FROM public.exercises WHERE name = 'Leg Extension';
  INSERT INTO public.workout_exercises (workout_id, exercise_id, sets, reps, order_index) SELECT v_lower_id, id, 4, 12, 5 FROM public.exercises WHERE name = 'Standing Calf Raises';
END $$;
