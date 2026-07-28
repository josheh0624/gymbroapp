import WorkoutRoutine from '@/app/models/workout-routine-model';
import { create } from 'zustand';

//ROUTINE STORE THAT WILL LATER BE UPDATED TO BE AN API MIDDLEWARE AND PERSIST
//AND DO MORE STUFF


interface RoutineState {
    routines: WorkoutRoutine[]; //workout routine array
    activeRoutineId: string | null; //single routine

    addRoutine: (routine: WorkoutRoutine) => void; //add a routine
    setActiveRoutine: (id: string) => void; //set the single routine
}
//routine store 
export const useRoutineStore = create<RoutineState>((set,get) => ({
    //state (data)
    routines: [],
    activeRoutineId: null,

    //actions (update state)
    addRoutine: (routine) =>
        set((state) => ({
            routines: state.routines.some((r) => r.id === routine.id) //find routine that matches id
            ? state.routines // already exists, no change
            : [...state.routines, routine], //add to end of array
    })),

    setActiveRoutine: (id) => set({ activeRoutineId: id }), //take routine id and set active routine to that id
}));
