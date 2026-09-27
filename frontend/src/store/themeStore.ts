import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

type ThemeMode = "light" | "dark";

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark", // default
  toggleTheme: () => {
    const nextTheme = get().theme === "light" ? "dark" : "light";
    set({ theme: nextTheme });
    SecureStore.setItemAsync("app_theme", nextTheme).catch(console.error);
  },
  setTheme: (theme) => {
    set({ theme });
    SecureStore.setItemAsync("app_theme", theme).catch(console.error);
  },
  loadTheme: async () => {
    try {
      const storedTheme = await SecureStore.getItemAsync("app_theme");
      if (storedTheme === "light" || storedTheme === "dark") {
        set({ theme: storedTheme });
      }
    } catch (error) {
      console.error("Failed to load theme", error);
    }
  },
}));
