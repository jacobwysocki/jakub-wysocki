import type { Metadata } from "next";
import Footer from "@/components/Footer";
import LangProvider from "@/components/LangProvider";
import Nav from "@/components/Nav";
import WorkIndex from "@/components/case-study/WorkIndex";
import { person } from "@/data/site";
import { resolveLang } from "@/lib/lang-server";

/**
 * Indeks case studies: adres, który wystarczy wysłać rekruterowi.
 * Jeden dwujęzyczny URL jak reszta /work — bez klastra hreflang,
 * kanoniczny przez metadataBase (patrz app/work/[slug]/page.tsx).
 */
export async function generateMetadata(): Promise<Metadata> {
  // Jak na stronach case'ów: metadane w języku czytelnika. Bez ciastka
  // decyduje Accept-Language, z angielskim fallbackiem dla pozostałych.
  const lang = await resolveLang();
  const title =
    lang === "pl"
      ? `Realizacje UX | ${person.fullName}`
      : `UX case studies | ${person.fullName}`;
  const description =
    lang === "pl"
      ? "Sześć realizacji UX/UI opisanych tak, jak powstawały: problem, decyzje projektowe z uzasadnieniem i rozwiązanie, a tam, gdzie dało się to zmierzyć, także wynik."
      : "Six UX/UI case studies told the way they were built: the problem, the design decisions with their rationale and the solution, and, where it could be measured, the outcome.";

  return {
    title,
    description,
    alternates: { canonical: "/work" },
    openGraph: {
      title,
      description,
      url: "/work",
      siteName: person.fullName,
      locale: lang === "pl" ? "pl_PL" : "en_GB",
      alternateLocale: lang === "pl" ? "en_GB" : "pl_PL",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function WorkIndexPage() {
  const lang = await resolveLang();

  return (
    <LangProvider initialLang={lang}>
      <div id="top" className="min-h-screen bg-surface text-ink">
        <Nav linkSectionsToHome />
        <main
          id="main"
          tabIndex={-1}
          className="min-h-screen pt-16 focus:outline-none"
        >
          <WorkIndex />
        </main>
        <Footer linkSectionsToHome />
      </div>
    </LangProvider>
  );
}
