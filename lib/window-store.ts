import { create } from "zustand";

export type WinRect = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };
export type AreaSize = { w: number; h: number };

export type Win = {
  /** Identyfikator okna = id aplikacji (okna są singletonami per aplikacja) */
  id: string;
  /** Pozycja/rozmiar w stanie "przywróconym" (nie zmienia się przy maksymalizacji) */
  rect: WinRect;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** Punkt (we współrzędnych pulpitu), z którego okno "wyrasta" przy otwarciu */
  origin: Point | null;
};

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), Math.max(min, max));

type OpenOptions = {
  size: { w: number; h: number };
  area: AreaSize;
  origin?: Point;
};

type WindowManager = {
  windows: Win[];
  focusedId: string | null;
  nextZ: number;
  open: (id: string, opts: OpenOptions) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string) => void;
  restore: (id: string) => void;
  toggleMaximize: (id: string) => void;
  commitRect: (id: string, rect: Partial<WinRect>) => void;
  closeAll: () => void;
};

/** Najwyższe nie-zminimalizowane okno — kandydat do fokusu po zamknięciu/minimalizacji */
function topWindow(windows: Win[], skipId?: string): Win | null {
  let top: Win | null = null;
  for (const w of windows) {
    if (w.id === skipId || w.minimized) continue;
    if (!top || w.z > top.z) top = w;
  }
  return top;
}

export const useWindowStore = create<WindowManager>((set, get) => ({
  windows: [],
  focusedId: null,
  nextZ: 1,

  open: (id, { size, area, origin }) => {
    const { windows, nextZ } = get();
    const existing = windows.find((w) => w.id === id);
    if (existing) {
      set({
        windows: windows.map((w) =>
          w.id === id ? { ...w, minimized: false, z: nextZ } : w
        ),
        nextZ: nextZ + 1,
        focusedId: id,
      });
      return;
    }
    // Wyśrodkowanie z lekką kaskadą, żeby kolejne okna się nie nakrywały 1:1
    const cascade = (windows.length % 4) * 28;
    const w = Math.min(size.w, area.w - 24);
    const h = Math.min(size.h, area.h - 24);
    const x = clamp((area.w - w) / 2 - 42 + cascade, 12, area.w - w - 12);
    const y = clamp((area.h - h) / 2 - 20 + cascade, 8, area.h - h - 8);
    set({
      windows: [
        ...windows,
        {
          id,
          rect: { x, y, w, h },
          z: nextZ,
          minimized: false,
          maximized: false,
          origin: origin ?? null,
        },
      ],
      nextZ: nextZ + 1,
      focusedId: id,
    });
  },

  close: (id) => {
    const { windows } = get();
    const remaining = windows.filter((w) => w.id !== id);
    set({
      windows: remaining,
      focusedId: topWindow(remaining)?.id ?? null,
    });
  },

  focus: (id) => {
    const { windows, nextZ, focusedId } = get();
    const target = windows.find((w) => w.id === id);
    if (!target || (focusedId === id && target.z === nextZ - 1)) return;
    set({
      windows: windows.map((w) => (w.id === id ? { ...w, z: nextZ } : w)),
      nextZ: nextZ + 1,
      focusedId: id,
    });
  },

  minimize: (id) => {
    const { windows } = get();
    const next = windows.map((w) => (w.id === id ? { ...w, minimized: true } : w));
    set({
      windows: next,
      focusedId: topWindow(next, id)?.id ?? null,
    });
  },

  restore: (id) => {
    const { windows, nextZ } = get();
    set({
      windows: windows.map((w) =>
        w.id === id ? { ...w, minimized: false, z: nextZ } : w
      ),
      nextZ: nextZ + 1,
      focusedId: id,
    });
  },

  toggleMaximize: (id) => {
    const { windows, nextZ } = get();
    set({
      windows: windows.map((w) =>
        w.id === id ? { ...w, maximized: !w.maximized, minimized: false, z: nextZ } : w
      ),
      nextZ: nextZ + 1,
      focusedId: id,
    });
  },

  commitRect: (id, rect) => {
    const { windows } = get();
    set({
      windows: windows.map((w) =>
        w.id === id ? { ...w, rect: { ...w.rect, ...rect } } : w
      ),
    });
  },

  closeAll: () => set({ windows: [], focusedId: null }),
}));
