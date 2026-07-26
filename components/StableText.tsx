"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useLang, type L10n } from "@/lib/lang-store";

type StableTextProps = {
  l10n: L10n;
  className?: string;
  /** Własny render aktywnego tekstu (np. animowane słowa). */
  children?: (text: string) => ReactNode;
};

/**
 * Stabilny układ przy zmianie języka: nieaktywna wersja tekstu rezerwuje
 * miejsce jako niewidoczna kopia w tej samej komórce grida, więc
 * przełączenie PL/EN nie zmienia wymiarów kontenera.
 *
 * Kopia miarowa montuje się DOPIERO po hydratacji, i to jest zmiana pod SEO:
 * wcześniej obie wersje językowe trafiały do HTML-a serwerowego, więc crawler
 * czytał sklejkę w rodzaju „Buduję marki i oprogramowanie.I build brands and
 * software." — dokładnie tam, gdzie potrzebne są czyste, jednoznaczne fakty
 * o osobie. Teraz źródło strony zawiera wyłącznie język aktywny, a kopia
 * miarowa (invisible + aria-hidden) dochodzi na kliencie.
 *
 * Kosztem jest mikroskopijne przesunięcie układu tuż po hydratacji, gdy
 * wersja nieaktywna jest szersza od aktywnej.
 */
export default function StableText({
  l10n,
  className = "",
  children,
}: StableTextProps) {
  const lang = useLang();
  const [mounted, setMounted] = useState(false);

  // Pierwszy render klienta musi być identyczny z SSR — stąd stan zamiast
  // odczytu w trakcie renderu.
  useEffect(() => setMounted(true), []);

  const otherLang = lang === "pl" ? "en" : "pl";

  return (
    <span className={`grid ${className}`}>
      {mounted && (
        <span
          aria-hidden
          lang={otherLang}
          className="invisible [grid-area:1/1]"
        >
          {l10n[otherLang]}
        </span>
      )}
      <span className="[grid-area:1/1]">
        {children ? children(l10n[lang]) : l10n[lang]}
      </span>
    </span>
  );
}
