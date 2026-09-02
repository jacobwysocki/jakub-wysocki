import { notFound } from "next/navigation";
import { findCaseStudy, parseProjectId } from "@/data/case-studies";
import { person } from "@/data/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `UX case study | ${person.fullName}`;

type WorkOpengraphImageProps = Readonly<{
  params: Promise<{ slug: string }>;
}>;

/**
 * Ten sam kontrakt publikacji co generateStaticParams strony: poprawny
 * ProjectId nie wystarcza, dopóki Partial caseStudies nie ma zgodnego rekordu.
 */
export default async function WorkCaseOpengraphImage({
  params,
}: WorkOpengraphImageProps) {
  const { slug } = await params;
  const projectId = parseProjectId(slug);
  const study = projectId ? findCaseStudy(projectId) : null;

  if (!projectId || study?.slug !== projectId) notFound();

  return renderOg({
    heading: study.client,
    sub: study.tag.en,
    accentSurface: study.gradient,
  });
}
