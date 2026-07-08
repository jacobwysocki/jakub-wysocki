"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

/** Dostęp do instancji Lenisa (np. dla kotwic w nav) */
export function useLenis() {
  return useContext(LenisContext);
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
