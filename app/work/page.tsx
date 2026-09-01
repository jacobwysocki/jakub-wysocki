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
export const metadata: Metadata = {
  title: `UX case studies | ${person.fullName}`,
  description:
    "Six UX/UI case studies told the way they were built: the problem, the design decisions with their rationale, the solution and an honest outcome.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: `UX case studies | ${person.fullName}`,
    description:
      "Six UX/UI case studies: problem, design decisions, solution, honest outcomes.",
    url: "/work",
    siteName: person.fullName,
    locale: "pl_PL",
    alternateLocale: "en_GB",
    type: "website",
  },
};

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
