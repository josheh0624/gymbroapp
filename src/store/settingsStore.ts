import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

export type WeightUnit = "lbs" | "kgs";

interface SettingsState {
  weightUnit: WeightUnit;
  toggleWeightUnit: () => void;
  loadSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  weightUnit: "lbs", // default
  toggleWeightUnit: () => {
    const nextUnit = get().weightUnit === "lbs" ? "kgs" : "lbs";
    set({ weightUnit: nextUnit });
    SecureStore.setItemAsync("app_weight_unit", nextUnit).catch(console.error);
  },
  loadSettings: async () => {
    try {
      const storedUnit = await SecureStore.getItemAsync("app_weight_unit");
      if (storedUnit === "lbs" || storedUnit === "kgs") {
        set({ weightUnit: storedUnit });
      }
    } catch (error) {
      console.error("Failed to load settings", error);
    }
  },
}));
