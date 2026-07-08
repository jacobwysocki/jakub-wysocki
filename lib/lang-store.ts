import { create } from "zustand";

export type Lang = "pl" | "en";

/** Para tłumaczeń — każdy tekst widoczny dla użytkownika ma obie wersje. */
export type L10n = { pl: string; en: string };

export const LANG_STORAGE_KEY = "jw-lang";

/**
 * Skrypt blokujący w <head> — ustala język PRZED hydratacją
 * (zapis użytkownika albo heurystyka navigator.language) i zapisuje
 * go w atrybutach <html>: lang + data-lang.
 */
export const LANG_INIT_SCRIPT = `(function(){try{var l=localStorage.getItem("${LANG_STORAGE_KEY}");if(l!=="pl"&&l!=="en"){l=(navigator.language||"").toLowerCase().indexOf("pl")===0?"pl":"en"}document.documentElement.lang=l;document.documentElement.dataset.lang=l}catch(e){document.documentElement.lang="pl";document.documentElement.dataset.lang="pl"}})()`;

type LangState = {
  /** null = jeszcze nie odczytany (SSR / przed hydratacją) */
  lang: Lang | null;
  hydrate: () => void;
  setLang: (lang: Lang) => void;
};

export const useLangStore = create<LangState>((set) => ({
  lang: null,
  hydrate: () => {
    const attr = document.documentElement.dataset.lang;
    set({ lang: attr === "en" ? "en" : "pl" });
  },
  setLang: (lang) => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      /* tryb prywatny — wybór nie przetrwa sesji */
    }
    document.documentElement.lang = lang;
    document.documentElement.dataset.lang = lang;
    set({ lang });
  },
}));

/**
 * Aktualny język z fallbackiem na "pl" — pierwsza klientowa klatka
 * renderuje się identycznie z SSR (pl), a hydrate() dociąga wybór
 * użytkownika tuż po starcie Reacta.
 */
export function useLang(): Lang {
  return useLangStore((s) => s.lang) ?? "pl";
}

/** Skrót: t(l10n) zwraca tekst w aktualnym języku. */
export function useT() {
  const lang = useLang();
  return (l10n: L10n) => l10n[lang];
}
