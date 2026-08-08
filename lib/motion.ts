import type { Transition, Variants } from "framer-motion";

/** Główny easing — miękki, „applowski" easeOut */
export const EASE_APPLE = [0.16, 1, 0.3, 1] as const;

/** Sprężyna dla mikrointerakcji (hover / tap) */
export const SPRING: Transition = {
  type: "spring",
  stiffness: 140,
  damping: 20,
};

/** Domyślna tranzycja reveal */
export const REVEAL_TRANSITION: Transition = {
  duration: 0.8,
  ease: [...EASE_APPLE],
};

/** Standardowy reveal: fade + wynurzenie z dołu */
export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: REVEAL_TRANSITION },
};

/** Kontener staggera — dzieci używają revealVariants */
export const staggerContainer = (stagger = 0.1): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
});

/** Wariant pojedynczego słowa w headline hero */
export const wordVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: REVEAL_TRANSITION },
};
