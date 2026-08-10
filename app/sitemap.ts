import type { MetadataRoute } from "next";
import { FACTS_UPDATED, SITE_URL, person } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  // Data utrzymywana ręcznie, nie `new Date()`. Ta trasa jest statyczna, więc
  // `new Date()` zamrażał czas builda i wszystkie trzy adresy dostawały ten
  // sam znacznik przy każdym deployu — także przy poprawce CSS. Google
  // przestaje ufać źródłom `lastmod`, które przyłapie na takim szumie, a wtedy
  // traci się sygnał również wtedy, gdy naprawdę coś się zmieni.
  const lastModified = FACTS_UPDATED;

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
