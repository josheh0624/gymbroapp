import Exercise from "@/models/excerciseModel";
import WorkoutRoutine from "@/models/workout-routine-model";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { api } from "../lib/api"; // adjust to your actual config location

//ROUTINE STORE THAT WILL LATER BE UPDATED TO BE AN API MIDDLEWARE AND PERSIST
//AND DO MORE STUFF

interface RoutineListItem {
  id: string;
  name: string;
  workout_count: number;
}

interface RoutineState {
  routines: WorkoutRoutine[]; //workout routine array (full, fetched detail)
  exercises: Exercise[];
  routineList: RoutineListItem[]; //lightweight list for picker screens
  activeRoutineId: string | null; //single routine

  isLoading: boolean;
  error: string | null;

  fetchRoutineList: () => Promise<void>; //GET /routines/getAll
  fetchRoutineById: (id: string) => Promise<void>; //GET /routines/fetchRoutine/:id
  createRoutine: (name: string, workoutIds: string[]) => Promise<string | null>; //POST /routines/create

  addRoutine: (routine: WorkoutRoutine) => void; //local add (kept for optimistic updates)
  setActiveRoutine: (id: string) => void; //set the single routine
  getActiveRoutine: () => WorkoutRoutine | undefined; //get the single active routine
  getExerciseById: (routineId: string, workoutId: string) => Promise<void>;

  markWorkoutDone: (routineId: string, workoutId: string) => Promise<boolean>;
  markExerciseDone: (
    routineId: string,
    workoutId: string,
    workoutExerciseId: string | undefined,
    exerciseId: string,
    isDone: boolean,
  ) => Promise<void>;
}

async function authHeaders() {
  const token = await SecureStore.getItemAsync("token"); // match whatever key useAuthStore uses
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

//routine store
export const useRoutineStore = create<RoutineState>((set, get) => ({
  //state (data)
  routines: [],
  exercises: [],
  routineList: [],
  activeRoutineId: null,
  isLoading: false,
  error: null,

  //actions (update state)

  fetchRoutineList: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<RoutineListItem[]>("/routines/getAll");

      set({ routineList: res.data, isLoading: false });
    } catch (err) {
      console.error("fetchRoutineList error:", err);
      set({
        error:
          err instanceof Error ? err.message : "Failed to fetch routine list",
        isLoading: false,
      });
    }
  },

  fetchRoutineById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<WorkoutRoutine>(`/routines/fetchRoutine/${id}`);

      set((state) => ({
        routines: state.routines.some((r) => r.id === res.data.id)
          ? state.routines.map((r) => (r.id === res.data.id ? res.data : r))
          : [...state.routines, res.data],
        isLoading: false,
      }));
    } catch (err) {
      console.error("fetchRoutineById error:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to fetch routine",
        isLoading: false,
      });
    }
  },

  createRoutine: async (name, workoutIds) => {
    set({ isLoading: true, error: null });
    try {
      const headers = await authHeaders();
      const res = await fetch(`${api}/routines/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name, workoutIds }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to create routine (${res.status})`,
        );
      }

      const created: { id: string; name: string } = await res.json();

      // refresh the lightweight list so the new routine shows up
      await get().fetchRoutineList();

      set({ isLoading: false });
      return created.id;
    } catch (err) {
      console.error("createRoutine error:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to create routine",
        isLoading: false,
      });
      return null;
    }
  },

  addRoutine: (routine) =>
    set((state) => ({
      routines: state.routines.some((r) => r.id === routine.id)
        ? state.routines
        : [...state.routines, routine],
    })),

  setActiveRoutine: (id) => set({ activeRoutineId: id }),

  getActiveRoutine: () => {
    const { routines, activeRoutineId } = get();
    return routines.find((r) => r.id === activeRoutineId);
  },

  getExerciseById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Exercise>(`/routines/fetchExercise/${id}`);

      set((state) => ({
        exercises: state.exercises.some((e) => e.id === res.data.id)
          ? state.exercises.map((e) => (e.id === res.data.id ? res.data : e))
          : [...state.exercises, res.data],
        isLoading: false,
      }));
    } catch (err) {
      console.error("fetchExercisesById error:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to fetch exercise",
        isLoading: false,
      });
    }
  },

  markWorkoutDone: async (routineId, workoutId) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/routines/markDone/${workoutId}`);

      set((state) => ({
        routines: state.routines.map((r) =>
          r.id !== routineId
            ? r
            : {
                ...r,
                workouts: r.workouts.map((w) =>
                  w.id !== workoutId
                    ? w
                    : {
                        ...w,
                        exercises: w.exercises.map((e) => ({
                          ...e,
                          isDone: true,
                        })),
                      },
                ),
              },
        ),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      console.error("markWorkoutDone error:", err);
      set({
        error:
          err instanceof Error ? err.message : "Failed to mark workout done",
        isLoading: false,
      });
      return false;
    }
  },

  markExerciseDone: async (
    routineId,
    workoutId,
    workoutExerciseId,
    exerciseId,
    isDone,
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

    applyIsDone(isDone); // optimistic — feels instant on tap

    if (!workoutExerciseId) {
      set({ error: "Exercise details are still loading." });
      return;
    }

    try {
      await api.patch(`/routines/markExerciseDone/${workoutExerciseId}`, {
        isDone,
      });
    } catch (err) {
      console.error("markExerciseDone error:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to update exercise",
      });
    }
  },
}));
