"use client";

import { useEffect, useState } from "react";

/**
 * Reaktywny matchMedia. Używać tylko w komponentach renderowanych
 * wyłącznie po stronie klienta (initial czyta window bez guardu SSR
 * poza typeof-checkiem).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
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
