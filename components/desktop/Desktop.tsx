"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AskJakubProvider } from "@/features/ask-jakub";
import {
  PortfolioNavigator,
  type AppId,
  type AppLaunchPayload,
  type PortfolioNavigator as PortfolioNavigatorPort,
} from "@/features/portfolio-navigation";
import {
  reduceLaunchSelections,
  type AppLaunchSelections,
} from "@/features/portfolio-navigation/launch-selection";
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
import AskJakubWidget from "./AskJakubWidget";
import { DESKTOP_WORK_AREA } from "./desktop-layout";

function DesktopFull({
  wallpaperId,
  onSelectWallpaper,
  onNavigatorReady,
}: {
  wallpaperId: string;
  onSelectWallpaper: (id: string) => void;
  onNavigatorReady: (navigator: PortfolioNavigatorPort) => void;
}) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const windows = useWindowStore((s) => s.windows);
  const open = useWindowStore((s) => s.open);
  const setMode = useModeStore((s) => s.setMode);
  const [ctxMenu, setCtxMenu] = useState<Point | null>(null);
  const [selections, setSelections] = useState<AppLaunchSelections>(
    () => new Map(),
  );
  const askJakubWindowVisible = windows.some(
    (win) => win.id === "ask-jakub" && !win.minimized,
  );

  const launchApp = useCallback(
    (payload: AppLaunchPayload, origin?: Point) => {
      const area = areaRef.current;
      if (!area) return;
      const bounds = area.getBoundingClientRect();
      const app = getApp(payload.appId);
      const appAlreadyOpen = useWindowStore
        .getState()
        .windows.some((win) => win.id === payload.appId);
      setSelections((current) =>
        reduceLaunchSelections(current, payload, appAlreadyOpen),
      );
      open(payload.appId, {
        size: app.size,
        area: { w: bounds.width, h: bounds.height },
        origin: origin
          ? { x: origin.x - bounds.left, y: origin.y - bounds.top }
          : undefined,
      });
    },
    [open],
  );

  const focusWindow = useCallback((appId: AppId) => {
    const area = areaRef.current;
    if (!area) return;
    window.requestAnimationFrame(() => {
      const destination = Array.from(
        area.querySelectorAll<HTMLElement>("[data-window-id]"),
      ).find((element) => element.dataset.windowId === appId);
      destination?.focus({ preventScroll: true });
    });
  }, []);

  const openApp = useCallback(
    (appId: AppId, origin?: Point) => launchApp({ appId }, origin),
    [launchApp],
  );
  useEffect(() => {
    onNavigatorReady(
      PortfolioNavigator.desktop((payload) => launchApp(payload)),
    );
  }, [launchApp, onNavigatorReady]);

  const openLocation = useCallback<DesktopApi["openLocation"]>(
    (location) => {
      const outcome = PortfolioNavigator.desktop((payload) =>
        launchApp(payload),
      ).open(location);
      if (outcome.opened) focusWindow(outcome.target.launch.appId);
      return outcome;
    },
    [focusWindow, launchApp],
  );

  const selectionFor = useCallback(
    (appId: AppId) =>
      windows.some((win) => win.id === appId)
        ? selections.get(appId)
        : undefined,
    [selections, windows],
  );

  const api = useMemo<DesktopApi>(
    () => ({
      openApp,
      openLocation,
      selectionFor,
      switchToSimple: () => setMode("simple"),
    }),
    [openApp, openLocation, selectionFor, setMode],
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
        <div
          ref={areaRef}
          style={{
            bottom: DESKTOP_WORK_AREA.bottom,
            top: DESKTOP_WORK_AREA.top,
          }}
          className="absolute inset-x-0"
        >
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
            <AskJakubWidget areaRef={areaRef} hidden={askJakubWindowVisible} />
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
  const activeNavigatorRef = useRef<PortfolioNavigatorPort | null>(null);
  const [sessionNavigator] = useState<PortfolioNavigatorPort>(() => ({
    open(location) {
      const activeNavigator = activeNavigatorRef.current;
      return activeNavigator
        ? activeNavigator.open(location)
        : { opened: false, reason: "invalid-location" };
    },
  }));

  const registerNavigator = useCallback((navigator: PortfolioNavigatorPort) => {
    activeNavigatorRef.current = navigator;
  }, []);

  const selectWallpaper = useCallback((id: string) => {
    setWallpaperId(id);
    saveWallpaperId(id);
  }, []);

  return (
    <AskJakubProvider navigator={sessionNavigator}>
      {isSmall ? (
        <MobileDesktop
          wallpaperId={wallpaperId}
          onNavigatorReady={registerNavigator}
        />
      ) : (
        <DesktopFull
          wallpaperId={wallpaperId}
          onSelectWallpaper={selectWallpaper}
          onNavigatorReady={registerNavigator}
        />
      )}
    </AskJakubProvider>
  );
}
