import { create } from "zustand";
import {
  parseAppId,
  type AppId,
} from "@/features/portfolio-navigation/app-catalog";

export type WinRect = { x: number; y: number; w: number; h: number };
export type Point = { x: number; y: number };
export type AreaSize = { w: number; h: number };

const WINDOW_MIN_W = 360;
const WINDOW_MIN_H = 260;
const WINDOW_GAP_X = 12;
const WINDOW_GAP_Y = 8;

export type Win = {
  /** Identyfikator okna = id aplikacji (okna są singletonami per aplikacja) */
  id: AppId;
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

const finiteOr = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;

/** Keep a restored rectangle inside the current desktop work area. */
export function reconcileWindowRect(rect: WinRect, area: AreaSize): WinRect {
  const areaW = Math.max(1, finiteOr(area.w, 1));
  const areaH = Math.max(1, finiteOr(area.h, 1));
  const gapX = Math.min(WINDOW_GAP_X, Math.max(0, (areaW - 1) / 2));
  const gapY = Math.min(WINDOW_GAP_Y, Math.max(0, (areaH - 1) / 2));
  const availableW = Math.max(1, areaW - gapX * 2);
  const availableH = Math.max(1, areaH - gapY * 2);
  const w = clamp(
    finiteOr(rect.w, WINDOW_MIN_W),
    Math.min(WINDOW_MIN_W, availableW),
    availableW,
  );
  const h = clamp(
    finiteOr(rect.h, WINDOW_MIN_H),
    Math.min(WINDOW_MIN_H, availableH),
    availableH,
  );

  return {
    x: clamp(finiteOr(rect.x, gapX), gapX, areaW - w - gapX),
    y: clamp(finiteOr(rect.y, gapY), gapY, areaH - h - gapY),
    w,
    h,
  };
}

type OpenOptions = {
  size: { w: number; h: number };
  area: AreaSize;
  origin?: Point;
};

type WindowManager = {
  windows: Win[];
  focusedId: AppId | null;
  nextZ: number;
  open: (id: AppId, opts: OpenOptions) => void;
  close: (id: AppId) => void;
  focus: (id: AppId) => void;
  minimize: (id: AppId) => void;
  restore: (id: AppId) => void;
  toggleMaximize: (id: AppId) => void;
  commitRect: (id: AppId, rect: Partial<WinRect>) => void;
  reconcileArea: (area: AreaSize) => void;
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
    if (!parseAppId(id)) throw new Error(`Unknown Desktop App: ${id}`);
    const { windows, nextZ } = get();
    const existing = windows.find((w) => w.id === id);
    if (existing) {
      set({
        windows: windows.map((w) =>
          w.id === id ? { ...w, minimized: false, z: nextZ } : w,
        ),
        nextZ: nextZ + 1,
        focusedId: id,
      });
      return;
    }
    // Wyśrodkowanie z lekką kaskadą, żeby kolejne okna się nie nakrywały 1:1
    const cascade = (windows.length % 4) * 28;
    const rect = reconcileWindowRect(
      {
        x: (area.w - size.w) / 2 - 42 + cascade,
        y: (area.h - size.h) / 2 - 20 + cascade,
        w: size.w,
        h: size.h,
      },
      area,
    );
    set({
      windows: [
        ...windows,
        {
          id,
          rect,
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
    const next = windows.map((w) =>
      w.id === id ? { ...w, minimized: true } : w,
    );
    set({
      windows: next,
      focusedId: topWindow(next, id)?.id ?? null,
    });
  },

  restore: (id) => {
    const { windows, nextZ } = get();
    set({
      windows: windows.map((w) =>
        w.id === id ? { ...w, minimized: false, z: nextZ } : w,
      ),
      nextZ: nextZ + 1,
      focusedId: id,
    });
  },

  toggleMaximize: (id) => {
    const { windows, nextZ } = get();
    set({
      windows: windows.map((w) =>
        w.id === id
          ? { ...w, maximized: !w.maximized, minimized: false, z: nextZ }
          : w,
      ),
      nextZ: nextZ + 1,
      focusedId: id,
    });
  },

  commitRect: (id, rect) => {
    const { windows } = get();
    set({
      windows: windows.map((w) =>
        w.id === id ? { ...w, rect: { ...w.rect, ...rect } } : w,
      ),
    });
  },

  reconcileArea: (area) => {
    const { windows } = get();
    let changed = false;
    const reconciled = windows.map((win) => {
      const rect = reconcileWindowRect(win.rect, area);
      if (
        rect.x === win.rect.x &&
        rect.y === win.rect.y &&
        rect.w === win.rect.w &&
        rect.h === win.rect.h
      ) {
        return win;
      }
      changed = true;
      return { ...win, rect };
    });
    if (changed) set({ windows: reconciled });
  },

  closeAll: () => set({ windows: [], focusedId: null }),
}));
