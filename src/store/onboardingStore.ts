import { create } from "zustand";

interface OnboardingState {
  username: string;
  email: string;
  passwordHash: string; // we will just store the raw password temporarily in memory
  setRegisterData: (username: string, email: string, passwordHash: string) => void;
  clear: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  username: "",
  email: "",
  passwordHash: "",
  setRegisterData: (username, email, passwordHash) => set({ username, email, passwordHash }),
  clear: () => set({ username: "", email: "", passwordHash: "" }),
}));
