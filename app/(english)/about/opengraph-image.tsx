import { person } from "@/data/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${person.fullName} | ${person.jobTitle.en}`;

/**
 * Własny obrazek OG wizytówki. Bez niego /about nie miałoby żadnego:
 * segment eksportuje `openGraph`, co podmienia rozwiązany obiekt z korzenia
 * w całości, razem z jego `images`.
 */
export default function AboutOpengraphImage() {
  return renderOg({ heading: person.fullName, sub: person.jobTitle.en });
}
