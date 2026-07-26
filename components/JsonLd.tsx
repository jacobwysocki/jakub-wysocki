/**
 * Wstrzykuje graf JSON-LD do HTML-a. Komponent serwerowy — dane
 * strukturalne trafiają do źródła strony, więc widzi je każdy crawler,
 * także ten, który nie wykonuje JavaScriptu.
 */
export default function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify bez formatowania; `<` uciekamy, żeby zamknięty
      // tag w treści nie mógł rozbić skryptu.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
