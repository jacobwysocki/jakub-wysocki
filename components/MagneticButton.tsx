"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

type MagneticButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Link-przycisk z magnetycznym hoverem: delikatnie podąża za kursorem
 * w promieniu własnego obszaru, wraca sprężyną po wyjściu.
 */
export default function MagneticButton({
  href,
  children,
  className,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 140, damping: 20 });
  const springY = useSpring(y, { stiffness: 140, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    // Przesunięcie ograniczone do ±12px, żeby efekt był subtelny
    x.set(((e.clientX - rect.left - rect.width / 2) / rect.width) * 24);
    y.set(((e.clientY - rect.top - rect.height / 2) / rect.height) * 24);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      ref={ref}
      href={href}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.a>
  );
}
