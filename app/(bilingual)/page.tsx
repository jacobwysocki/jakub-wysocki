import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import About from "@/components/About";
import AskJakubSimple from "@/components/AskJakubSimple";
import Timeline from "@/components/Timeline";
import UltraStudio from "@/components/UltraStudio";
import Extras from "@/components/Extras";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import ModeGate from "@/components/ModeGate";
import LangProvider from "@/components/LangProvider";
import { SITE_URL, person } from "@/data/site";
import { resolveLang } from "@/lib/lang-server";

const HOME_DESCRIPTION = {
  pl: "Software engineer i projektant UX/UI. Współzałożyciel Ultra Studio i Squizzu. .NET, React, systemy projektowe. Kraków, PL.",
  en: "Software engineer & UX/UI designer. Co-founder of Ultra Studio and Squizzu. .NET, React, design systems. Kraków, PL.",
} as const;

/**
 * Metadane podążają za językiem czytelnika tak samo jak treść. Bez ciastka
 * decyduje Accept-Language, a gdy nie wskazuje polskiego — wariant angielski.
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = await resolveLang();
  const title = `${person.fullName} | ${person.jobTitle[lang]}`;
  const description = HOME_DESCRIPTION[lang];

  return {
    title,
    description,
    // Strona główna jest jednym dwujęzycznym URL-em, nie częścią klastra
    // /about ↔ /o-mnie, więc celowo nie deklaruje alternates.languages.
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: person.fullName,
      locale: lang === "pl" ? "pl_PL" : "en_GB",
      alternateLocale: lang === "pl" ? "en_GB" : "pl_PL",
      type: "profile",
      firstName: person.givenName,
      lastName: person.familyName,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/**
 * Treść strony głównej korzysta z tego samego serwerowego wyboru co
 * `<html lang>` w root layout. Dzięki temu pierwszy render dokumentu i body
 * jest spójny; LangProvider przejmuje późniejsze zmiany przełącznikiem.
 */
export default async function Home() {
  const lang = await resolveLang();

  return (
    <LangProvider initialLang={lang}>
      <ModeGate
        simple={
          <>
            <Nav />
            <main id="main" tabIndex={-1} className="focus:outline-none">
              <Hero />
              <About />
              <Timeline />
              <UltraStudio />
              <Extras />
              <Contact />
              {/* Pływający przycisk, nie treść — stoi na końcu, żeby czytnik
                  ekranu nie ogłaszał go w środku toku sekcji. */}
              <AskJakubSimple />
            </main>
            <Footer />
          </>
        }
      />
    </LangProvider>
  );
}
