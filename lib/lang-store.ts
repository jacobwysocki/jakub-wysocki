"use client";

import { createContext, useContext } from "react";
import type { Lang, L10n } from "@/lib/lang";

/**
 * Kliencka warstwa języka: context i hooki.
 *
 * Typy i stałe re-eksportujemy z lib/lang, żeby ~30 komponentów mogło dalej
 * importować wszystko z jednego miejsca. Serwer musi sięgać po lib/lang
 * bezpośrednio — ten moduł jest kliencki i jego funkcji nie da się wywołać
 * z komponentu serwerowego.
 */
export type { Lang, L10n } from "@/lib/lang";
export {
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  isWordSuffix,
  normalizeLang,
} from "@/lib/lang";

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
};

/**
 * Context, nie store modułowy. Store zustanda jest singletonem na moduł,
 * więc zasianie go wartością z żądania wyciekałoby między równoległymi
 * renderami na serwerze i dwóch użytkowników mogłoby dostać cudzy język.
 */
export const LangContext = createContext<LangContextValue>({
  lang: "pl",
  setLang: () => {},
});

export function useLang(): Lang {
  return useContext(LangContext).lang;
}

export function useSetLang() {
  return useContext(LangContext).setLang;
}

/** Skrót: t(l10n) zwraca tekst w aktualnym języku. */
export function useT() {
  const lang = useLang();
  return (l10n: L10n) => l10n[lang];
}
