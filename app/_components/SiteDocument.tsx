import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import JsonLd from "@/components/JsonLd";
import { MODE_INIT_SCRIPT } from "@/lib/mode-store";
import { SITE_URL, person } from "@/data/site";
import { siteGraph } from "@/lib/schema";
import type { Lang } from "@/lib/lang";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

/** Wspólne dane wydawcy; metadane strony należą do konkretnej trasy. */
export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Nazwa własna zamiast sluga repo — to ona pokazuje się w wynikach
  // wyszukiwania i podglądach linków.
  applicationName: person.fullName,
  authors: [{ name: person.fullName, url: SITE_URL }],
  creator: person.fullName,
  publisher: person.fullName,
};

export const siteViewport: Viewport = {
  // Pasek przeglądarki mobilnej w kolorze jasnego prostego widoku — to on
  // jest pierwszą klatką każdej wizyty. Pulpit jest przełącznikiem po
  // stronie klienta, więc nie ma jak wpłynąć na meta w dokumencie i nie
  // ma sensu, żeby to on dyktował kolor paska.
  themeColor: "#FBFBFD",
};

/**
 * Wspólny dokument trzech root layoutów. Sam nie czyta żądania, dzięki czemu
 * warianty EN i PL pozostają statyczne; tylko layout (bilingual) rozstrzyga
 * język z ciastka lub Accept-Language.
 */
export default function SiteDocument({
  lang,
  initializeMode = false,
  children,
}: Readonly<{
  lang: Lang;
  initializeMode?: boolean;
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={lang}
      className={inter.variable}
      suppressHydrationWarning={initializeMode}
    >
      <head>
        {initializeMode ? (
          <>
            {/* Ustala tryb widoku przed pierwszym paintem — bez migania. */}
            <script dangerouslySetInnerHTML={{ __html: MODE_INIT_SCRIPT }} />
            {/* Język rozstrzyga serwer. LangProvider dostaje ten sam wybór,
                więc nie ma konkurencyjnej heurystyki przed hydratacją. */}
          </>
        ) : null}

        <JsonLd data={siteGraph()} />
      </head>
      <body className="font-sans">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
