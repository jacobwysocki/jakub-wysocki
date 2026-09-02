"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useModeStore } from "@/lib/mode-store";
import { EASE_APPLE } from "@/lib/motion";

// Pulpit ładuje się tylko na klencie i tylko, gdy jest potrzebny —
// użytkownik prostego widoku nie pobiera jego kodu.
//
// Świadomy wyjątek od reguły „każdy dynamic() ma loading": ssr:false daje
// w Next 16 własną granicę z pustym fallbackiem, więc zawieszenie nie chowa
// strony, a postrzeganą chwilę ładowania pulpitu zagospodarowuje BootScreen
// wewnątrz samego pulpitu. Osobny loading dublowałby ekran startowy.
const Desktop = dynamic(() => import("@/components/desktop/Desktop"), {
  ssr: false,
});

/**
 * Bramka trybów: renderuje prosty layout (SSR, przekazany jako children)
 * albo tryb pulpitu, z cross-fade przy przełączaniu. Pierwsze ustalenie
 * trybu po hydratacji jest natychmiastowe (bez fade) — miganie prostego
 * layoutu przy starcie w trybie pulpitu blokuje CSS w globals.css.
 */
export default function ModeGate({ simple }: { simple: React.ReactNode }) {
  const mode = useModeStore((s) => s.mode);
  const hydrate = useModeStore((s) => s.hydrate);
  const reduced = useReducedMotion();
  const prevMode = useRef<typeof mode>(null);

  // Język nie jest już tu dociągany — dostarcza go LangProvider wartością
  // ustaloną na serwerze, więc nie ma nic do nadrobienia po hydratacji.
  useEffect(() => {
    hydrate();
    document.documentElement.setAttribute("data-hydrated", "");
  }, [hydrate]);

  // Pierwsza zmiana null -> tryb: bez animacji (to nie jest przełączenie)
  const instant = prevMode.current === null;
  useEffect(() => {
    prevMode.current = mode;
  }, [mode]);

  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: instant || reduced ? 0 : 0.5,
      ease: [...EASE_APPLE],
    },
  } as const;

  return (
    <AnimatePresence initial={false}>
      {mode === "desktop" ? (
        <motion.div key="desktop" {...fade}>
          <Desktop />
        </motion.div>
      ) : (
        <motion.div key="simple" data-simple-root {...fade}>
          {simple}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
