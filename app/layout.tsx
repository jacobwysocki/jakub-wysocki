import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import JsonLd from "@/components/JsonLd";
import { MODE_INIT_SCRIPT } from "@/lib/mode-store";
import { SITE_URL, person } from "@/data/site";
import { resolveLang } from "@/lib/lang-server";
import { siteGraph } from "@/lib/schema";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const TITLE = "Jakub Wysocki | Software Engineer & UX/UI Designer";
const DESCRIPTION =
  "Software engineer & UX/UI designer. Co-founder of Ultra Studio and Squizzu. .NET, React, design systems. Kraków, PL.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // Nazwa własna zamiast sluga repo — to ona pokazuje się w wynikach
  // wyszukiwania i podglądach linków.
  applicationName: person.fullName,
  authors: [{ name: person.fullName, url: SITE_URL }],
  creator: person.fullName,
  publisher: person.fullName,
  // Bez alternates.languages: strona główna jest jednym dwujęzycznym URL-em,
  // przełączanym po stronie klienta, a nie tłumaczeniem /about. Wpisanie jej
  // do klastra hreflang tworzyłoby relację nieodwzajemnioną (/about i /o-mnie
  // wskazują tylko na siebie), którą Google odrzuca — a w najgorszym razie
  // uznaje / i /about za duplikaty i konsoliduje do jednego.
  alternates: {
    canonical: "/",
  },
  // Obrazek OG dokleja się sam z app/opengraph-image.tsx
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: person.fullName,
    locale: "pl_PL",
    // en_GB, nie en_US — zgodnie z hreflang i inLanguage w danych strukturalnych
    alternateLocale: "en_GB",
    type: "profile",
    firstName: person.givenName,
    lastName: person.familyName,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  // Pasek przeglądarki mobilnej w kolorze jasnego prostego widoku — to on
  // jest pierwszą klatką każdej wizyty. Pulpit jest przełącznikiem po
  // stronie klienta, więc nie ma jak wpłynąć na meta w dokumencie i nie
  // ma sensu, żeby to on dyktował kolor paska.
  themeColor: "#FBFBFD",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await resolveLang();

  return (
    // Ten sam wybór serwera zasila treść dwujęzycznych tras, więc dokument
    // i body deklarują jeden język już w pierwszym HTML-u. Odczyt ciastka w
    // root layout świadomie czyni aplikację dynamiczną.
    <html lang={lang} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Ustala tryb widoku (prosty/pulpit) przed pierwszym paintem — bez migania */}
        <script dangerouslySetInnerHTML={{ __html: MODE_INIT_SCRIPT }} />
        {/* Języka nie ustala skrypt: rozstrzyga go tutaj serwer z ciastka albo
            Accept-Language. LangProvider dostaje ten sam wybór, a po zmianie
            przełącznikiem utrzymuje atrybut bez konkurencyjnej heurystyki. */}

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
