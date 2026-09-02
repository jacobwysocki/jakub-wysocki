"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useT, type L10n } from "@/lib/lang-store";
import { EASE_APPLE } from "@/lib/motion";
import { TOPMOST_OVERLAY_ATTR } from "@/lib/overlay";
import type { IterationFrame } from "@/data/case-studies";

/**
 * Klatka historii iteracji rozłożona na cały ekran.
 *
 * Miniatury w siatce są osią czasu: pokazują, że widok przeszedł sześć
 * podejść, ale gęstej makiety przy ~440px nikt nie przeczyta. Pełny ekran
 * na żądanie oddaje klatce naturalną skalę, a strzałki pozwalają przejść
 * historię bez wracania do siatki.
 *
 * Gramatyka jest przepisana z SiteOverlay: to samo przyciemnienie
 * z rozmyciem, ten sam z-index, ta sama blokada scrolla tła i to samo
 * wejście na EASE_APPLE. Portal do body jest koniecznością: siatka żyje
 * także w oknie pulpitu, którego overflow obciąłby nakładkę do 760px.
 */

/** Stały „store": nic nie emituje, served snapshot różni się tylko środowiskiem. */
const subscribeNever = () => () => {};

const COPY = {
  title: { pl: "Iteracja", en: "Iteration" },
  close: { pl: "Zamknij podgląd", en: "Close the preview" },
  prev: { pl: "Poprzednia iteracja", en: "Previous iteration" },
  next: { pl: "Następna iteracja", en: "Next iteration" },
  finalTag: { pl: "finał", en: "final" },
} satisfies Record<string, L10n>;

export default function IterationLightbox({
  frames,
  index,
  onClose,
  onNavigate,
}: {
  frames: IterationFrame[];
  /** Indeks otwartej klatki; null trzyma nakładkę zamkniętą. */
  index: number | null;
  /** Zamknięcie oddaje fokus elementowi, który nakładkę otworzył. */
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const t = useT();
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  // Portal dotyka document, więc przy renderze na serwerze go nie ma
  const ready = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );

  const open = index !== null;
  const count = frames.length;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      // Klawisze nakładki nie mogą dosięgnąć pulpitu: jego własny Escape
      // (bąbelkujący listener na window) zamknąłby też okno POD nakładką.
      // Faza capture + stopPropagation kończą zdarzenie tutaj; warstwy
      // niżej dodatkowo ustępują, widząc atrybut najwyższej nakładki.
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
      // Strzałki przejmujemy w całości: bez preventDefault przewijałyby
      // dokument pod nakładką.
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        event.stopPropagation();
        onNavigate(((index ?? 0) + count - 1) % count);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        onNavigate(((index ?? 0) + 1) % count);
      }
      // Pułapka fokusa: aria-modal obiecuje, że Tab nie wyjdzie pod
      // nakładkę, więc cykl domykamy ręcznie na jej przyciskach.
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        const active = document.activeElement;
        const inside =
          active instanceof HTMLElement && dialogRef.current.contains(active);
        if (
          event.shiftKey &&
          (!inside || active === first || active === dialogRef.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (!inside || active === last)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    // Fokus siada na dialogu (czytnik czyta etykietę klatki), a wraca do
    // przycisku miniatury, który nakładkę otworzył.
    openerRef.current = document.activeElement;
    dialogRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = prev;
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
      openerRef.current = null;
    };
    // Nawigacja strzałkami zmienia index, ale nakładka zostaje otwarta —
    // fokus i blokada scrolla mają przeżyć zmianę klatki.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose]);

  if (!ready) return null;

  const frame = index !== null ? frames[index] : null;

  return createPortal(
    <AnimatePresence>
      {open && frame && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${t(COPY.title)} ${(index ?? 0) + 1}/${count}: ${t(frame.alt)}`}
            tabIndex={-1}
            data-lenis-prevent
            {...{ [TOPMOST_OVERLAY_ATTR]: "" }}
            initial={
              reduced ? { opacity: 0 } : { opacity: 0, y: 32, scale: 0.97 }
            }
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
            transition={
              reduced
                ? { duration: 0.15 }
                : { duration: 0.4, ease: [...EASE_APPLE] }
            }
            className="relative flex max-h-full w-full max-w-[1100px] flex-col outline-none"
          >
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-[13px] font-semibold tracking-wide text-white/85">
                {t(COPY.title)} {(index ?? 0) + 1} / {count}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label={t(COPY.close)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            {/* Sam JPG ma białe tło, więc białe pole pod object-contain
                jest niewidocznym marginesem, nie ramką w ramce. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={frame.src}
              src={frame.src}
              alt={t(frame.alt)}
              className="min-h-0 w-full flex-1 rounded-2xl bg-white object-contain shadow-lift"
            />

            {frame.note || frame.final ? (
              <p className="mt-3 max-w-[75ch] text-[13.5px] leading-snug text-white/85">
                {frame.note ? t(frame.note) : null}
                {frame.final ? (
                  <span className="ml-1 font-semibold text-accent-bright">
                    · {t(COPY.finalTag)}
                  </span>
                ) : null}
              </p>
            ) : null}

            <div className="pointer-events-none absolute inset-y-0 -left-2 -right-2 flex items-center justify-between sm:-left-16 sm:-right-16">
              <button
                type="button"
                onClick={() => onNavigate(((index ?? 0) + count - 1) % count)}
                aria-label={t(COPY.prev)}
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <ChevronLeft size={22} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onNavigate(((index ?? 0) + 1) % count)}
                aria-label={t(COPY.next)}
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <ChevronRight size={22} aria-hidden />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
