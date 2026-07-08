"use client";

import { createContext, useContext } from "react";
import type { Point } from "@/lib/window-store";

export type DesktopApi = {
  /**
   * Otwiera aplikację (lub przywraca/fokusuje istniejące okno).
   * origin = punkt we współrzędnych viewportu, z którego okno "wyrasta"
   * (np. środek ikony w docku). Na mobile otwiera pełnoekranowy sheet.
   */
  openApp: (appId: string, origin?: Point) => void;
  switchToSimple: () => void;
};

const DesktopContext = createContext<DesktopApi | null>(null);

export const DesktopProvider = DesktopContext.Provider;

export function useDesktop(): DesktopApi {
  const api = useContext(DesktopContext);
  if (!api) throw new Error("useDesktop użyty poza DesktopProvider");
  return api;
}
