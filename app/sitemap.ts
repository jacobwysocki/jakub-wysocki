import type { MetadataRoute } from "next";
import { SITE_URL, person } from "@/data/site";

/**
 * Mapa witryny. Strony-wizytówki są tu wymienione osobno i powiązane
 * przez `alternates.languages` — Google dostaje jawny sygnał, że /about
 * i /o-mnie to ta sama treść w dwóch językach, a nie duplikat.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  /**
   * Kody regionalne, nie same językowe — dokładnie te same, którymi
   * `alternates.languages` opisuje strony w <head>. Gdy sitemap mówi "en",
   * a znacznik w HTML "en-GB", Google widzi dwie różne adnotacje hreflang
   * dla tej samej pary URL-i i może odrzucić klaster jako niespójny.
   */
  const entityAlternates = {
    languages: {
      "en-GB": `${SITE_URL}${person.entityHome.en}`,
      "pl-PL": `${SITE_URL}${person.entityHome.pl}`,
      "x-default": `${SITE_URL}${person.entityHome.en}`,
    },
  };

  return [
    {
      // Bez ukośnika, znak w znak jak renderowany canonical
      // (`<link rel="canonical" href="https://jakub-wysocki.com"/>`).
      // Dla samego korzenia pusta ścieżka i "/" są równoważne — RFC 3986
      // §6.2.3, Google i tak je normalizuje — więc chodzi wyłącznie o to,
      // żeby oba miejsca mówiły dosłownie to samo i nie było czego porównywać.
      // Na podstronach równoważność już NIE zachodzi.
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
