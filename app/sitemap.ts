import type { MetadataRoute } from "next";
import { SITE_URL, person } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  // Kody muszą być identyczne z `alternates.languages` w <head> stron
  // wizytówek. Rozjazd "en" vs "en-GB" to dwie sprzeczne adnotacje hreflang
  // dla tej samej pary URL-i.
  const entityAlternates = {
    languages: {
      "en-GB": `${SITE_URL}${person.entityHome.en}`,
      "pl-PL": `${SITE_URL}${person.entityHome.pl}`,
      "x-default": `${SITE_URL}${person.entityHome.en}`,
    },
  };

  // Portret zgłoszony jawnie: to ten sam plik, co Person.image w JSON-LD.
  // Bez tego jedyną ścieżką do niego jest zoptymalizowany /_next/image.
  const portrait = [`${SITE_URL}${person.portrait}`];

  return [
    {
      // Bez ukośnika, znak w znak jak renderowany canonical.
      url: SITE_URL,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      images: portrait,
    },
    {
      url: `${SITE_URL}${person.entityHome.en}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: entityAlternates,
      images: portrait,
    },
    {
      url: `${SITE_URL}${person.entityHome.pl}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
      alternates: entityAlternates,
      images: portrait,
    },
  ];
}
