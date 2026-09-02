import type { Metadata } from "next";
import EntityHome from "@/components/EntityHome";
import JsonLd from "@/components/JsonLd";
import { person } from "@/data/site";
import { profilePageGraph } from "@/lib/schema";

/**
 * Angielska strona-wizytówka. Para z /o-mnie przez hreflang; canonical
 * wskazuje na siebie, więc obie wersje indeksują się osobno.
 */
export const metadata: Metadata = {
  title: `About ${person.fullName}`,
  description: person.bio.en,
  alternates: {
    canonical: person.entityHome.en,
    languages: {
      "en-GB": person.entityHome.en,
      "pl-PL": person.entityHome.pl,
      "x-default": person.entityHome.en,
    },
  },
  openGraph: {
    title: `About ${person.fullName}`,
    description: person.bio.en,
    url: person.entityHome.en,
    type: "profile",
    locale: "en_GB",
  },
  // Bez tego twitter dziedziczy się z korzenia w całości i wizytówka
  // zapowiadałaby się tytułem strony głównej. `images` doklei Next
  // z app/about/opengraph-image.tsx.
  twitter: {
    title: `About ${person.fullName}`,
    description: person.bio.en,
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={profilePageGraph("en")} />
      <EntityHome lang="en" />
    </>
  );
}
