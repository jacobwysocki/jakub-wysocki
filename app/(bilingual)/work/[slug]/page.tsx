import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CaseStudyBody from "@/components/case-study/CaseStudyBody";
import Footer from "@/components/Footer";
import LangProvider from "@/components/LangProvider";
import Nav from "@/components/Nav";
import {
  PROJECT_IDS,
  findCaseStudy,
  parseProjectId,
  type ProjectId,
  type UxCaseStudy,
} from "@/data/case-studies";
import { person } from "@/data/site";
import { encodePortfolioLocation } from "@/features/portfolio-navigation";
import { resolveLang } from "@/lib/lang-server";

type WorkPageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

type PublishedStudy = Readonly<{
  projectId: ProjectId;
  study: UxCaseStudy;
}>;

function findPublishedStudy(value: string): PublishedStudy | undefined {
  const projectId = parseProjectId(value);
  if (!projectId) return undefined;

  const study = findCaseStudy(projectId);
  return study?.slug === projectId ? { projectId, study } : undefined;
}

function requirePublishedStudy(value: string): PublishedStudy {
  const published = findPublishedStudy(value);
  if (!published) notFound();
  return published;
}

function canonicalWorkHref(projectId: ProjectId): `/work/${ProjectId}` {
  const href = encodePortfolioLocation({ area: "project", projectId });
  const expected = `/work/${projectId}` as const;
  if (href !== expected) notFound();
  return expected;
}

export function generateStaticParams(): { slug: ProjectId }[] {
  return PROJECT_IDS.flatMap((projectId) =>
    findPublishedStudy(projectId) ? [{ slug: projectId }] : [],
  );
}

export async function generateMetadata({
  params,
}: WorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { projectId, study } = requirePublishedStudy(slug);
  const canonical = canonicalWorkHref(projectId);
  // Metadane mówią językiem czytelnika, tak jak treść i <html lang>.
  // Bez ciastka decyduje Accept-Language; inne języki wpadają w EN.
  const lang = await resolveLang();
  const title =
    lang === "pl"
      ? `${study.client}: studium przypadku UX | ${person.fullName}`
      : `${study.client} UX case study | ${person.fullName}`;
  const description = study.problem[lang];

  return {
    title,
    description,
    // Jeden dwujęzyczny URL, więc bez klastra hreflang. Canonical wskazuje
    // na kanoniczny slug i przez metadataBase trafia na domenę apex.
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: person.fullName,
      locale: lang === "pl" ? "pl_PL" : "en_GB",
      alternateLocale: lang === "pl" ? "en_GB" : "pl_PL",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const { projectId, study } = requirePublishedStudy(slug);
  const canonical = canonicalWorkHref(projectId);

  // Alias danych nie staje się drugim publicznym URL-em. Stałe 308 skupia
  // historię indeksowania i linków na jednym, samokanonicznym adresie.
  if (slug !== projectId) permanentRedirect(canonical);

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
          <CaseStudyBody study={study} />
        </main>
        <Footer linkSectionsToHome />
      </div>
    </LangProvider>
  );
}
