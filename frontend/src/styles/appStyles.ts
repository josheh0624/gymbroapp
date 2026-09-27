import { useThemeStore } from "@/store/themeStore";

export const darkColors = {
  bg: "#111214",           // Darkest bg
  bgElevated: "#1C1D22",   // Slightly elevated card bg
  text: "#F5F6F7",         // Primary text
  textFaint: "#8A8F98",    // Secondary/icon text
  textMuted: "rgba(255,255,255,0.5)", // Disabled/muted text
  accent: "#4169E1",       // Primary gold
  accentTranslucent: "rgba(65, 105, 225, 0.4)",
  accentMuted: "rgba(65, 105, 225, 0.15)",
  surface: "rgba(255,255,255,0.045)", // Glass background
  surfaceBorder: "rgba(255,255,255,0.09)", // Glass border
  glassStrong: "rgba(255,255,255,0.06)",
  glassStrongBorder: "rgba(255,255,255,0.15)",
  coral: "#FF4D5E",        // Delete/Error
  gradientTop: "#25262E",
  gradientBottom: "#141518",
  successBg: "rgba(48,209,88,0.15)",
  errorBg: "rgba(255,69,58,0.15)",
};

export const lightColors = {
  bg: "#F2F2F7",           // Apple light gray bg
  bgElevated: "#FFFFFF",   // Elevated card bg
  text: "#000000",         // Primary text
  textFaint: "#8E8E93",    // Secondary/icon text
  textMuted: "rgba(0,0,0,0.5)", // Disabled/muted text
  accent: "#4169E1",       // Primary gold
  accentTranslucent: "rgba(65, 105, 225, 0.4)",
  accentMuted: "rgba(65, 105, 225, 0.15)",
  surface: "rgba(255,255,255,0.7)", // Light glass background
  surfaceBorder: "rgba(0,0,0,0.05)", // Light glass border
  glassStrong: "rgba(255,255,255,0.9)",
  glassStrongBorder: "rgba(0,0,0,0.1)",
  coral: "#FF3B30",        // Delete/Error
  gradientTop: "#FFFFFF",
  gradientBottom: "#F2F2F7",
  successBg: "rgba(52,199,89,0.15)",
  errorBg: "rgba(255,59,48,0.15)",
};

// We leave COLORS as darkColors by default for non-hook fallbacks
export const COLORS = darkColors;

export const WORKOUT_PAGE_COLORS = {
  dockNeutral: "#34353A",
};

export type ThemeColors = typeof darkColors;

export function useThemeColors(): ThemeColors {
  const theme = useThemeStore((state) => state.theme);
  return theme === "light" ? lightColors : darkColors;
}
