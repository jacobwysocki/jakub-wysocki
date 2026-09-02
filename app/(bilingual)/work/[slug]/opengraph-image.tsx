import { notFound } from "next/navigation";
import { findCaseStudy, parseProjectId } from "@/data/case-studies";
import { person } from "@/data/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

type WorkOpengraphImageProps = Readonly<{
  params: Promise<{ slug: string }>;
  id: Promise<string | number>;
}>;

function requirePublishedStudy(slug: string) {
  const projectId = parseProjectId(slug);
  const study = projectId ? findCaseStudy(projectId) : null;
  if (!projectId || study?.slug !== projectId) notFound();
  return { projectId, study };
}

/** Dynamiczny opis obrazu musi nazywać klienta, nie tylko typ strony. */
export function generateImageMetadata({
  params,
}: {
  params: { slug?: string };
}) {
  // Next zbiera dane samej dynamicznej trasy także bez parametrów. Rekord
  // zastępczy opisuje jej kształt; strony z realnym slugiem dostają niżej
  // właściwy identyfikator i alt z nazwą klienta.
  if (!params.slug) {
    return [
      {
        id: "case-study",
        alt: `UX case study | ${person.fullName}`,
        size: OG_SIZE,
        contentType: OG_CONTENT_TYPE,
      },
    ];
  }

  const { projectId, study } = requirePublishedStudy(params.slug);

  return [
    {
      id: projectId,
      alt: `${study.client} UX case study | ${person.fullName}`,
      size: OG_SIZE,
      contentType: OG_CONTENT_TYPE,
    },
  ];
}

/** Ten sam fail-closed kontrakt publikacji co strona i jej statyczne parametry. */
export default async function WorkCaseOpengraphImage({
  params,
  id,
}: WorkOpengraphImageProps) {
  const [{ slug }, imageId] = await Promise.all([params, id]);
  const { projectId, study } = requirePublishedStudy(slug);

  if (imageId !== projectId) notFound();

  return renderOg({
    heading: study.client,
    sub: study.tag.en,
    accentSurface: study.gradient,
  });
}
