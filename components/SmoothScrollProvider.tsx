"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

/** Dostęp do instancji Lenisa (np. dla kotwic w nav) */
export function useLenis() {
  return useContext(LenisContext);
}

/** Ile miejsca zostaje nad celem kotwicy — tyle, ile zajmuje pasek plus oddech. */
const ANCHOR_GAP = 72;

/**
 * Nawigacja po kotwicach z przeniesieniem fokusa na cel: Lenis z
 * preventDefault przewija tylko widok, a fokus klawiatury zostawał
 * w miejscu kliknięcia — kolejny Tab kontynuował z paska zamiast
 * z sekcji, do której użytkownik właśnie przeszedł.
 *
 * Offset liczymy z `scroll-margin-top` celu, bo Lenis ten margines CZYTA
 * i odejmuje od pozycji docelowej (dist/lenis.mjs), zanim doda offset.
 * Sekcje mają margines dla natywnego skoku po hashu na dotyku, gdzie
 * Lenisa nie ma; ze sztywnym `-72` obie poprawki by się sumowały i cel
 * lądowałby o cały margines za nisko. Ta arytmetyka daje jeden wynik na
 * obu ścieżkach: cel zatrzymuje się ANCHOR_GAP pikseli od góry okna.
 */
export function useAnchorNav() {
  const lenis = useLenis();

  return (e: React.MouseEvent, href: string) => {
    const target = document.querySelector<HTMLElement>(href);
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
    // Bez Lenisa (reduced motion / dotyk) działa natywna nawigacja po hash
    if (!lenis) return;
    e.preventDefault();
    const scrollMargin = target
      ? Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0
      : 0;
    lenis.scrollTo(href, { offset: scrollMargin - ANCHOR_GAP });
  };
}

/**
 * Globalny płynny scroll. Przy prefers-reduced-motion Lenis nie startuje —
 * strona używa natywnego scrolla.
 */
export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    // Płynny scroll tylko na desktopie. Na dotyku (telefon/tablet) natywny
    // scroll działa poza wątkiem głównym i jest płynniejszy niż RAF Lenisa,
    // który dodatkowo re-triggeruje każdy useScroll na każdej klatce.
    const noSmooth =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    if (noSmooth) return;

    const instance = new Lenis({ lerp: 0.1 });
    setLenis(instance);

    const raf = (time: number) => {
      instance.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };
    rafRef.current = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafRef.current);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
