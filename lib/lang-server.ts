import { cookies, headers } from "next/headers";
// Z lib/lang, nie z lib/lang-store: ten drugi jest modułem klienckim
// i jego funkcji nie da się wywołać z serwera.
import { LANG_COOKIE, normalizeLang, type Lang } from "@/lib/lang";

/**
 * Ustala język po stronie serwera: najpierw zapisany wybór użytkownika,
 * potem preferencja przeglądarki. Dzięki temu pierwszy paint jest już we
 * właściwym języku.
 *
 * Root layout używa tej funkcji dla atrybutu `<html lang>`, a dwujęzyczne
 * strony dla LangProvider. Odczyt danych żądania świadomie przełącza całą
 * aplikację na render dynamiczny, ale dzięki temu dokument i treść mają ten
 * sam język już w odpowiedzi serwera.
 */
export async function resolveLang(): Promise<Lang> {
  const stored = (await cookies()).get(LANG_COOKIE)?.value;
  if (stored === "pl" || stored === "en") return stored;

  // Accept-Language to lista ważona, np. "pl-PL,pl;q=0.9,en-US;q=0.8".
  // navigator.language po stronie klienta zwraca samą czołówkę, więc bierzemy
  // pozycję o najwyższym q — inaczej obie ścieżki mogłyby dać inny wynik.
  const header = (await headers()).get("accept-language") ?? "";
  const best = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag, q: q ? Number.parseFloat(q.split("=")[1]) : 1 };
    })
    .filter((entry) => entry.tag)
    .sort((a, b) => b.q - a.q)[0]?.tag;

  return normalizeLang(best);
}
