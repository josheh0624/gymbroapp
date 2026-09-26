-- ============================================================================
-- GymBro Application - Database Security Hardening & RLS Policies
-- Resolves SEC-03 (IDOR) and SEC-04 (Prebuilt Template Protection)
-- ============================================================================
-- Instructions: Run this script in the Supabase Dashboard SQL Editor to enforce
-- Row Level Security (RLS) at the database layer.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table: workout_routines
-- ----------------------------------------------------------------------------
ALTER TABLE public.workout_routines ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "workout_routines_select_policy" ON public.workout_routines;
DROP POLICY IF EXISTS "workout_routines_insert_policy" ON public.workout_routines;
DROP POLICY IF EXISTS "workout_routines_update_policy" ON public.workout_routines;
DROP POLICY IF EXISTS "workout_routines_delete_policy" ON public.workout_routines;

-- Read: Users can view prebuilt routines (global) or their own custom routines
CREATE POLICY "workout_routines_select_policy"
ON public.workout_routines
FOR SELECT
TO authenticated, anon
USING (
  is_prebuilt = true 
  OR user_id IS NULL 
  OR user_id = auth.uid()
);

-- Insert: Users can only create routines attached to their own user_id and not prebuilt
CREATE POLICY "workout_routines_insert_policy"
ON public.workout_routines
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND (is_prebuilt IS FALSE OR is_prebuilt IS NULL)
);

-- Update: Users can only update their own non-prebuilt routines
CREATE POLICY "workout_routines_update_policy"
ON public.workout_routines
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND is_prebuilt IS NOT TRUE
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND is_prebuilt IS NOT TRUE
);

-- Delete: Users can only delete their own non-prebuilt routines
CREATE POLICY "workout_routines_delete_policy"
ON public.workout_routines
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND is_prebuilt IS NOT TRUE
);


-- ----------------------------------------------------------------------------
-- 2. Table: workouts
-- ----------------------------------------------------------------------------
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workouts_select_policy" ON public.workouts;
DROP POLICY IF EXISTS "workouts_insert_policy" ON public.workouts;
DROP POLICY IF EXISTS "workouts_update_policy" ON public.workouts;
DROP POLICY IF EXISTS "workouts_delete_policy" ON public.workouts;

-- Read: Allow viewing global prebuilt workouts or user's custom workouts
CREATE POLICY "workouts_select_policy"
ON public.workouts
FOR SELECT
TO authenticated, anon
USING (
  user_id IS NULL
  OR user_id = auth.uid()
);

-- Insert: Users can only create workouts owned by themselves
CREATE POLICY "workouts_insert_policy"
ON public.workouts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- Update: Users can only modify their own workouts (prebuilt workouts are immutable)
CREATE POLICY "workouts_update_policy"
ON public.workouts
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- Delete: Users can only delete their own workouts
CREATE POLICY "workouts_delete_policy"
ON public.workouts
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);


-- ----------------------------------------------------------------------------
-- 3. Table: workout_routine_days
-- ----------------------------------------------------------------------------
ALTER TABLE public.workout_routine_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workout_routine_days_select_policy" ON public.workout_routine_days;
DROP POLICY IF EXISTS "workout_routine_days_insert_policy" ON public.workout_routine_days;
DROP POLICY IF EXISTS "workout_routine_days_delete_policy" ON public.workout_routine_days;

-- Read: Visible if the routine is visible
CREATE POLICY "workout_routine_days_select_policy"
ON public.workout_routine_days
FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM public.workout_routines r
    WHERE r.id = workout_routine_days.routine_id
      AND (r.is_prebuilt = true OR r.user_id IS NULL OR r.user_id = auth.uid())
  )
);

-- Insert: Can only link workouts to routines owned by the user
CREATE POLICY "workout_routine_days_insert_policy"
ON public.workout_routine_days
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_routines r
    WHERE r.id = workout_routine_days.routine_id
      AND r.user_id = auth.uid()
      AND r.is_prebuilt IS NOT TRUE
  )
);

-- Delete: Can only delete days from routines owned by the user
CREATE POLICY "workout_routine_days_delete_policy"
ON public.workout_routine_days
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_routines r
    WHERE r.id = workout_routine_days.routine_id
      AND r.user_id = auth.uid()
      AND r.is_prebuilt IS NOT TRUE
  )
);


-- ----------------------------------------------------------------------------
-- 4. Table: workout_exercises
-- ----------------------------------------------------------------------------
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workout_exercises_select_policy" ON public.workout_exercises;
DROP POLICY IF EXISTS "workout_exercises_insert_policy" ON public.workout_exercises;
DROP POLICY IF EXISTS "workout_exercises_update_policy" ON public.workout_exercises;
DROP POLICY IF EXISTS "workout_exercises_delete_policy" ON public.workout_exercises;

-- Read: Visible if workout is visible
CREATE POLICY "workout_exercises_select_policy"
ON public.workout_exercises
FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_exercises.workout_id
      AND (w.user_id IS NULL OR w.user_id = auth.uid())
  )
);

-- Insert: Only into workouts owned by the user
CREATE POLICY "workout_exercises_insert_policy"
ON public.workout_exercises
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_exercises.workout_id
      AND w.user_id = auth.uid()
  )
);

-- Update: Only for workouts owned by the user (prevents altering prebuilt defaults)
CREATE POLICY "workout_exercises_update_policy"
ON public.workout_exercises
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_exercises.workout_id
      AND w.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_exercises.workout_id
      AND w.user_id = auth.uid()
  )
);

-- Delete: Only from workouts owned by the user
CREATE POLICY "workout_exercises_delete_policy"
ON public.workout_exercises
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_exercises.workout_id
      AND w.user_id = auth.uid()
  )
);


-- ----------------------------------------------------------------------------
-- 5. Table: workout_log
-- ----------------------------------------------------------------------------
ALTER TABLE public.workout_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workout_log_user_policy" ON public.workout_log;

CREATE POLICY "workout_log_user_policy"
ON public.workout_log
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- 6. Table: users (Protects user profiles from anonymous scraping)
-- ----------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;
DROP POLICY IF EXISTS "users_delete_self" ON public.users;

-- Read: Authenticated users can view user profiles; anonymous scrapers blocked
CREATE POLICY "users_select_authenticated"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- Insert: Users can only insert their own row matching auth.uid()
CREATE POLICY "users_insert_self"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Update: Users can only update their own row
CREATE POLICY "users_update_self"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Delete: Users can only delete their own account
CREATE POLICY "users_delete_self"
ON public.users
FOR DELETE
TO authenticated
USING (id = auth.uid());


-- ----------------------------------------------------------------------------
-- 7. Table: workout_sessions (Active workout sessions)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'workout_sessions') THEN
    ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "workout_sessions_user_policy" ON public.workout_sessions;

    CREATE POLICY "workout_sessions_user_policy"
    ON public.workout_sessions
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 8. Tables: exercises & muscle_groups (Read-only library for clients)
-- ----------------------------------------------------------------------------
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muscle_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exercises_select_policy" ON public.exercises;
DROP POLICY IF EXISTS "muscle_groups_select_policy" ON public.muscle_groups;

-- Allow authenticated and anonymous users to view the exercise dictionary
CREATE POLICY "exercises_select_policy"
ON public.exercises
FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "muscle_groups_select_policy"
ON public.muscle_groups
FOR SELECT
TO authenticated, anon
USING (true);

-- Note: Mutations to exercises and muscle_groups are prohibited for normal clients
-- and reserved for database administrators via the Supabase Service Role.


