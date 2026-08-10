"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [lang, setLangState] = useState<Lang>(initialLang ?? "pl");

  useEffect(() => {
    if (initialLang) return;
    const fromCookie = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${LANG_COOKIE}=`))
      ?.split("=")[1];
    setLangState(normalizeLang(fromCookie ?? navigator.language));
  }, [initialLang]);

  // Atrybut na <html> ustawia root layout wartością domyślną; tutaj
  // doprowadzamy go do języka faktycznie renderowanego. To sam atrybut,
  // więc nie powoduje przemalowania treści.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    document.cookie = `${LANG_COOKIE}=${next};path=/;max-age=${LANG_COOKIE_MAX_AGE};samesite=lax`;
    setLangState(next);
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return (
    <LangContext.Provider value={value}>
      {/*
        lang na wrapperze, bo <html lang> ustawia root layout i nie da się go
        zmienić z poziomu trasy bez uczynienia całej aplikacji dynamiczną.
        Dokument deklaruje angielski (x-default to /about), a ta sekcja
        nadpisuje go językiem faktycznie renderowanym — ten sam zabieg co
        w EntityHome. Dzięki temu polska treść jest poprawnie otagowana
        już w HTML-u serwerowym, a nie dopiero po hydratacji.
      */}
      <div lang={lang}>{children}</div>
    </LangContext.Provider>
  );
}
