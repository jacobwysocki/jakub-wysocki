import type { Metadata } from "next";
import EntityHome from "@/components/EntityHome";
import JsonLd from "@/components/JsonLd";
import { person } from "@/data/site";
import { profilePageGraph } from "@/lib/schema";

/**
 * Polska strona-wizytówka. Bliźniacza do /about — ta sama treść, jeden
 * język na URL, powiązane przez hreflang.
 */
export const metadata: Metadata = {
  title: `${person.fullName} — ${person.jobTitle.pl}`,
  description: person.bio.pl,
  alternates: {
    canonical: person.entityHome.pl,
    languages: {
      "pl-PL": person.entityHome.pl,
      "en-GB": person.entityHome.en,
      "x-default": person.entityHome.en,
    },
  },
  openGraph: {
    title: `${person.fullName} — ${person.jobTitle.pl}`,
    description: person.bio.pl,
    url: person.entityHome.pl,
    type: "profile",
    locale: "pl_PL",
  },
};

export default function OMniePage() {
  return (
    <>
      <JsonLd data={profilePageGraph("pl")} />
      <EntityHome lang="pl" />
    </>
  );
}
