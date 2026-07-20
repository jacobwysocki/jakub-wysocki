"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BatteryFull, ChevronDown, Search, Wifi } from "lucide-react";
import { site, contactInfo } from "@/data/site";
import { ui } from "@/data/ui";
import { useWindowStore } from "@/lib/window-store";
import { useLang, useLangStore, useT } from "@/lib/lang-store";
import { EASE_APPLE } from "@/lib/motion";
import { useDesktop } from "./DesktopContext";
import { getApp } from "./registry";
import { formatMenuBarClock, useClock } from "./useClock";

function LogoMenu({ onClose }: { onClose: () => void }) {
  const { openApp, switchToSimple } = useDesktop();
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
    onClose();
    fn();
  };

  return (
    <>
      <div className="fixed inset-0 cursor-default" onClick={onClose} aria-hidden />
      <motion.div
        ref={ref}
        role="menu"
        aria-label={t(ui.desktop.mainMenu)}
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.98 }}
        transition={{ duration: 0.18, ease: [...EASE_APPLE] }}
        className="absolute left-0 top-[46px] w-72 origin-top-left rounded-[20px] border border-white/40 bg-[#f5f5f7]/90 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
      >
        <button type="button" role="menuitem" className={item} onClick={run(() => openApp("info"))}>
          {t(ui.desktop.aboutPortfolio)}
        </button>
        <button type="button" role="menuitem" className={item} onClick={run(() => openApp("studio"))}>
          {site.studio}
        </button>
        <div aria-hidden className="mx-2 my-1.5 h-px bg-black/10" />
        {/* Realne kanały kontaktu — jak menu systemowe z linkami */}
        <a role="menuitem" className={item} href={`mailto:${contactInfo.email}`} onClick={onClose}>
          {t(ui.actions.writeToMe)}
          <span className="text-[11px] text-muted">{contactInfo.email}</span>
        </a>
        <a
          role="menuitem"
          className={item}
          href={contactInfo.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
        >
          LinkedIn
        </a>
        <a
          role="menuitem"
          className={item}
          href={contactInfo.github}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
        >
          GitHub
        </a>
        <div aria-hidden className="mx-2 my-1.5 h-px bg-black/10" />
        <button type="button" role="menuitem" className={item} onClick={run(switchToSimple)}>
          {t(ui.mode.switchToSimple)}
        </button>
      </motion.div>
    </>
  );
}

/** Przełącznik PL/EN w pasku menu */
function MenuLangSwitch() {
  const lang = useLang();
  const setLang = useLangStore((s) => s.setLang);
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
  const now = useClock();
  const t = useT();
  const lang = useLang();
  const activeApp = useWindowStore((s) =>
    s.focusedId ? getApp(s.focusedId) : null
  );

  return (
    <header className="absolute inset-x-4 top-3 z-[80] flex h-11 items-center justify-between rounded-2xl border border-white/20 bg-black/25 px-2.5 text-[13px] text-white shadow-[0_14px_45px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
      <div className="flex items-center gap-1">
        <div className="relative">
          {/* Nazwa + chevron zamiast samego monogramu — wyraźna zachęta do kliknięcia */}
          <button
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
            {menuOpen && <LogoMenu onClose={() => setMenuOpen(false)} />}
          </AnimatePresence>
        </div>
        <span className="max-w-52 truncate rounded-lg border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[12px] font-semibold text-white/80">
          {activeApp ? t(activeApp.title) : t(ui.desktop.desktop)}
        </span>
      </div>

      <div className="flex items-center gap-2.5 pr-1">
        <MenuLangSwitch />
        <Wifi size={15} strokeWidth={1.8} aria-hidden className="hidden opacity-80 lg:block" />
        <Search size={13.5} strokeWidth={2} aria-hidden className="hidden opacity-80 lg:block" />
        <BatteryFull size={19} strokeWidth={1.6} aria-hidden className="hidden opacity-80 lg:block" />
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
