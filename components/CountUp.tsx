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
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
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
  }, [inView, value, duration, reduced]);

  return (
    <span ref={ref} className="whitespace-nowrap">
      {display}
      {suffix && (
        <span className="ml-1 align-middle text-[0.5em] font-semibold">
          {suffix.trim()}
        </span>
      )}
    </span>
  );
}
