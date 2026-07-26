"use client";

import { type ReactNode } from "react";
import { useLang, type L10n } from "@/lib/lang-store";

type StableTextProps = {
  l10n: L10n;
  className?: string;
  /** Własny render aktywnego tekstu (np. animowane słowa). */
  children?: (text: string) => ReactNode;
};

/**
 * Renderuje tekst w aktywnym języku.
 *
 * Komponent miał wcześniej niewidoczną kopię nieaktywnej wersji, która
 * rezerwowała miejsce, żeby ręczne przełączenie PL/EN nie ruszało układu.
 * Kopia montowała się dopiero po hydratacji (w SSR nie mogła być, bo crawler
 * czytał wtedy sklejkę „Buduję marki i oprogramowanie.I build brands and
 * software."), więc grid rozrastał się do szerszej z wersji już PO pierwszym
 * paincie. Efektem był widoczny skok układu przy każdym wejściu na stronę,
 * u każdego użytkownika, także takiego, który języka nigdy nie przełącza.
 * Na wielkiej typografii hero było to wyraźne i liczyło się do CLS.
 *
 * Bilans wychodził na minus: stały koszt przy każdym ładowaniu w zamian za
 * wygładzenie świadomego kliknięcia, którego większość osób nie wykona.
 * Przy zmianie języka układ może teraz drgnąć i to jest zamierzone.
 */
export default function StableText({
  l10n,
  className = "",
  children,
}: StableTextProps) {
  const lang = useLang();

  return (
    <span className={className}>
      {children ? children(l10n[lang]) : l10n[lang]}
    </span>
  );
}
