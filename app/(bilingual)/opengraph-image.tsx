import { person } from "@/data/site";
import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${person.fullName} | ${person.jobTitle.en}`;

/** Podgląd linku strony głównej. Generowany raz w buildzie. */
export default function OpengraphImage() {
  return renderOg({ heading: person.fullName, sub: person.jobTitle.en });
}
