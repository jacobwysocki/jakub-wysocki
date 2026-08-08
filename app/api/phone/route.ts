export const dynamic = "force-dynamic";

/**
 * Numer telefonu nie istnieje w repo ani w statycznym HTML/JS —
 * serwer zwraca go dopiero na żądanie (klik "Pokaż numer").
 * Brak CONTACT_PHONE = telefon znika z całej strony.
 */
export function GET() {
  const number = process.env.CONTACT_PHONE;
  if (!number) return new Response(null, { status: 404 });
  return Response.json({
    number,
    href: `tel:${number.replace(/[^+\d]/g, "")}`,
  });
}
