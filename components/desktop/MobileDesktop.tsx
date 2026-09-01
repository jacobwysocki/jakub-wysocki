"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
} from "framer-motion";
import { AppWindowMac, ChevronLeft, X } from "lucide-react";
import {
  PortfolioNavigator,
  type AppId,
  type AppLaunchPayload,
  type PortfolioNavigator as PortfolioNavigatorPort,
} from "@/features/portfolio-navigation";
import { Spotlight } from "@/features/spotlight";
import { useModeStore } from "@/lib/mode-store";
import { useLang, useT } from "@/lib/lang-store";
import { EASE_APPLE } from "@/lib/motion";
import { site } from "@/data/site";
import { ui } from "@/data/ui";
import { DesktopProvider, type DesktopApi } from "./DesktopContext";
import { AppTile, getApp, getAppsFor } from "./registry";
import { useClock } from "./useClock";
import { getWallpaperStyle } from "./wallpapers";
import LangSwitch from "@/components/LangSwitch";

/**
 * Dotykowy „Pocket OS”: pulpit zachowuje metaforę aplikacji, ale korzysta
 * z mobilnych wzorców — statusowej kapsuły, docka i przesuwanych sheetów.
 */
export default function MobileDesktop({
  wallpaperId,
  onNavigatorReady,
}: {
  wallpaperId: string;
  onNavigatorReady?: (navigator: PortfolioNavigatorPort) => void;
}) {
  const setMode = useModeStore((s) => s.setMode);
  const reduced = useReducedMotion();
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const t = useT();
  const lang = useLang();
  const now = useClock();
  const [stack, setStack] = useState<AppLaunchPayload[]>([]);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  const launchApp = useCallback((payload: AppLaunchPayload) => {
    setStack((current) => {
      if (current.length === 0) {
        const active = document.activeElement;
        if (
          active instanceof HTMLElement &&
          (active.dataset.appLauncher === payload.appId ||
            active.dataset.windowReturn === "true")
        ) {
          returnFocusRef.current = active;
        }
      }
      const currentTop = current[current.length - 1];
      if (currentTop?.appId !== payload.appId) return [...current, payload];
      if (!payload.selection) return current;
      return [...current.slice(0, -1), payload];
    });
  }, []);

  const restoreRootFocus = useCallback(() => {
    window.requestAnimationFrame(() => {
      const launcher = returnFocusRef.current;
      if (launcher?.isConnected) launcher.focus({ preventScroll: true });
    });
  }, []);

  const closeAllApps = useCallback(() => {
    setStack([]);
    restoreRootFocus();
  }, [restoreRootFocus]);

  const closeTopApp = useCallback(() => {
    setStack((current) => {
      const next = current.slice(0, -1);
      if (next.length === 0) restoreRootFocus();
      return next;
    });
  }, [restoreRootFocus]);

  const navigator = useMemo(
    () => PortfolioNavigator.desktop(launchApp),
    [launchApp],
  );

  useEffect(() => {
    onNavigatorReady?.(navigator);
  }, [navigator, onNavigatorReady]);

  const openLocation = useCallback<DesktopApi["openLocation"]>(
    (location) => navigator.open(location),
    [navigator],
  );

  const selectionFor = useCallback(
    (appId: AppId) => {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index].appId === appId) return stack[index].selection;
      }
      return undefined;
    },
    [stack],
  );

  const api = useMemo<DesktopApi>(
    () => ({
      openApp: (appId) => launchApp({ appId }),
      openLocation,
      selectionFor,
      switchToSimple: () => setMode("simple"),
    }),
    [launchApp, openLocation, selectionFor, setMode],
  );

  const desktopApps = getAppsFor("mobileGrid");
  const dockApps = getAppsFor("mobileDock");
  const topLaunch = stack[stack.length - 1] ?? null;
  const topId = topLaunch?.appId ?? null;
  const topApp = topId ? getApp(topId) : null;
  const backgroundIsolated = Boolean(topApp) || spotlightOpen;
  const time = now.toLocaleTimeString(lang === "pl" ? "pl-PL" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  useEffect(() => {
    if (!topId) return;

    const focusFrame = window.requestAnimationFrame(() => {
      sheetRef.current?.focus({ preventScroll: true });
    });
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeTopApp();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;

      const focusable = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
        ),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === sheetRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeys, true);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeys, true);
    };
  }, [closeTopApp, topId]);

  return (
    <DesktopProvider value={api}>
      <div
        className="fixed inset-0 select-none overflow-hidden"
        style={getWallpaperStyle(wallpaperId)}
      >
        <div
          data-mobile-desktop-background
          aria-hidden={backgroundIsolated ? true : undefined}
          inert={backgroundIsolated ? true : undefined}
          className="contents"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_12%,rgba(255,106,61,0.16),transparent_34%),linear-gradient(to_bottom,rgba(0,0,0,0.08),rgba(0,0,0,0.28))]"
          />

          <header className="absolute inset-x-3 top-[max(env(safe-area-inset-top),0.75rem)] z-30">
            <div className="mx-auto flex h-11 max-w-xl items-center justify-between rounded-2xl border border-white/20 bg-black/25 px-2.5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
              <div className="flex items-center gap-2 pl-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-bright shadow-[0_0_12px_rgba(255,106,61,0.9)]" />
                <span className="text-[11px] font-bold tracking-[0.12em]">
                  JW / OS
                </span>
              </div>

              <time
                dateTime={now.toISOString()}
                className="text-[12px] font-semibold tabular-nums text-white/85"
              >
                {time}
              </time>

              <div className="flex items-center gap-1.5">
                <Spotlight
                  variant="mobile"
                  disabled={Boolean(topApp)}
                  onOpenChange={setSpotlightOpen}
                />
                <LangSwitch tone="dark" className="scale-90" />
                <button
                  type="button"
                  onClick={() => setMode("simple")}
                  aria-label={t(ui.mode.switchToSimple)}
                  title={t(ui.mode.switchToSimple)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/10 transition-colors hover:bg-white/20"
                >
                  <AppWindowMac size={15} strokeWidth={1.8} aria-hidden />
                </button>
              </div>
            </div>
          </header>

          <main
            data-lenis-prevent
            className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] top-[calc(max(env(safe-area-inset-top),0.75rem)+3.75rem)] overflow-y-auto overscroll-contain px-4 pb-5 pt-3"
          >
            <div className="mx-auto max-w-xl">
              <motion.section
                initial={
                  reduced ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: reduced ? 0.15 : 0.65,
                  ease: [...EASE_APPLE],
                }}
                className="relative overflow-hidden rounded-[28px] border border-white/20 bg-black/25 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
              >
                <div
                  aria-hidden
                  className="absolute -right-12 -top-14 h-40 w-40 rounded-full bg-accent-bright/20 blur-2xl"
                />
                <div className="relative flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-white/45">
                      Portfolio / Pocket OS
                    </p>
                    <h1 className="mt-2 text-[22px] font-semibold tracking-[-0.03em]">
                      {site.name}
                    </h1>
                    <p className="mt-1 text-[12px] text-white/55">
                      {lang === "pl"
                        ? `${desktopApps.length} aplikacji · dotknij, aby otworzyć`
                        : `${desktopApps.length} apps · tap to open`}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-white/20 bg-white/10 shadow-inner">
                    <AppWindowMac size={25} strokeWidth={1.5} aria-hidden />
                  </div>
                </div>
              </motion.section>

              <section aria-label={t(ui.desktop.desktop)} className="mt-7">
                <div className="mb-4 flex items-center gap-3 px-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  <span>{t(ui.desktop.desktop)}</span>
                  <span className="h-px flex-1 bg-white/15" />
                </div>
                <div className="grid grid-cols-4 gap-x-2 gap-y-6">
                  {desktopApps.map((app, index) => (
                    <motion.button
                      key={app.id}
                      type="button"
                      data-app-launcher={app.id}
                      onClick={(event) => {
                        returnFocusRef.current = event.currentTarget;
                        launchApp({ appId: app.id });
                      }}
                      aria-label={`${t(ui.desktop.openApp)}: ${t(app.title)}`}
                      className="group flex min-w-0 flex-col items-center gap-2 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
                      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduced ? 0.15 : 0.55,
                        delay: reduced ? 0 : 0.12 + index * 0.045,
                        ease: [...EASE_APPLE],
                      }}
                      whileTap={reduced ? undefined : { scale: 0.9 }}
                    >
                      <AppTile
                        appId={app.id}
                        className="h-14 w-14 shadow-[0_10px_26px_rgba(0,0,0,0.32)] transition-transform duration-300 group-focus-visible:-translate-y-1"
                      />
                      {/* Jak na pulpicie: bez dzielenia wyrazów clamp ucinał
                          w poziomie pojedyncze długie słowo („Doświadczenie"). */}
                      <span className="line-clamp-2 max-w-full break-words text-center text-[10.5px] font-medium leading-[1.15] text-white [hyphens:auto] [text-shadow:0_1px_4px_rgba(0,0,0,0.65)]">
                        {t(app.title)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </section>
            </div>
          </main>

          <nav
            aria-label="Dock"
            className="absolute inset-x-0 bottom-0 z-30 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
          >
            <motion.div
              initial={
                reduced ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.96 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: reduced ? 0.15 : 0.65,
                delay: 0.22,
                ease: [...EASE_APPLE],
              }}
              className="mx-auto flex h-[66px] max-w-sm items-center justify-center gap-1.5 rounded-[25px] border border-white/25 bg-white/20 px-2 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-2xl sm:h-[70px] sm:gap-2 sm:px-3"
            >
              {dockApps.map((app) => (
                <motion.button
                  key={app.id}
                  type="button"
                  data-app-launcher={app.id}
                  onClick={(event) => {
                    returnFocusRef.current = event.currentTarget;
                    launchApp({ appId: app.id });
                  }}
                  aria-label={`${t(ui.desktop.openApp)}: ${t(app.title)}`}
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30 sm:h-12 sm:w-12"
                  whileTap={reduced ? undefined : { scale: 0.84 }}
                >
                  <AppTile
                    appId={app.id}
                    className="h-10 w-10 shadow-[0_7px_18px_rgba(0,0,0,0.3)] sm:h-11 sm:w-11"
                  />
                  {topId === app.id && (
                    <motion.span
                      layoutId="mobile-dock-active"
                      aria-hidden
                      className="absolute -bottom-1 h-1 w-1 rounded-full bg-white"
                    />
                  )}
                </motion.button>
              ))}
              <span aria-hidden className="mx-0.5 h-9 w-px bg-white/20" />
              <motion.button
                type="button"
                onClick={() => setMode("simple")}
                aria-label={t(ui.mode.switchToSimple)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-white/30 bg-[#f5f5f7]/90 text-ink shadow-[0_7px_18px_rgba(0,0,0,0.22)] sm:h-11 sm:w-11"
                whileTap={reduced ? undefined : { scale: 0.84 }}
              >
                <AppWindowMac size={21} strokeWidth={1.6} aria-hidden />
              </motion.button>
            </motion.div>
          </nav>
        </div>

        <AnimatePresence>
          {topApp && (
            <motion.div
              key="mobile-app-backdrop"
              className="absolute inset-0 z-40 bg-black/30 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0.1 : 0.3 }}
              onClick={closeAllApps}
            >
              <motion.section
                ref={sheetRef}
                key={topApp.id}
                role="dialog"
                aria-modal="true"
                aria-label={t(topApp.title)}
                tabIndex={-1}
                drag={reduced ? false : "y"}
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.35 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 110 || info.velocity.y > 750)
                    closeAllApps();
                }}
                initial={reduced ? { opacity: 0 } : { y: "105%", scale: 0.98 }}
                animate={reduced ? { opacity: 1 } : { y: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { y: "105%", scale: 0.98 }}
                transition={{
                  duration: reduced ? 0.15 : 0.48,
                  ease: [...EASE_APPLE],
                }}
                style={{
                  top: "calc(max(env(safe-area-inset-top), 0.75rem) + 3.25rem)",
                }}
                className="absolute inset-x-2 bottom-2 mx-auto flex max-w-[680px] flex-col overflow-hidden rounded-[28px] border border-white/55 bg-[#f5f5f7] shadow-[0_30px_100px_rgba(0,0,0,0.42)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="flex h-5 shrink-0 touch-none cursor-grab items-center justify-center active:cursor-grabbing"
                  onPointerDown={(event) => dragControls.start(event)}
                  aria-hidden
                >
                  <span className="h-1 w-9 rounded-full bg-black/15" />
                </div>

                <header className="flex h-11 shrink-0 items-center justify-between border-b border-line/60 px-2.5">
                  {stack.length > 1 ? (
                    <button
                      type="button"
                      aria-label={t(ui.actions.back)}
                      onClick={() =>
                        setStack((current) => current.slice(0, -1))
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-accent transition-colors hover:bg-black/10"
                    >
                      <ChevronLeft size={20} aria-hidden />
                    </button>
                  ) : (
                    <span className="w-8" aria-hidden />
                  )}
                  <div className="flex min-w-0 items-center gap-2">
                    <AppTile appId={topApp.id} className="h-6 w-6 shadow-sm" />
                    <span className="truncate text-[14px] font-semibold text-ink">
                      {t(topApp.title)}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={t(ui.actions.close)}
                    onClick={closeAllApps}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-muted transition-colors hover:bg-black/10 hover:text-ink"
                  >
                    <X size={17} aria-hidden />
                  </button>
                </header>

                <div
                  data-lenis-prevent
                  className={`min-h-0 flex-1 ${
                    topApp.scroll
                      ? "overflow-y-auto overscroll-contain"
                      : "overflow-hidden"
                  }`}
                >
                  <topApp.Content />
                </div>
              </motion.section>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DesktopProvider>
  );
}
