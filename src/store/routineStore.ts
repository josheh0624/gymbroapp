import Exercise from "@/models/excerciseModel";
import WorkoutRoutine from "@/models/workout-routine-model";
import { create } from "zustand";
import { supabase } from "@/api/supabase";
import * as SecureStore from "expo-secure-store";

export interface ActiveSession {
  workoutId: string;
  routineId: string;
  selectedDateString: string;
  startTime: number;
}

interface RoutineListItem {
  id: string;
  name: string;
  is_prebuilt: boolean;
  workout_count: number;
}

interface RoutineState {
  routines: WorkoutRoutine[];
  exercises: Exercise[];
  routineList: RoutineListItem[];
  activeRoutineId: string | null;
  activeSession: ActiveSession | null;
  isLoading: boolean;
  error: string | null;
  streak: number;
  workedOutToday: boolean;

  setStreakData: (streak: number, workedOutToday: boolean) => void;
  fetchRoutineList: () => Promise<void>;
  fetchRoutineById: (id: string) => Promise<void>;
  createRoutine: (name: string, workoutIds: string[]) => Promise<string | null>;
  updateRoutine: (id: string, name: string, workoutIds: string[]) => Promise<boolean>;
  deleteRoutine: (id: string) => Promise<boolean>;
  addRoutine: (routine: WorkoutRoutine) => void;
  setActiveRoutine: (id: string | null) => void;
  startSession: (routineId: string, workoutId: string, dateStr: string) => void;
  endSession: () => void;
  loadActiveRoutine: () => Promise<void>;
  getActiveRoutine: () => WorkoutRoutine | undefined;
  getExerciseById: (routineId: string, workoutId: string) => Promise<void>;

  markWorkoutDone: (routineId: string, workoutId: string, selectedDateString?: string, durationSeconds?: number) => Promise<boolean>;
  resetWorkoutProgress: (routineId: string, workoutId: string) => void;
  syncWorkoutProgress: (routineId: string, workoutId: string, dateStr: string) => Promise<void>;
  markExerciseDone: (
    routineId: string,
    workoutId: string,
    workoutExerciseId: string | undefined,
    exerciseId: string,
    isDone: boolean,
    selectedDateString?: string,
  ) => Promise<void>;
  updateExerciseDetails: (
    routineId: string,
    workoutId: string,
    workoutExerciseId: string,
    updates: { weight?: number | null; reps?: number; sets?: number },
  ) => Promise<void>;
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
  routines: [],
  exercises: [],
  routineList: [],
  activeRoutineId: null,
  activeSession: null,
  isLoading: false,
  error: null,
  streak: 0,
  workedOutToday: false,

  setStreakData: (streak, workedOutToday) => set({ streak, workedOutToday }),

  fetchRoutineList: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('workout_routines')
        .select('id, name, is_prebuilt, workout_routine_days(count)')
        .order('name');
      
      if (error) throw error;
      
      const parsedData = data.map((r: any) => ({
        id: r.id,
        name: r.name,
        is_prebuilt: r.is_prebuilt,
        workout_count: r.workout_routine_days[0]?.count || 0
      }));

      set({ routineList: parsedData, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchRoutineById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('workout_routines')
        .select(`
          id, name,
          workout_routine_days (
            order_index,
            workouts (
              id, name, days,
              workout_exercises (
                id, sets, reps, weight, order_index,
                exercises (
                  id, name,
                  muscle_groups ( name )
                )
              )
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Routine not found");

      const routine: WorkoutRoutine = {
        id: data.id,
        name: data.name,
        workouts: []
      };

      const days = (data.workout_routine_days || []) as any[];
      days.sort((a, b) => a.order_index - b.order_index);

      for (const day of days) {
        const w = day.workouts;
        if (!w) continue;
        
        const exercises = (w.workout_exercises || []) as any[];
        exercises.sort((a, b) => a.order_index - b.order_index);

        const parsedExercises = exercises.map((we: any) => ({
          workoutExerciseId: we.id,
          id: we.exercises?.id,
          name: we.exercises?.name,
          muscleGroupName: we.exercises?.muscle_groups?.name,
          sets: we.sets,
          reps: we.reps,
          weight: we.weight,
          isDone: false
        }));

        routine.workouts.push({
          id: w.id,
          name: w.name,
          days: w.days,
          exercises: parsedExercises
        });
      }

      set((state) => ({
        routines: state.routines.some((r) => r.id === routine.id)
          ? state.routines.map((r) => (r.id === routine.id ? routine : r))
          : [...state.routines, routine],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createRoutine: async (name, workoutIds) => {
    set({ isLoading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      
      const { data: routine, error: rError } = await supabase
        .from('workout_routines')
        .insert({ name, user_id: userId })
        .select()
        .single();
        
      if (rError) throw rError;

      const days = workoutIds.map((wId, i) => ({
        routine_id: routine.id,
        workout_id: wId,
        order_index: i
      }));

      if (days.length > 0) {
        const { error: dError } = await supabase.from('workout_routine_days').insert(days);
        if (dError) throw dError;
      }

      await get().fetchRoutineList();
      set({ isLoading: false });
      return routine.id;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  updateRoutine: async (id, name, workoutIds) => {
    set({ isLoading: true, error: null });
    try {
      const { error: rError } = await supabase
        .from('workout_routines')
        .update({ name })
        .eq('id', id);
      if (rError) throw rError;

      const { error: delError } = await supabase
        .from('workout_routine_days')
        .delete()
        .eq('routine_id', id);
      if (delError) throw delError;

      const days = workoutIds.map((wId, i) => ({
        routine_id: id,
        workout_id: wId,
        order_index: i
      }));

      if (days.length > 0) {
        const { error: dError } = await supabase.from('workout_routine_days').insert(days);
        if (dError) throw dError;
      }

      await get().fetchRoutineList();
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  deleteRoutine: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase.from('workout_routines').delete().eq('id', id);
      if (error) throw error;
      
      await get().fetchRoutineList();
      set({ isLoading: false });
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  addRoutine: (routine) =>
    set((state) => ({
      routines: state.routines.some((r) => r.id === routine.id)
        ? state.routines
        : [...state.routines, routine],
    })),

  setActiveRoutine: async (id) => {
    set({ activeRoutineId: id });
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (userId) {
        if (id) {
          await SecureStore.setItemAsync(`active_routine_${userId}`, id);
        } else {
          await SecureStore.deleteItemAsync(`active_routine_${userId}`);
        }
      }
    } catch (err) {
      console.error("Failed to persist active routine", err);
    }
  },

  startSession: (routineId, workoutId, dateStr) => set((state) => ({
    activeSession: state.activeSession?.workoutId === workoutId && state.activeSession?.selectedDateString === dateStr 
      ? state.activeSession 
      : { workoutId, routineId, selectedDateString: dateStr, startTime: Date.now() }
  })),

  endSession: () => set({ activeSession: null }),

  loadActiveRoutine: async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (userId) {
        const storedId = await SecureStore.getItemAsync(`active_routine_${userId}`);
        if (storedId) {
          set({ activeRoutineId: storedId });
          // Optionally fetch the routine if it's not already in the list
          const { routines } = get();
          if (!routines.find(r => r.id === storedId)) {
            await get().fetchRoutineById(storedId);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load active routine", err);
    }
  },

  getActiveRoutine: () => {
    const { routines, activeRoutineId } = get();
    return routines.find((r) => r.id === activeRoutineId);
  },

  getExerciseById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*, muscle_groups(name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      
      const ex: any = { ...data, muscleGroupName: data.muscle_groups?.name };

      set((state) => ({
        exercises: state.exercises.some((e) => e.id === ex.id)
          ? state.exercises.map((e) => (e.id === ex.id ? ex : e))
          : [...state.exercises, ex],
        isLoading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  markWorkoutDone: async (routineId, workoutId, selectedDateString, durationSeconds) => {
    set({ isLoading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        console.warn("Attempted to access routineStore while not logged in.");
        return false as any;
      }

      const routine = get().routines.find((r) => r.id === routineId);
      const workout = routine?.workouts.find((w) => w.id === workoutId);
      const doneExerciseIds = workout?.exercises
        .filter((e) => e.isDone && e.workoutExerciseId)
        .map((e) => e.workoutExerciseId) || [];

      const dateStr = selectedDateString || new Date().toISOString();
      const allWeIds = workout?.exercises.map(e => e.workoutExerciseId).filter(Boolean) || [];

      // 1. Delete ALL existing logs for this workout's exercises for today to prevent duplicates
      if (allWeIds.length > 0) {
        await supabase
          .from('workout_log')
          .delete()
          .eq('user_id', userId)
          .in('workout_exercise_id', allWeIds as string[])
          .gte('completed_at', `${dateStr.substring(0,10)}T00:00:00Z`)
          .lte('completed_at', `${dateStr.substring(0,10)}T23:59:59Z`);
      }

      // 2. Insert ONLY the exercises that were marked as done
      if (doneExerciseIds.length > 0) {
        const insertData = doneExerciseIds.map(id => {
          const exercise = workout?.exercises.find(e => e.workoutExerciseId === id);
          return {
            user_id: userId,
            workout_exercise_id: id as string,
            completed_at: new Date(dateStr).toISOString(),
            weight: exercise?.weight || null
          };
        });
        const { error } = await supabase
          .from('workout_log')
          .insert(insertData);
          
        if (error) console.error("Error inserting workout log:", error);
      }

      if (durationSeconds !== undefined) {
        try {
          // Attempt to log session duration
          // Note: Requires a `workout_sessions` table in Supabase
          await supabase.from('workout_sessions').insert({
            user_id: userId,
            routine_id: routineId,
            workout_id: workoutId,
            duration_seconds: durationSeconds,
            completed_at: new Date(dateStr).toISOString()
          });
        } catch (e) {
          console.warn("Could not save workout session duration. Make sure workout_sessions table exists.", e);
        }
      }

      set((state) => ({ isLoading: false, activeSession: null }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  syncWorkoutProgress: async (routineId, workoutId, dateStr) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('workout_log')
        .select('workout_exercise_id')
        .eq('user_id', userId)
        .gte('completed_at', `${dateStr.substring(0,10)}T00:00:00Z`)
        .lte('completed_at', `${dateStr.substring(0,10)}T23:59:59Z`);
      
      if (error) throw error;
      
      const completedIds = new Set(data.map(d => d.workout_exercise_id));
      set((state) => ({
        routines: state.routines.map((routine) =>
          routine.id !== routineId
            ? routine
            : {
                ...routine,
                workouts: routine.workouts.map((workout) =>
                  workout.id !== workoutId
                    ? workout
                    : {
                        ...workout,
                        exercises: workout.exercises.map((exercise) => ({
                          ...exercise,
                          isDone: exercise.workoutExerciseId ? completedIds.has(exercise.workoutExerciseId) : false,
                        })),
                      },
                ),
              },
        ),
      }));
    } catch (err) {
      console.error("syncWorkoutProgress error:", err);
    }
  },

  resetWorkoutProgress: (routineId, workoutId) =>
    set((state) => ({
      routines: state.routines.map((routine) =>
        routine.id !== routineId
          ? routine
          : {
              ...routine,
              workouts: routine.workouts.map((workout) =>
                workout.id !== workoutId
                  ? workout
                  : {
                      ...workout,
                      exercises: workout.exercises.map((exercise) => ({
                        ...exercise,
                        isDone: false,
                      })),
                    },
              ),
            },
      ),
    })),

  markExerciseDone: async (
    routineId,
    workoutId,
    workoutExerciseId,
    exerciseId,
    isDone,
    selectedDateString,
  ) => {
    const applyIsDone = (value: boolean) =>
      set((state) => ({
        routines: state.routines.map((r) => {
          if (r.id !== routineId) return r;
          return {
            ...r,
            workouts: r.workouts.map((w) => {
              if (w.id !== workoutId) return w;
              return {
                ...w,
                exercises: w.exercises.map((e) =>
                  e.workoutExerciseId === workoutExerciseId ||
                  (!workoutExerciseId && e.id === exerciseId)
                    ? { ...e, isDone: value }
                    : e,
                ),
              };
            }),
          };
        }),
      }));

    applyIsDone(isDone); 
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId || !workoutExerciseId) return;
      
      const dateStr = selectedDateString || new Date().toISOString();

      if (isDone) {
        // Find the weight of this exercise from state
        const routine = get().routines.find(r => r.id === routineId);
        const workout = routine?.workouts.find(w => w.id === workoutId);
        const exercise = workout?.exercises.find(e => e.workoutExerciseId === workoutExerciseId);
        const weight = exercise?.weight || null;

        // Insert log. Using standard insert. If it errors due to unique constraint, that's fine.
        await supabase.from('workout_log').insert({
          user_id: userId,
          workout_exercise_id: workoutExerciseId,
          completed_at: dateStr,
          weight: weight
        });
      } else {
        await supabase
          .from('workout_log')
          .delete()
          .eq('user_id', userId)
          .eq('workout_exercise_id', workoutExerciseId)
          .gte('completed_at', `${dateStr.substring(0,10)}T00:00:00Z`)
          .lte('completed_at', `${dateStr.substring(0,10)}T23:59:59Z`);
      }
    } catch(err) {
      console.error(err);
    }
  },

  updateExerciseDetails: async (
    routineId,
    workoutId,
    workoutExerciseId,
    updates,
  ) => {
    // Optimistic update
    set((state) => ({
      routines: state.routines.map((routine) =>
        routine.id !== routineId
          ? routine
          : {
              ...routine,
              workouts: routine.workouts.map((workout) =>
                workout.id !== workoutId
                  ? workout
                  : {
                      ...workout,
                      exercises: workout.exercises.map((exercise) =>
                        exercise.workoutExerciseId !== workoutExerciseId
                          ? exercise
                          : {
                              ...exercise,
                              weight: updates.weight !== undefined ? updates.weight : exercise.weight,
                              reps: updates.reps !== undefined ? updates.reps : exercise.reps,
                              sets: updates.sets !== undefined ? updates.sets : exercise.sets,
                            },
                      ),
                    },
              ),
            },
      ),
    }));

    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .update({ weight: updates.weight, reps: updates.reps, sets: updates.sets })
        .eq('id', workoutExerciseId)
        .select()
        .single();
        
      if (error) throw error;
    } catch (err: any) {
      set({ error: err.message });
      // In a real app we'd roll back here, but for now just show error
    }
  },
}));
