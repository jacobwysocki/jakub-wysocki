"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

type CountUpProps = {
  value: number;
  suffix?: string;
  duration?: number;
};

/** Liczba animowana count-up przy wejściu w viewport (raz). */
export default function CountUp({
  value,
  suffix = "",
  duration = 1.4,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduced = useReducedMotion();
  // Startujemy od prawdziwej liczby, nie od zera: HTML serwerowy to jedyne,
  // co widzi Bing bez renderu JS-u, każdy scraper podglądów linków i boty
  // modeli językowych. Wcześniej serwowaliśmy im „0 k+ aktywnych
  // użytkowników" — fakt zamieniony w swoje zaprzeczenie.
  const [display, setDisplay] = useState(value);
  const [armed, setArmed] = useState(false);

  // Zerowanie dopiero po hydratacji, żeby pierwszy render klienta zgadzał
  // się z serwerowym. Przy ograniczonym ruchu nie zerujemy wcale — nie ma
  // czego animować, a liczba jest już na miejscu.
  useEffect(() => {
    if (reduced) return;
    setArmed(true);
    setDisplay(0);
  }, [reduced]);

  useEffect(() => {
    if (!armed || !inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      // easeOutQuart — liczby zwalniają przy końcu, jak reszta ruchu
      setDisplay(Math.round(value * (1 - Math.pow(1 - t, 4))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [armed, inView, value, duration]);

  return (
    <span ref={ref} className="whitespace-nowrap tabular-nums">
      {/* Szerokość zarezerwowana pod docelową liczbę cyfr. Bez tego licznik
          rozpycha się w trakcie animacji i przesuwa sufiks — czysty CLS. */}
      <span
        style={{
          minWidth: `${String(value).length}ch`,
          display: "inline-block",
        }}
      >
        {display}
      </span>
      {suffix && (
        <span className="ml-1 align-middle text-[0.5em] font-semibold">
          {suffix.trim()}
        </span>
      )}
    </span>
  );
}
