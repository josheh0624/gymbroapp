import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

//the authStore is a Zustand store that manages the authentication state of the user. It provides methods to set the user and log out, and it uses SecureStore to securely store the authentication token on the device.

// Define the shape of the authentication state
interface AuthState {
  user: any | null;
  loading: boolean;
  setUser: (user: any | null) => void;
  logout: () => Promise<void>;
}

// Create the authentication store using Zustand
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    set({ user: null });
  },
}));
