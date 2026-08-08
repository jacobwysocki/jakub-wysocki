"use client";

import { motion, useReducedMotion } from "framer-motion";
import { REVEAL_TRANSITION } from "@/lib/motion";

type RevealProps = {
  children: React.ReactNode;
  /** Opóźnienie względem wejścia w viewport (sekundy) */
  delay?: number;
  className?: string;
};

/**
 * Reużywalny reveal na scrollu: fade + wynurzenie z dołu, raz na sesję.
 * Przy prefers-reduced-motion redukuje się do szybkiego fade bez ruchu.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: RevealProps) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={reduced ? { duration: 0.2 } : { ...REVEAL_TRANSITION, delay }}
    >
      {children}
    </motion.div>
  );
}
