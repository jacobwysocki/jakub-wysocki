"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useT, type L10n } from "@/lib/lang-store";
import { EASE_APPLE } from "@/lib/motion";
import LiveSite from "./LiveSite";
import MacWindow, { CONTENT_RATIO } from "./MacWindow";

/**
 * Okno produktu rozłożone na cały ekran.
 *
 * Kadr w kolumnie jest plakatem: pokazuje, że produkt istnieje i jak wygląda,
 * ale przy skali poniżej połowy nikt tam niczego nie przeczyta. Zamiast
 * ciągnąć kolumnę w nieskończoność, oddaję pełny ekran na żądanie. Skala
 * dochodzi wtedy do 1:1, czyli strona jest dokładnie tak czytelna, jak
 * u siebie w domu.
 *
 * Gramatyka jest przepisana z modalu projektu: to samo przyciemnienie
 * z rozmyciem, ten sam z-index, ta sama blokada scrolla tła, ten sam
 * data-lenis-prevent i to samo wejście na EASE_APPLE. Dwa okna modalne
 * na jednej stronie mają się otwierać tak samo, bo inaczej drugie wygląda
 * na pomyłkę.
 *
 * Portal do body jest tu koniecznością, nie ozdobą: nakładka wychodzi
 * z kolumny, która stoi w sticky i w animowanym transformie (Reveal), a
 * position: fixed wewnątrz transformu przestaje być liczony względem okna
 * przeglądarki i zostaje przyklejony do rodzica.
 */

/**
 * Szerokość, w jakiej renderuje się strona w nakładce. Ta sama, co w kadrze
 * w kolumnie: ta sama strona ma wyglądać tak samo w obu oknach, a 1440 to
 * szerokość, pod którą jest projektowana.
 */
const OVERLAY_VIRTUAL_W = 1440;

/**
 * Górna granica szerokości okna nakładki. Równa wirtualnej szerokości, więc
 * na dużym ekranie skala dobija do 1:1 i strona jest dokładnie tak czytelna,
 * jak u siebie. Wyżej nie idę: powiększanie ponad naturalny rozmiar to już
 * nie jest podgląd produktu, tylko lupa.
 */
const MAX_W = 1440;

/**
 * Ile pionu zjadają rzeczy poza polem treści: 48px oddechu nakładki
 * (p-6 góra i dół) plus 41px paska tytułu z kreską. Zaokrąglone w górę,
 * żeby przy niskim oknie zostało jeszcze trochę powietrza.
 */
const VERTICAL_CHROME = 96;

const COPY = {
  title: { pl: "Podgląd strony", en: "Site preview" },
  close: { pl: "Zamknij podgląd", en: "Close the preview" },
} satisfies Record<string, L10n>;

export default function SiteOverlay({
  open,
  onClose,
  url,
  label,
  still,
}: {
  open: boolean;
  /** Zamknięcie oddaje fokus elementowi, który nakładkę otworzył */
  onClose: () => void;
  url: string;
  label: string;
  /** Kadr statyczny w rozmiarze nakładki: warstwa bazowa pod iframem */
  still: ReactNode;
}) {
  const t = useT();
  const dialogRef = useRef<HTMLDivElement>(null);
  // Portal dotyka document, więc przy renderze na serwerze go nie ma
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Fokus siada na samym oknie dialogu, a nie na krzyżyku: czytnik ekranu
    // czyta wtedy etykietę nakładki, a nie od razu drogę wyjścia z niej
    dialogRef.current?.focus();
    // Blokada scrolla tła na czas nakładki
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!ready) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${t(COPY.title)}: ${label}`}
            tabIndex={-1}
            data-lenis-prevent
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [...EASE_APPLE] }}
            className="relative"
            // Szerokość ograniczają trzy rzeczy naraz i wygrywa najostrzejsza:
            // twardy sufit, szerokość ekranu i wysokość ekranu przeliczona
            // przez proporcje pola treści. Bez tego trzeciego członu okno na
            // niskim laptopie wystawałoby dołem poza ekran.
            style={{
              width: `min(${MAX_W}px, 92vw, calc((100vh - ${VERTICAL_CHROME}px) * ${CONTENT_RATIO}))`,
            }}
          >
            <MacWindow href={url} onClose={onClose}>
              <LiveSite
                src={url}
                label={label}
                still={still}
                virtualWidth={OVERLAY_VIRTUAL_W}
                interactive
              />
            </MacWindow>

            {/* Wyjście dla klawiatury, za ramką w kolejności DOM: kto
                wytabuje się z osadzonej strony, trafia prosto na nie.
                Escape zostaje przy krzyżyku, bo dopóki fokus siedzi
                w cross-origin iframie, klawisze należą do obcego dokumentu
                i żaden nasz listener ich nie zobaczy. */}
            <button
              type="button"
              onClick={onClose}
              className="sr-only focus:not-sr-only focus:absolute focus:bottom-3 focus:left-3 focus:z-20 focus:flex focus:items-center focus:rounded-full focus:bg-white focus:px-3.5 focus:py-1.5 focus:text-[12px] focus:font-semibold focus:text-ink focus:ring-1 focus:ring-ink/10"
            >
              {t(COPY.close)}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
