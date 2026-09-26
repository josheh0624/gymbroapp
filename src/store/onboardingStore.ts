import { create } from "zustand";

interface OnboardingState {
  username: string;
  email: string;
  setRegisterData: (username: string, email: string) => void;
  clear: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  username: "",
  email: "",
  setRegisterData: (username, email) => set({ username, email }),
  clear: () => set({ username: "", email: "" }),
}));
