/**
 * Część językowa niezależna od środowiska: typy, stałe i reguła wyboru.
 *
 * Celowo BEZ dyrektywy "use client". Ten sam kod musi działać na serwerze
 * (lib/lang-server.ts ustala język z ciastka i Accept-Language) i na kliencie
 * (components/LangProvider.tsx). Wcześniej mieszkało to w lang-store.ts, który
 * jest kliencki, przez co serwer wywracał się na wywołaniu normalizeLang.
 */

export type Lang = "pl" | "en";

/** Para tłumaczeń — każdy tekst widoczny dla użytkownika ma obie wersje. */
export type L10n = { pl: string; en: string };

/**
 * Nazwa ciastka, nie klucza localStorage. To jest cała różnica: ciastko
 * jedzie z każdym żądaniem, więc serwer zna język PRZED renderem i wysyła
 * od razu właściwą wersję. Przy localStorage serwer musiał zgadywać („pl"),
 * a właściwy język wchodził dopiero po hydratacji — stąd brało się miganie.
 */
export const LANG_COOKIE = "jw-lang";

/** Rok. Wybór języka to preferencja, nie stan sesji. */
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Suffixes spelled out as words ("years", "lat") vs. symbols ("+", "k+", "h"). */
export function isWordSuffix(suffix: string) {
  return /^[a-zA-Z]+$/.test(suffix.trim()) && suffix.trim().length > 1;
}

/**
 * Jedna reguła wyboru języka, używana i na serwerze, i na kliencie.
 * Polski dostaje wyłącznie tag zaczynający się od „pl", cała reszta świata
 * angielski, bo innych wersji nie ma. Trzymanie tego w jednym miejscu jest
 * istotne: gdyby serwer i klient rozstrzygały to inaczej, miganie wróciłoby
 * tylnymi drzwiami dla części użytkowników.
 */
export function normalizeLang(tag: string | null | undefined): Lang {
  return tag?.trim().toLowerCase().startsWith("pl") ? "pl" : "en";
}
