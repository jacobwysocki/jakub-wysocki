import { person } from "@/data/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `UX case studies | ${person.fullName}`;

/** Podgląd linku indeksu wszystkich opublikowanych case studies. */
export default function WorkOpengraphImage() {
  return renderOg({ heading: "UX case studies", sub: person.fullName });
}
