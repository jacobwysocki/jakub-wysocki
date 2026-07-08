"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AppWindowMac, ChevronLeft, X } from "lucide-react";
import { useModeStore } from "@/lib/mode-store";
import { useLang, useT } from "@/lib/lang-store";
import { EASE_APPLE } from "@/lib/motion";
import { site } from "@/data/site";
import { ui } from "@/data/ui";
import { DesktopProvider, type DesktopApi } from "./DesktopContext";
import { APPS, AppTile, getApp } from "./registry";
import { formatMenuBarClock, useClock } from "./useClock";
import { getWallpaperStyle } from "./wallpapers";
import LangSwitch from "@/components/LangSwitch";

/**
 * Uproszczony pulpit na dotyk / małe ekrany: siatka ikon otwierających
 * pełnoekranowe sheety zamiast przeciąganych okien, plus wyraźne
 * przejście do prostego widoku.
 */
export default function MobileDesktop({ wallpaperId }: { wallpaperId: string }) {
  const setMode = useModeStore((s) => s.setMode);
  const reduced = useReducedMotion();
  const t = useT();
  const lang = useLang();
  const now = useClock();
  // Stos otwartych sheetów aplikacji
  const [stack, setStack] = useState<string[]>([]);

  const api = useMemo<DesktopApi>(
    () => ({
      openApp: (id) => setStack((s) => (s[s.length - 1] === id ? s : [...s, id])),
      switchToSimple: () => setMode("simple"),
    }),
    [setMode]
  );

  const topId = stack[stack.length - 1] ?? null;
  const topApp = topId ? getApp(topId) : null;
  const initials = site.name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("");

  return (
    <DesktopProvider value={api}>
      <div className="fixed inset-0 overflow-hidden" style={getWallpaperStyle(wallpaperId)}>
        <header className="flex h-8 items-center justify-between bg-black/25 px-4 text-[13px] text-white backdrop-blur-2xl">
          <span className="font-bold tracking-tight">{initials}</span>
          <div className="flex items-center gap-3">
            <LangSwitch tone="dark" />
            <time dateTime={now.toISOString()} className="font-medium tabular-nums">
              {formatMenuBarClock(now, lang)}
            </time>
          </div>
        </header>

        <div className="grid grid-cols-4 gap-x-1 gap-y-6 px-4 pt-10">
          {APPS.filter((app) => app.desktopIcon).map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => api.openApp(app.id)}
              aria-label={`${t(ui.desktop.openApp)}: ${t(app.title)}`}
              className="flex flex-col items-center gap-1.5"
            >
              <AppTile
                appId={app.id}
                className="h-14 w-14 shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
              />
              <span className="line-clamp-2 max-w-full text-center text-[11px] font-medium leading-[1.15] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
                {t(app.title)}
              </span>
            </button>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-0 px-6 pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <button
            type="button"
            onClick={() => setMode("simple")}
            className="mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/20 py-3 text-[14px] font-semibold text-white shadow-[0_12px_36px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
          >
            <AppWindowMac size={17} strokeWidth={1.8} aria-hidden />
            {t(ui.mode.switchToSimple)}
          </button>
        </div>

        <AnimatePresence>
          {topApp && (
            <motion.div
              key={topApp.id}
              role="dialog"
              aria-label={t(topApp.title)}
              initial={reduced ? { opacity: 0 } : { y: "100%" }}
              animate={reduced ? { opacity: 1 } : { y: 0 }}
              exit={reduced ? { opacity: 0 } : { y: "100%" }}
              transition={{ duration: reduced ? 0.15 : 0.45, ease: [...EASE_APPLE] }}
              className="absolute inset-0 z-50 flex flex-col bg-[#f5f5f7]"
            >
              <header className="flex h-12 shrink-0 items-center justify-between border-b border-line/60 px-2">
                {stack.length > 1 ? (
                  <button
                    type="button"
                    aria-label={t(ui.actions.back)}
                    onClick={() => setStack((s) => s.slice(0, -1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-accent"
                  >
                    <ChevronLeft size={22} aria-hidden />
                  </button>
                ) : (
                  <span className="w-9" aria-hidden />
                )}
                <span className="text-[15px] font-semibold text-ink">
                  {t(topApp.title)}
                </span>
                <button
                  type="button"
                  aria-label={t(ui.actions.close)}
                  onClick={() => setStack([])}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted"
                >
                  <X size={19} aria-hidden />
                </button>
              </header>
              <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain">
                <topApp.Content />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DesktopProvider>
  );
}
