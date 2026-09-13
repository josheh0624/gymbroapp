import { create } from "zustand";
import { supabase } from "@/api/supabase";

export type SafeUser = {
  id: string; // uuid
  username: string;
  email: string;
  created_at: string;
  age: number | null;
  height_ft: number | null;
  weight_lbs: number | null;
  sex: string | null;
  image_url: string | null;
};

type AuthState = {
  user: SafeUser | null;
  loading: boolean;
  setUser: (user: SafeUser | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
