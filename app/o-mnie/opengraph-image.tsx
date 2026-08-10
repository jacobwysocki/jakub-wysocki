import { person } from "@/data/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${person.fullName} | ${person.jobTitle.pl}`;

/** Polski wariant obrazka OG wizytówki — patrz app/about/opengraph-image.tsx. */
export default function OMnieOpengraphImage() {
  return renderOg({ heading: person.fullName, sub: person.jobTitle.pl });
}
