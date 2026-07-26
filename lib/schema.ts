import { SITE_URL, contactInfo, person } from "@/data/site";
import { education } from "@/data/education";
import type { Lang } from "@/lib/lang-store";

/**
 * Dane strukturalne JSON-LD — to one mówią Google'owi, że wszystkie te
 * profile należą do JEDNEJ osoby. Bez tego crawler widzi zbiór
 * niepowiązanych linków; z tym — kandydata na encję w Knowledge Graphie.
 *
 * Konstrukcja opiera się na @id: każdy węzeł ma stabilny identyfikator
 * (URL z fragmentem), dzięki czemu Person, Organization i strony mogą się
 * wzajemnie referencjonować zamiast duplikować dane.
 */

/** Stabilne identyfikatory encji — nie zmieniaj ich po publikacji. */
export const ID = {
  person: `${SITE_URL}/#person`,
  website: `${SITE_URL}/#website`,
  ultraStudio: `${contactInfo.ultrastudio}/#organization`,
  squizzu: `${contactInfo.squizzu}/#organization`,
  /** Strona-wizytówka uznana za kanoniczną (ta sama, co x-default w hreflang). */
  profilePage: `${SITE_URL}${person.entityHome.en}#profilepage`,
} as const;

/**
 * sameAs — najważniejsze pole całego pliku. Lista profili, które Google
 * ma potraktować jako TĘ SAMĄ osobę. Dopisuj tu każdy nowy zweryfikowany
 * profil (Wikidata, ORCID, Crunchbase, X, YouTube).
 */
const sameAs: string[] = [
  contactInfo.linkedin,
  contactInfo.github,
  contactInfo.behance,
  contactInfo.stackoverflow,
  contactInfo.ultrastudio,
  contactInfo.squizzu,
];

/**
 * Węzeł osoby — JEDNA definicja, identyczna na każdym URL-u serwisu.
 *
 * Celowo nie jest tłumaczony. Węzeł ma stały @id, więc gdyby każda wersja
 * językowa opisywała go innym `description`/`jobTitle`, crawler dostałby dwa
 * sprzeczne zestawy faktów o tej samej encji i sam wybierałby zwycięzcę.
 * Powtarzalność jest tu warta więcej niż lokalizacja: polską wersję biografii
 * niesie widoczna treść /o-mnie oraz `inLanguage` na węźle ProfilePage.
 * Wariant angielski, bo to on jest x-default i zgadza się z LinkedInem.
 */
const personNode = {
  "@type": "Person",
  "@id": ID.person,
  name: person.fullName,
  givenName: person.givenName,
  familyName: person.familyName,
  url: SITE_URL,
  mainEntityOfPage: { "@id": ID.profilePage },
  image: `${SITE_URL}${person.portrait}`,
  description: person.bio.en,
  jobTitle: person.jobTitle.en,
  // Oba adresy: prywatny i ten podawany klientom (widoczny też na LinkedInie).
  // Rozbieżność między profilami osłabiałaby dopasowanie encji.
  email: [`mailto:${contactInfo.email}`, `mailto:${contactInfo.emailAlt}`],
  /**
   * jobTitle to jeden, rozpoznawalny tytuł — hasOccupation niesie pełny
   * zakres, w tym branding, którego „UX/UI Designer" sam nie pokrywa.
   * occupationalCategory w taksonomii O*NET-SOC daje maszynom punkt
   * zaczepienia niezależny od brzmienia tytułu.
   */
  hasOccupation: [
    {
      "@type": "Occupation",
      name: "Software Engineer",
      occupationalCategory: "15-1252.00",
      skills: ".NET, C#, Node.js, React, Next.js, TypeScript, Microsoft Azure",
    },
    {
      "@type": "Occupation",
      name: "UX/UI Designer",
      occupationalCategory: "15-1255.00",
      skills: "User experience design, user interface design, design systems",
    },
    {
      "@type": "Occupation",
      name: "Brand Identity Designer",
      occupationalCategory: "27-1024.00",
      skills: "Brand identity design, visual identity design, art direction",
    },
  ],
  nationality: { "@type": "Country", name: "Poland" },
  homeLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: person.locality,
      addressCountry: person.country,
    },
  },
  worksFor: [{ "@id": ID.ultraStudio }, { "@id": ID.squizzu }],
  alumniOf: [
    {
      "@type": "CollegeOrUniversity",
      name: education.degree.school,
      sameAs: "https://www.northumbria.ac.uk/",
    },
    {
      "@type": "EducationalOrganization",
      name: education.bootcamp.school,
      sameAs: "https://barcelonacodeschool.com/",
    },
  ],
  hasCredential: {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "degree",
    educationalLevel: "BSc",
    name: `${education.degree.title.en} (${education.degree.grade.en})`,
    recognizedBy: {
      "@type": "CollegeOrUniversity",
      name: education.degree.school,
    },
  },
  knowsAbout: person.knowsAbout,
  knowsLanguage: [
    { "@type": "Language", name: "Polish", alternateName: "pl" },
    { "@type": "Language", name: "English", alternateName: "en" },
    { "@type": "Language", name: "Spanish", alternateName: "es" },
  ],
  sameAs,
};

const organizationNodes = [
  {
    "@type": "Organization",
    "@id": ID.ultraStudio,
    name: "Ultra Studio",
    url: contactInfo.ultrastudio,
    description:
      "Creative studio for high-end branding, web design and custom development, working remotely from Kraków and Warsaw, Poland.",
    email: `mailto:${contactInfo.emailAlt}`,
    foundingDate: "2024-08",
    founder: { "@id": ID.person },
    /**
     * Dwa `location` zamiast jednego `address`. Studio nie jest zarejestrowane
     * i pracuje rozproszone (Kraków i Warszawa), więc pojedynczy PostalAddress
     * twierdziłby siedzibę, której nie ma, i kłóciłby się z LinkedInem.
     * `Person.homeLocation` zostaje Krakowem, bo to fakt o osobie.
     */
    location: [
      {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: person.locality,
          addressCountry: person.country,
        },
      },
      {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Warsaw",
          addressCountry: "PL",
        },
      },
    ],
  },
  {
    "@type": "Organization",
    "@id": ID.squizzu,
    name: "Squizzu",
    url: contactInfo.squizzu,
    description:
      "Gamified IT learning and interview-preparation platform.",
    foundingDate: "2024-07",
    founder: { "@id": ID.person },
  },
];

/**
 * Graf dla strony głównej: witryna + osoba + firmy.
 * Renderowany w app/layout.tsx, więc trafia do HTML-a każdej podstrony.
 */
export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": ID.website,
        url: SITE_URL,
        name: person.fullName,
        inLanguage: ["pl-PL", "en-GB"],
        publisher: { "@id": ID.person },
      },
      personNode,
      ...organizationNodes,
    ],
  };
}

/**
 * Graf strony-wizytówki (/about, /o-mnie). ProfilePage to typ, którego
 * Google używa wprost do rozpoznawania stron „o osobie" — mocniejszy
 * sygnał niż zwykły WebPage.
 *
 * Sam węzeł osoby nie jest tu powtarzany: strony-wizytówki siedzą w root
 * layoucie, więc `siteGraph()` już go wstrzyknęło do tego samego dokumentu.
 * Wystarczy referencja przez @id — dublowanie definicji groziłoby rozjazdem.
 */
export function profilePageGraph(lang: Lang) {
  const url = `${SITE_URL}${person.entityHome[lang]}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${url}#profilepage`,
        url,
        name: `${person.fullName} | ${person.jobTitle[lang]}`,
        description: person.bio[lang],
        inLanguage: lang === "pl" ? "pl-PL" : "en-GB",
        isPartOf: { "@id": ID.website },
        about: { "@id": ID.person },
        mainEntity: { "@id": ID.person },
      },
    ],
  };
}
