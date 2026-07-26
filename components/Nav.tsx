"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppWindowMac } from "lucide-react";
import { navLinks } from "@/data/links";
import { site } from "@/data/site";
import { ui } from "@/data/ui";
import { useLenis } from "@/components/SmoothScrollProvider";
import LangSwitch from "@/components/LangSwitch";
import StableText from "@/components/StableText";
import { useModeStore } from "@/lib/mode-store";
import { useT } from "@/lib/lang-store";
import { EASE_APPLE } from "@/lib/motion";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const lenis = useLenis();
  const setMode = useModeStore((s) => s.setMode);
  const t = useT();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const closeAtDesktopWidth = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeAtDesktopWidth);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeAtDesktopWidth);
    };
  }, [menuOpen]);

  const handleAnchor = (e: React.MouseEvent, href: string) => {
    setMenuOpen(false);
    // Lenis przejmuje kotwice, żeby scroll był płynny; bez Lenisa
    // (reduced motion) działa natywna nawigacja po hash.
    if (!lenis) return;
    e.preventDefault();
    lenis.scrollTo(href, { offset: -72 });
  };

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      initial={{ y: -48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [...EASE_APPLE], delay: 0.2 }}
    >
      <div
        className={`relative transition-all duration-500 ease-apple ${
          scrolled
            ? "border-b border-line/60 bg-surface/90 supports-[backdrop-filter]:md:bg-surface/70 supports-[backdrop-filter]:md:backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <nav
          aria-label="Nawigacja główna"
          className="mx-auto flex h-16 max-w-content items-center justify-between gap-3 px-4 sm:px-6"
        >
          <a
            href="#top"
            onClick={(e) => handleAnchor(e, "#top")}
            className={`shrink-0 text-[15px] font-semibold tracking-tight transition-colors duration-500 ${
              scrolled ? "text-ink" : "text-white"
            }`}
          >
            {site.name}
          </a>

          <div className="flex items-center gap-4 sm:gap-6">
            <ul className={`hidden lg:flex items-center rounded-full border p-1 transition-colors duration-500 ${
              scrolled ? "border-line/60 bg-surface/50" : "border-white/20 bg-white/5"
            }`}>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={(e) => handleAnchor(e, link.href)}
                    className={`block w-28 rounded-full py-1.5 text-center text-[13px] font-medium transition-colors duration-300 ${
                      scrolled
                        ? "text-ink/80 hover:bg-black/5 hover:text-ink"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <StableText l10n={link.label} className="mx-auto block" />
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3 sm:gap-6">
              <LangSwitch tone={scrolled ? "light" : "dark"} />

              {/* Kapsuła trybu pulpitu — celowo najmocniejszy element paska */}
              <button
                type="button"
                onClick={() => setMode("desktop")}
                title={t(ui.mode.toDesktopHint)}
                className="group relative flex items-center gap-1.5 overflow-hidden rounded-full p-2 text-[12px] font-semibold text-white shadow-[0_4px_16px_rgba(194,65,12,0.35)] transition-shadow duration-300 hover:shadow-[0_6px_22px_rgba(194,65,12,0.5)] sm:py-1.5 sm:pl-3 sm:pr-3.5 sm:text-[13px]"
                style={{
                  background:
                    "linear-gradient(135deg, #FF6A3D 0%, #C2410C 55%, #9A3412 100%)",
                }}
              >
                {/* Połysk przesuwający się po hoverze */}
                <span
                  aria-hidden
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                />
                <AppWindowMac
                  size={14}
                  strokeWidth={2}
                  aria-hidden
                  className="transition-transform duration-300 ease-apple group-hover:-translate-y-px group-hover:rotate-[-4deg]"
                />
                <span className="hidden min-[360px]:block sm:hidden">OS</span>
                <span className="hidden sm:block">
                  <StableText l10n={ui.mode.toDesktop} className="whitespace-nowrap" />
                </span>
              </button>

              <button
                type="button"
                aria-label={menuOpen ? t(ui.actions.close) : t(ui.desktop.mainMenu)}
                aria-expanded={menuOpen}
                aria-controls={menuId}
                onClick={() => setMenuOpen((open) => !open)}
                className={`group flex h-9 w-9 flex-col items-center justify-center gap-1.5 rounded-full border transition-colors duration-300 lg:hidden ${
                  scrolled || menuOpen
                    ? "border-ink/15 bg-ink text-white"
                    : "border-white/25 bg-white/10 text-white"
                }`}
              >
                <motion.span
                  aria-hidden
                  className="block h-px w-4 bg-current"
                  animate={menuOpen ? { y: 3.5, rotate: 45 } : { y: 0, rotate: 0 }}
                />
                <motion.span
                  aria-hidden
                  className="block h-px w-4 bg-current"
                  animate={menuOpen ? { y: -3.5, rotate: -45 } : { y: 0, rotate: 0 }}
                />
              </button>
            </div>
          </div>
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              id={menuId}
              className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] overflow-hidden border-t border-white/10 bg-[#121214] text-white lg:hidden"
              initial={{ clipPath: "inset(0 0 100% 0)" }}
              animate={{ clipPath: "inset(0 0 0% 0)" }}
              exit={{ clipPath: "inset(0 0 100% 0)" }}
              transition={{ duration: 0.55, ease: [...EASE_APPLE] }}
              onClick={(event) => {
                if (event.target === event.currentTarget) setMenuOpen(false);
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent-bright/20 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-[-12rem] left-[12%] h-96 w-96 rounded-full bg-accent/15 blur-3xl"
              />

              <div className="relative mx-auto flex h-full max-w-content flex-col px-6 pb-6 pt-8 sm:px-10 sm:pb-8">
                <div className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40">
                  <span>Index</span>
                  <span className="h-px flex-1 bg-white/15" />
                  <span>01/{String(navLinks.length).padStart(2, "0")}</span>
                </div>

                <ul className="flex flex-1 flex-col justify-center">
                  {navLinks.map((link, index) => (
                    <motion.li
                      key={link.href}
                      className="border-b border-white/10 first:border-t"
                      initial={{ opacity: 0, x: -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.55,
                        delay: 0.12 + index * 0.055,
                        ease: [...EASE_APPLE],
                      }}
                    >
                      <a
                        href={link.href}
                        onClick={(e) => handleAnchor(e, link.href)}
                        className="group flex items-center gap-4 py-[clamp(0.65rem,2vh,1.25rem)]"
                      >
                        <span className="w-6 text-[10px] font-semibold tabular-nums text-accent-bright">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <StableText
                          l10n={link.label}
                          className="text-[clamp(1.75rem,5.5vh,4rem)] font-semibold leading-none tracking-[-0.035em] text-white/90 transition-colors duration-300 group-hover:text-accent-bright"
                        />
                        <span
                          aria-hidden
                          className="ml-auto text-xl text-white/30 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent-bright"
                        >
                          ↗
                        </span>
                      </a>
                    </motion.li>
                  ))}
                </ul>

                <motion.button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setMode("desktop");
                  }}
                  className="group relative mt-5 flex w-full items-center gap-4 overflow-hidden rounded-2xl p-4 text-left text-white shadow-[0_12px_40px_rgba(194,65,12,0.25)] sm:p-5"
                  style={{
                    background:
                      "linear-gradient(135deg, #FF6A3D 0%, #C2410C 58%, #7C2D12 100%)",
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.4, ease: [...EASE_APPLE] }}
                >
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
                  />
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 sm:h-12 sm:w-12">
                    <AppWindowMac
                      size={20}
                      strokeWidth={1.8}
                      aria-hidden
                      className="transition-transform duration-300 ease-apple group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]"
                    />
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <StableText
                      l10n={ui.actions.openDesktop}
                      className="text-sm font-semibold sm:text-base"
                    />
                    <StableText
                      l10n={ui.mode.toDesktopHint}
                      className="mt-0.5 text-[11px] leading-snug text-white/65 sm:text-xs"
                    />
                  </span>
                  <span
                    aria-hidden
                    className="relative text-xl transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </motion.button>

                <div className="mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/35">
                  <span>{site.name}</span>
                  <span>Portfolio / 2026</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
