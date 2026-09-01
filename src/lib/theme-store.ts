import { create } from "zustand";
import { resolveInitialTheme, type AppTheme } from "@/lib/theme";

type ThemeState = {
  theme: AppTheme;
  ready: boolean;
  hydrate: () => void;
  toggle: () => void;
};

function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
}

export const useTheme = create<ThemeState>()((set, get) => ({
  theme: "dark",
  ready: false,
  hydrate: () => {
    const stored = resolveInitialTheme(localStorage.getItem("curialy.theme"));
    applyTheme(stored);
    set({ theme: stored, ready: true });
  },
  toggle: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    localStorage.setItem("curialy.theme", next);
    applyTheme(next);
    set({ theme: next });
  },
}));
