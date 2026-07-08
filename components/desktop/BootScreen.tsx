"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_APPLE } from "@/lib/motion";

const BOOT_KEY = "jw-booted";

/**
 * Ekran startowy: czarne tło, monogram i wypełniający się progress bar.
 * Tylko przy pierwszym wejściu na pulpit w danej sesji; przy
 * prefers-reduced-motion pominięty całkowicie.
 */
export default function BootScreen() {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(() => {
    if (reduced) return false;
    try {
      return !sessionStorage.getItem(BOOT_KEY);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!visible) return;
    try {
      sessionStorage.setItem(BOOT_KEY, "1");
    } catch {
      /* tryb prywatny */
    }
    const timeout = setTimeout(() => setVisible(false), 1550);
    return () => clearTimeout(timeout);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          aria-hidden
          exit={{ opacity: 0, transition: { duration: 0.5, ease: [...EASE_APPLE] } }}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center gap-10 bg-black"
        >
          <span className="text-3xl font-bold tracking-tight text-white">
            jakub-wysocki
          </span>
          <div className="h-[5px] w-44 overflow-hidden rounded-full bg-white/20">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.25, ease: "easeInOut", delay: 0.15 }}
              className="h-full w-full origin-left rounded-full bg-accent-bright"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
