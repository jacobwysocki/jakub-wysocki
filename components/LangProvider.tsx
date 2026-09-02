"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LangContext } from "@/lib/lang-store";
import {
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  normalizeLang,
  type Lang,
} from "@/lib/lang";

/**
 * Dostarcza język do całego drzewa klienta.
 *
 * `initialLang` przychodzi z serwera (ciastko albo Accept-Language), więc
 * pierwszy render — serwerowy i klientowy — jest od razu we właściwym
 * języku i nie ma czego przełączać po hydratacji.
 *
 * Gdy `initialLang` nie zostanie podany (trasy, które nie czytają ciastka,
 * np. 404), wracamy do ustalania po stronie klienta. Miganie jest tam wtedy
 * możliwe, ale na stronie błędu nie ma znaczenia.
 */
export default function LangProvider({
  initialLang,
  children,
}: {
  initialLang?: Lang;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>(initialLang ?? "pl");

  useEffect(() => {
    if (initialLang) return;
    const fromCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${LANG_COOKIE}=`))
      ?.split("=")[1];
    setLangState(normalizeLang(fromCookie ?? navigator.language));
  }, [initialLang]);

  // Root layout ustawia ten sam język w odpowiedzi serwera. Efekt utrzymuje
  // atrybut po zmianie przełącznikiem i nawigacji klienckiej; na pierwszej
  // hydratacji zapisuje identyczną wartość, więc nie ma rozjazdu.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback(
    (next: Lang) => {
      document.cookie = `${LANG_COOKIE}=${next};path=/;max-age=${LANG_COOKIE_MAX_AGE};samesite=lax`;
      // Treść i <html lang> zmieniają się lokalnie od razu. Refresh pobiera
      // nowy payload serwerowy już z zapisanym ciastkiem, dzięki czemu
      // metadata tej samej trasy przechodzą na ten sam język. App Router
      // scala payload bez resetowania stanu klienta ani pozycji przewijania.
      setLangState(next);
      router.refresh();
    },
    [router],
  );

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return (
    <LangContext.Provider value={value}>
      {/*
        Wrapper zachowuje lokalną semantykę także podczas przełączenia języka
        po stronie klienta, zanim efekt zsynchronizuje <html>. W pierwszej
        odpowiedzi oba atrybuty dostają tę samą wartość z serwera.
      */}
      <div lang={lang}>{children}</div>
    </LangContext.Provider>
  );
}
