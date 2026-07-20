"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useModeStore } from "@/lib/mode-store";
import { useWindowStore, type Point } from "@/lib/window-store";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { DesktopProvider, type DesktopApi } from "./DesktopContext";
import { getApp } from "./registry";
import {
  getWallpaperStyle,
  loadWallpaperId,
  saveWallpaperId,
} from "./wallpapers";
import MenuBar from "./MenuBar";
import Dock from "./Dock";
import DesktopIcons from "./DesktopIcons";
import WindowFrame from "./Window";
import BootScreen from "./BootScreen";
import ContextMenu from "./ContextMenu";
import MobileDesktop from "./MobileDesktop";
import NowWidget from "./NowWidget";

function DesktopFull({
  wallpaperId,
  onSelectWallpaper,
}: {
  wallpaperId: string;
  onSelectWallpaper: (id: string) => void;
}) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const windows = useWindowStore((s) => s.windows);
  const open = useWindowStore((s) => s.open);
  const setMode = useModeStore((s) => s.setMode);
  const [ctxMenu, setCtxMenu] = useState<Point | null>(null);

  const openApp = useCallback(
    (id: string, origin?: Point) => {
      const area = areaRef.current;
      if (!area) return;
      const bounds = area.getBoundingClientRect();
      const app = getApp(id);
      open(id, {
        size: app.size,
        area: { w: bounds.width, h: bounds.height },
        origin: origin
          ? { x: origin.x - bounds.left, y: origin.y - bounds.top }
          : undefined,
      });
    },
    [open]
  );

  const api = useMemo<DesktopApi>(
    () => ({ openApp, switchToSimple: () => setMode("simple") }),
    [openApp, setMode]
  );

  // Esc: najpierw zamyka menu kontekstowe, potem aktywne okno
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (ctxMenu) {
        setCtxMenu(null);
        return;
      }
      const { focusedId, close } = useWindowStore.getState();
      if (focusedId) close(focusedId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ctxMenu]);

  return (
    <DesktopProvider value={api}>
      <div
        className="fixed inset-0 select-none overflow-hidden"
        style={getWallpaperStyle(wallpaperId)}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(255,106,61,0.10),transparent_30%),linear-gradient(to_bottom,rgba(0,0,0,0.04),rgba(0,0,0,0.16))]"
        />
        <MenuBar />

        {/* Obszar roboczy: poniżej paska menu, powyżej docka */}
        <div ref={areaRef} className="absolute inset-x-0 bottom-[104px] top-[68px]">
          {/* Tapeta jako warstwa zdarzeń: prawy klik = menu, ikony pulpitu */}
          <div
            className="absolute inset-0"
            onContextMenu={(e) => {
              e.preventDefault();
              setCtxMenu({ x: e.clientX, y: e.clientY });
            }}
          >
            <DesktopIcons areaRef={areaRef} />
            <NowWidget areaRef={areaRef} />
          </div>

          <AnimatePresence>
            {windows.map((win) => (
              <WindowFrame key={win.id} win={win} areaRef={areaRef} />
            ))}
          </AnimatePresence>
        </div>

        <Dock />

        {ctxMenu && (
          <ContextMenu
            point={ctxMenu}
            wallpaperId={wallpaperId}
            onSelectWallpaper={onSelectWallpaper}
            onClose={() => setCtxMenu(null)}
          />
        )}

        <BootScreen />
      </div>
    </DesktopProvider>
  );
}

/**
 * Korpus trybu pulpitu. Na małych ekranach / dotyku renderuje wariant
 * z pełnoekranowymi sheetami zamiast przeciąganych okien.
 */
export default function Desktop() {
  const isSmall = useMediaQuery("(max-width: 767px)");
  const [wallpaperId, setWallpaperId] = useState(loadWallpaperId);

  const selectWallpaper = useCallback((id: string) => {
    setWallpaperId(id);
    saveWallpaperId(id);
  }, []);

  if (isSmall) {
    return <MobileDesktop wallpaperId={wallpaperId} />;
  }
  return (
    <DesktopFull wallpaperId={wallpaperId} onSelectWallpaper={selectWallpaper} />
  );
}
