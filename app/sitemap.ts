import type { MetadataRoute } from "next";
import { SITE_URL, person } from "@/data/site";

/**
 * Mapa witryny. Strony-wizytówki są tu wymienione osobno i powiązane
 * przez `alternates.languages` — Google dostaje jawny sygnał, że /about
 * i /o-mnie to ta sama treść w dwóch językach, a nie duplikat.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const entityAlternates = {
    languages: {
      en: `${SITE_URL}${person.entityHome.en}`,
      pl: `${SITE_URL}${person.entityHome.pl}`,
      "x-default": `${SITE_URL}${person.entityHome.en}`,
    },
  };

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}${person.entityHome.en}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: entityAlternates,
    },
    {
      url: `${SITE_URL}${person.entityHome.pl}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: entityAlternates,
    },
  ];
}
