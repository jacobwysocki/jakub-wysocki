"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
  const lenis = useLenis();
  const setMode = useModeStore((s) => s.setMode);
  const t = useT();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleAnchor = (e: React.MouseEvent, href: string) => {
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
        className={`transition-all duration-500 ease-apple ${
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

          <ul className="flex items-center gap-4 sm:gap-6">
            {navLinks.map((link) => (
              <li key={link.href} className="hidden md:block">
                <a
                  href={link.href}
                  onClick={(e) => handleAnchor(e, link.href)}
                  className={`text-[13px] font-medium transition-colors duration-300 ${
                    scrolled
                      ? "text-ink/80 hover:text-accent"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  <StableText l10n={link.label} className="whitespace-nowrap" />
                </a>
              </li>
            ))}

            <li>
              <LangSwitch tone={scrolled ? "light" : "dark"} />
            </li>

            {/* Kapsuła trybu pulpitu — celowo najmocniejszy element paska */}
            <li>
              <button
                type="button"
                onClick={() => setMode("desktop")}
                title={t(ui.mode.toDesktopHint)}
                className="group relative flex items-center gap-1.5 overflow-hidden rounded-full py-1.5 pl-3 pr-3.5 text-[12px] font-semibold text-white shadow-[0_4px_16px_rgba(194,65,12,0.35)] transition-shadow duration-300 hover:shadow-[0_6px_22px_rgba(194,65,12,0.5)] sm:text-[13px]"
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
                <StableText l10n={ui.mode.toDesktop} className="whitespace-nowrap" />
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </motion.header>
  );
}
