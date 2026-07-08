"use client";

import type { ReactNode } from "react";
import { useLang, type L10n } from "@/lib/lang-store";

type StableTextProps = {
  l10n: L10n;
  className?: string;
  /** Własny render aktywnego tekstu (np. animowane słowa). */
  children?: (text: string) => ReactNode;
};

/**
 * Stabilny układ przy zmianie języka: obie wersje tekstu rezerwują
 * miejsce jako niewidoczne kopie w tej samej komórce grida, więc
 * przełączenie PL/EN nie zmienia wymiarów kontenera.
 */
export default function StableText({
  l10n,
  className = "",
  children,
}: StableTextProps) {
  const lang = useLang();
  return (
    <span className={`grid ${className}`}>
      <span aria-hidden className="invisible [grid-area:1/1]">
        {l10n.pl}
      </span>
      <span aria-hidden className="invisible [grid-area:1/1]">
        {l10n.en}
      </span>
      <span className="[grid-area:1/1]">
        {children ? children(l10n[lang]) : l10n[lang]}
      </span>
    </span>
  );
}
