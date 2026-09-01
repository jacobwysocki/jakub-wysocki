"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BatteryFull, ChevronDown, Wifi } from "lucide-react";
import { site, contactInfo } from "@/data/site";
import { Spotlight } from "@/features/spotlight";
import { ui } from "@/data/ui";
import { useWindowStore } from "@/lib/window-store";
import { useLang, useSetLang, useT } from "@/lib/lang-store";
import { EASE_APPLE } from "@/lib/motion";
import { useDesktop } from "./DesktopContext";
import { getApp } from "./registry";
import { formatMenuBarClock, useClock } from "./useClock";
import { DESKTOP_LAYOUT } from "./desktop-layout";

function LogoMenu({
  onClose,
  onAction,
}: {
  onClose: () => void;
  onAction: () => void;
}) {
  const { openApp, openLocation, switchToSimple } = useDesktop();
  const t = useT();
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    ref.current?.querySelector("button")?.focus();
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const item =
    "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-ink transition-colors hover:bg-accent hover:text-white focus-visible:bg-accent focus-visible:text-white";

  const run = (fn: () => void) => () => {
    onAction();
    fn();
  };

  return (
    <>
      <div
        className="fixed inset-0 cursor-default"
        onClick={onClose}
        aria-hidden
      />
      <motion.div
        ref={ref}
        role="menu"
        aria-label={t(ui.desktop.mainMenu)}
        onKeyDown={(event) => {
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            return;
          }
          const items = Array.from(
            ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ??
              [],
          );
          if (items.length === 0) return;
          event.preventDefault();
          event.stopPropagation();
          const currentIndex = items.indexOf(
            document.activeElement as HTMLElement,
          );
          const nextIndex =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? items.length - 1
                : event.key === "ArrowUp"
                  ? (currentIndex - 1 + items.length) % items.length
                  : (currentIndex + 1) % items.length;
          items[nextIndex].focus({ preventScroll: true });
        }}
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [...EASE_APPLE] }}
        className="absolute left-0 top-[46px] w-72 origin-top-left rounded-[20px] border border-white/40 bg-[#f5f5f7]/90 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
      >
        <button
          type="button"
          role="menuitem"
          className={item}
          onClick={run(() => openApp("info"))}
        >
          {t(ui.desktop.aboutPortfolio)}
        </button>
        <button
          type="button"
          role="menuitem"
          className={item}
          onClick={run(() =>
            openLocation({ area: "project", projectId: "ultra-studio" }),
          )}
        >
          {site.studio}
        </button>
        <div aria-hidden className="mx-2 my-1.5 h-px bg-black/10" />
        {/* Realne kanały kontaktu — jak menu systemowe z linkami */}
        <a
          role="menuitem"
          className={item}
          href={`mailto:${contactInfo.email}`}
          onClick={onAction}
        >
          {t(ui.actions.writeToMe)}
          <span className="text-[11px] text-muted">{contactInfo.email}</span>
        </a>
        <a
          role="menuitem"
          className={item}
          href={contactInfo.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onAction}
        >
          LinkedIn
        </a>
        <a
          role="menuitem"
          className={item}
          href={contactInfo.github}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onAction}
        >
          GitHub
        </a>
        <a
          role="menuitem"
          className={item}
          href={contactInfo.behance}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onAction}
        >
          Behance
        </a>
        <a
          role="menuitem"
          className={item}
          href={contactInfo.stackoverflow}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onAction}
        >
          Stack Overflow
        </a>
        <div aria-hidden className="mx-2 my-1.5 h-px bg-black/10" />
        <button
          type="button"
          role="menuitem"
          className={item}
          onClick={run(switchToSimple)}
        >
          {t(ui.mode.switchToSimple)}
        </button>
      </motion.div>
    </>
  );
}

/** Przełącznik PL/EN w pasku menu */
function MenuLangSwitch() {
  const lang = useLang();
  const setLang = useSetLang();
  return (
    <button
      type="button"
      aria-label="Język / Language"
      onClick={() => setLang(lang === "pl" ? "en" : "pl")}
      className="rounded px-1.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wide transition-colors hover:bg-white/15"
    >
      {lang}
    </button>
  );
}

/** Górny pasek menu: logo z menu, nazwa aktywnej aplikacji, status + zegar. */
export default function MenuBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const now = useClock();
  const t = useT();
  const lang = useLang();
  const activeApp = useWindowStore((s) =>
    s.focusedId ? getApp(s.focusedId) : null,
  );
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => {
      triggerRef.current?.focus({ preventScroll: true });
    });
  }, []);
  const prepareMenuAction = useCallback(() => {
    setMenuOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <header
      style={{
        height: DESKTOP_LAYOUT.menuBar.height,
        left: DESKTOP_LAYOUT.edgeInset,
        right: DESKTOP_LAYOUT.edgeInset,
        top: DESKTOP_LAYOUT.menuBar.top,
      }}
      className="absolute z-[80] flex items-center justify-between rounded-2xl border border-white/20 bg-black/25 px-2.5 text-[13px] text-white shadow-[0_14px_45px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
    >
      <div className="flex items-center gap-1">
        <div className="relative">
          {/* Nazwa + chevron zamiast samego monogramu — wyraźna zachęta do kliknięcia */}
          <button
            ref={triggerRef}
            data-window-return="true"
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={t(ui.desktop.mainMenu)}
            onClick={() => setMenuOpen((open) => !open)}
            className={`flex h-8 items-center gap-2 rounded-xl px-2.5 text-[12px] font-bold tracking-[0.04em] transition-colors ${
              menuOpen ? "bg-white/25" : "hover:bg-white/15"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent-bright shadow-[0_0_10px_rgba(255,106,61,0.9)]" />
            JW / OS
            <ChevronDown
              size={12}
              strokeWidth={2.5}
              aria-hidden
              className={`opacity-70 transition-transform ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <LogoMenu onClose={closeMenu} onAction={prepareMenuAction} />
            )}
          </AnimatePresence>
        </div>
        <span className="max-w-52 truncate rounded-lg border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[12px] font-semibold text-white/80">
          {activeApp ? t(activeApp.title) : t(ui.desktop.desktop)}
        </span>
      </div>

      <div className="flex items-center gap-2.5 pr-1">
        <MenuLangSwitch />
        <Wifi
          size={15}
          strokeWidth={1.8}
          aria-hidden
          className="hidden opacity-80 lg:block"
        />
        <Spotlight variant="desktop" />
        <BatteryFull
          size={19}
          strokeWidth={1.6}
          aria-hidden
          className="hidden opacity-80 lg:block"
        />
        <time
          dateTime={now.toISOString()}
          className="rounded-lg bg-white/[0.08] px-2 py-1 text-[11.5px] font-medium tabular-nums opacity-95"
        >
          {formatMenuBarClock(now, lang)}
        </time>
      </div>
    </header>
  );
}
