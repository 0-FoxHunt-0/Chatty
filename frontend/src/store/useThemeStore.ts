import { create } from "zustand";

interface IThemeStore {
  theme: string;
  setTheme: (theme: string) => void;
  initializeTheme: () => void;
}

// All available DaisyUI themes
export const DAISYUI_THEMES = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
] as const;

const THEME_STORAGE_KEY = "daisyui-theme";

// Helper functions for localStorage
const getStoredTheme = (): string => {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored || "dark";
  } catch {
    return "dark";
  }
};

const setStoredTheme = (theme: string): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore localStorage errors
  }
};

export const useThemeStore = create<IThemeStore>((set) => ({
  theme: getStoredTheme(),
  setTheme: (theme: string) => {
    set({ theme });
    setStoredTheme(theme);
    // Apply theme to HTML element
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
  },
  initializeTheme: () => {
    const storedTheme = getStoredTheme();
    set({ theme: storedTheme });
    // Apply theme to HTML element
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", storedTheme);
    }
  },
}));
