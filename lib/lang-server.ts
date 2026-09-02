import { cookies, headers } from "next/headers";
// Z lib/lang, nie z lib/lang-store: ten drugi jest modułem klienckim
// i jego funkcji nie da się wywołać z serwera.
import { LANG_COOKIE, normalizeLang, type Lang } from "@/lib/lang";

/**
 * Ustala język po stronie serwera: najpierw zapisany wybór użytkownika,
 * potem preferencja przeglądarki. Dzięki temu pierwszy paint jest już we
 * właściwym języku.
 *
 * Root grupy `(bilingual)` używa tej funkcji dla `<html lang>`, a jej strony
 * dla LangProvider i metadanych. Odczyt danych żądania czyni dynamiczną tylko
 * tę grupę; stałe `/about`, `/o-mnie` i globalny 404 go nie importują.
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
