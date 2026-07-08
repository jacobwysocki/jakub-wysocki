import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { MODE_INIT_SCRIPT } from "@/lib/mode-store";
import { LANG_INIT_SCRIPT } from "@/lib/lang-store";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jakub Wysocki — Software Engineer & UX/UI Designer",
  description:
    "Software engineer & UX/UI designer. Co-founder of Ultra Studio and Squizzu. .NET, React, design systems — Kraków, PL.",
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
      </body>
    </html>
  );
}
