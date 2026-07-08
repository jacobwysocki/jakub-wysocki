import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { MODE_INIT_SCRIPT } from "@/lib/mode-store";
import { LANG_INIT_SCRIPT } from "@/lib/lang-store";
import { SITE_URL } from "@/data/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const TITLE = "Jakub Wysocki — Software Engineer & UX/UI Designer";
const DESCRIPTION =
  "Software engineer & UX/UI designer. Co-founder of Ultra Studio and Squizzu. .NET, React, design systems — Kraków, PL.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // Obrazek OG dokleja się sam z app/opengraph-image.tsx
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "jakub-wysocki",
    locale: "pl_PL",
    alternateLocale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  // Pasek przeglądarki mobilnej w kolorze ciemnego hero/pulpitu
  themeColor: "#0A0A0C",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Ustala tryb widoku (prosty/pulpit) przed pierwszym paintem — bez migania */}
        <script dangerouslySetInnerHTML={{ __html: MODE_INIT_SCRIPT }} />
        {/* Ustala język (PL/EN) — zapis użytkownika albo navigator.language */}
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT_SCRIPT }} />
      </head>
      <body className="font-sans">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
