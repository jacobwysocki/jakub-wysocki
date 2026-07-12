import { create } from "zustand";

export type ViewMode = "simple" | "desktop";

export const MODE_STORAGE_KEY = "jw-view-mode";

/**
 * Skrypt blokujący w <head> — ustala tryb PRZED pierwszym paintem
 * (zapis użytkownika albo domyślnie "simple"),
 * zapisuje go w data-mode na <html>. CSS w globals.css używa tego atrybutu,
 * żeby nie mignął niewłaściwy widok przed hydratacją.
 */
export const MODE_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem("${MODE_STORAGE_KEY}");if(m!=="desktop"&&m!=="simple"){m="simple"}document.documentElement.dataset.mode=m}catch(e){document.documentElement.dataset.mode="simple"}})()`;

type ModeState = {
  /** null = jeszcze nie odczytany (SSR / przed hydratacją) */
  mode: ViewMode | null;
  /** Odczyt trybu ustalonego przez skrypt inicjalizujący */
  hydrate: () => void;
  setMode: (mode: ViewMode) => void;
};

export const useModeStore = create<ModeState>((set) => ({
  mode: null,
  hydrate: () => {
    const attr = document.documentElement.dataset.mode;
    set({ mode: attr === "desktop" ? "desktop" : "simple" });
  },
  setMode: (mode) => {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, mode);
    } catch {
      /* tryb prywatny — wybór po prostu nie przetrwa sesji */
    }
    document.documentElement.dataset.mode = mode;
    set({ mode });
  },
}));
