"use client";

import { useEffect, useState } from "react";

/**
 * Reaktywny matchMedia. Używać tylko w komponentach renderowanych
 * wyłącznie po stronie klienta (initial czyta window bez guardu SSR
 * poza typeof-checkiem).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * Wariant bezpieczny dla SSR: zawsze startuje `false`, więc HTML z serwera
 * i pierwszy render klienta są identyczne (żadnego hydration mismatch).
 * Realną wartość odczytuje dopiero efekt po zamontowaniu — tak samo jak
 * framer-motionowy useReducedMotion. Do użycia w komponentach renderowanych
 * po stronie serwera (tu: prosty layout strony głównej).
 */
export function useMediaQuerySafe(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
