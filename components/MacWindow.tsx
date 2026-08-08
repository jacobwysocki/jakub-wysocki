"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Lock, X } from "lucide-react";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";

/**
 * Ramka okna przeglądarki w stylu macOS: trzy światła po lewej i pigułka
 * adresu na środku. Pigułka NIE jest atrapą, tylko realnym linkiem do
 * produktu, więc jedyny interaktywny element okna leży dokładnie tam, gdzie
 * oko go szuka.
 *
 * Światła są dekoracją (aria-hidden) i celowo nie są przyciskami: udawany
 * przycisk „zamknij", który niczego nie zamyka, to obietnica bez pokrycia,
 * a dla czytnika ekranu trzy bezużyteczne kontrolki przed treścią.
 *
 * Pole treści ma stałe proporcje i overflow-hidden. To nie jest kosmetyka:
 * osadzony, przeskalowany iframe bywa layoutowo wyższy od swojego kadru i
 * gdyby kadr mógł rosnąć za treścią, ResizeObserver w środku dostałby pętlę
 * wzrostu. Pudełko o proporcjach z góry ustalonych nie da się rozepchnąć.
 */

/** Kolory świateł z macOS Sonoma */
const LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"];

/**
 * Proporcje pola treści = proporcje kadru zastępczego (1560x819). Dzięki temu
 * statyczny podgląd wchodzi w okno bez jednego przyciętego piksela, a wersja
 * na żywo dostaje wirtualny widok o kształcie okna przeglądarki na laptopie.
 *
 * Klasa i liczba muszą mówić to samo. Klasa jest literałem, bo Tailwind czyta
 * kod jako tekst i nie policzy wyrażenia; liczba jest potrzebna nakładce,
 * która z proporcji wylicza swoją szerokość pod wysokość ekranu.
 */
const CONTENT_ASPECT = "aspect-[1560/819]";
export const CONTENT_RATIO = 1560 / 819;

/** Adres do pigułki: bez protokołu, bez www i bez końcowego slasha */
export function displayUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export default function MacWindow({
  href,
  onClose,
  children,
}: {
  /** Realny adres produktu; otwiera się w nowej karcie */
  href: string;
  /**
   * Gdy okno jest rozłożone w nakładce, pasek dostaje po prawej krzyżyk.
   * Świateł nie ruszam: w kolumnie są dekoracją i mają nią zostać także tutaj,
   * bo okno, którego światła raz działają, a raz nie, uczy nieufności.
   */
  onClose?: () => void;
  children: ReactNode;
}) {
  const t = useT();
  const label = displayUrl(href);

  return (
    <div className="overflow-hidden rounded-[14px] bg-white shadow-lift ring-1 ring-ink/10">
      {/* Pasek tytułu: 40px, ta sama szarość co pasek okna w macOS */}
      <div className="relative flex h-10 items-center bg-[#F5F5F7] px-3.5">
        <span aria-hidden className="flex items-center gap-2">
          {LIGHTS.map((color) => (
            <span
              key={color}
              className="h-3 w-3 rounded-full ring-1 ring-inset ring-black/[0.06]"
              style={{ background: color }}
            />
          ))}
        </span>

        {/* Pigułka adresu jest wyśrodkowana względem paska, nie względem
            reszty treści: dlatego absolut, a nie flex z rozpychaczami.
            Zapas 80px z każdej strony trzyma ją z dala od świateł (koniec
            ostatniego wypada na 66px) nawet przy ekranie 390px.

            Fokus zostawiam globalnemu :focus-visible z globals.css: pigułka
            to jedyna kontrolka okna i ma świecić dokładnie tak samo, jak
            każdy inny link na stronie.

            Pole dotyku rozciąga pseudoelement na CAŁĄ wysokość paska (40px),
            a nie padding: padding urósłby razem z widoczną pigułką, a ta ma
            zostać dokładnie taka, jaka jest. Wyżej niż 40px nie idziemy —
            pasek jest przycięty od góry przez ramkę okna, a od dołu zaczyna
            się treść i nadmiar zjadałby jej kliknięcia. */}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t(ui.actions.openInNewTab)}: ${label}`}
          className="group absolute left-1/2 top-1/2 flex max-w-[calc(100%-160px)] -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[12px] font-medium leading-[18px] text-ink/70 ring-1 ring-ink/10 transition-colors before:absolute before:inset-x-0 before:top-1/2 before:h-10 before:-translate-y-1/2 before:content-[''] hover:text-ink hover:ring-ink/25"
        >
          <Lock size={11} aria-hidden className="shrink-0 text-muted" />
          <span className="truncate">{label}</span>
          <ArrowUpRight
            size={12}
            aria-hidden
            className="shrink-0 text-muted transition-colors group-hover:text-accent"
          />
        </a>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t(ui.actions.close)}
            className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/[0.06] hover:text-ink"
          >
            <X size={15} aria-hidden />
          </button>
        )}
      </div>

      {/* Hairline pod paskiem osobno, nie borderem paska: border wchodziłby
          w jego 40px i światła siadałyby o pół piksela wyżej. */}
      <div aria-hidden className="h-px w-full bg-ink/10" />

      <div
        className={`relative w-full overflow-hidden bg-[#F5F5F7] ${CONTENT_ASPECT}`}
      >
        {children}
      </div>
    </div>
  );
}
