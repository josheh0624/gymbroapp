import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

//zustand store to house code relating to a user (basically a class kinda)

type SafeUser = {
  id: number;
  username: string;
  email: string;
  created_at: string;
};

type AuthState = {
  user: SafeUser | null;
  loading: boolean;
  setUser: (user: SafeUser | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: SafeUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (user: SafeUser, token: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  login: async (user, token) => {
    await SecureStore.setItemAsync("token", token);
    set({ user });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    set({ user: null });
  },
  register: async (user, token) => {
    await SecureStore.setItemAsync("token", token);
    set({ user });
  },
}));
