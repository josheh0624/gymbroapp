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
  routineList: RoutineListItem[]; //lightweight list for picker screens
  activeRoutineId: string | null; //single routine

  isLoading: boolean;
  error: string | null;

  fetchRoutineList: () => Promise<void>; //GET /routines/getAll
  fetchRoutineById: (id: string) => Promise<void>; //GET /routines/fetchRoutine/:id
  createRoutine: (name: string, workoutIds: string[]) => Promise<string | null>; //POST /routines/create

  addRoutine: (routine: WorkoutRoutine) => void; //local add (kept for optimistic updates)
  setActiveRoutine: (id: string) => void; //set the single routine
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
  routineList: [],
  activeRoutineId: null,
  isLoading: false,
  error: null,

  //actions (update state)

  fetchRoutineList: async () => {
    set({ isLoading: true, error: null });
    try {
      const headers = await authHeaders();
      const res = await fetch(`${api}/routines/getAll`, { headers });

      if (!res.ok) {
        throw new Error(`Failed to fetch routines (${res.status})`);
      }

      const data: RoutineListItem[] = await res.json();
      set({ routineList: data, isLoading: false });
    } catch (err) {
      console.error("fetchRoutineList error:", err);
      set({
        error: err instanceof Error ? err.message : "Failed to fetch routines",
        isLoading: false,
      });
    }
  },

  fetchRoutineById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const headers = await authHeaders();
      const res = await fetch(`${api}/routines/fetchRoutine/${id}`, {
        headers,
      });

      if (res.status === 404) {
        throw new Error("Routine not found");
      }
      if (!res.ok) {
        throw new Error(`Failed to fetch routine (${res.status})`);
      }

      const routine: WorkoutRoutine = await res.json();

      set((state) => ({
        routines: state.routines.some((r) => r.id === routine.id)
          ? state.routines.map((r) => (r.id === routine.id ? routine : r)) // update existing
          : [...state.routines, routine], // add new
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
}));
