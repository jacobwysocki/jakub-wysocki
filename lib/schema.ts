import {
  FACTS_UPDATED,
  SITE_URL,
  contactInfo,
  entityProfiles,
  person,
} from "@/data/site";
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
  /** Portret jako osobny węzeł — Person.image i ProfilePage.primaryImageOfPage
   *  wskazują wtedy TEN SAM obrazek, zamiast dwa razy powtarzać ten sam URL. */
  portrait: `${SITE_URL}/#portrait`,
  ultraStudio: `${contactInfo.ultrastudio}/#organization`,
  /**
   * Drugi współzałożyciel Ultra Studio. Węzeł jest definiowany w grafie
   * site-wide `ultrastud.io`, tu występuje wyłącznie jako referencja — stąd
   * brak `name`. Pisownia nazwiska jest w notatkach źródłowych oznaczona jako
   * odczytana z adresu LinkedIna i niezweryfikowana, a fałszywe `name` przy
   * poprawnym `@id` byłoby gorsze niż samo `@id`.
   */
  ultraStudioCoFounder: `${contactInfo.ultrastudio}/#filip-mazur`,
  squizzu: `${contactInfo.squizzu}/#organization`,
  /** Strona-wizytówka uznana za kanoniczną (ta sama, co x-default w hreflang). */
  profilePage: `${SITE_URL}${person.entityHome.en}#profilepage`,
} as const;

/**
 * Profile, które Google ma uznać za tę samą osobę. Wyprowadzone z
 * `entityProfiles`, wspólnego źródła z widocznymi linkami na wizytówkach —
 * dopisuj tam, nie tutaj.
 *
 * Filtr po `identity` wycina adresy firm. Ten sam dokument definiuje niżej
 * węzły Organization o dokładnie tych URL-ach, więc trzymanie ich w `sameAs`
 * mówiło wprost „ta osoba JEST tą witryną" — modelowy sposób na sklejenie
 * jednoosobowego założyciela z jego firmą. Relację niesie `worksFor`
 * i `founder`; wizytówki dalej pokazują wszystkie sześć linków.
 */
const sameAs: string[] = entityProfiles
  .filter((p) => p.identity)
  .map((p) => p.href);

/**
 * Portret jako pełny ImageObject, a nie goły string. Sam URL nie niesie
 * wymiarów ani podpisu, więc wyszukiwarka grafiki nie wie, czy nadaje się
 * do wyświetlenia, a węzeł bez `@id` nie da się wskazać z drugiego miejsca.
 * Wymiary są odczytane z pliku (data/site.ts → person.portraitSize).
 *
 * Adres pozostaje zwykłym URL-em do pliku w /public, nie adresem
 * optymalizatora Next (/_next/image?...) — tamten nie przypisze się do encji.
 */
const portraitUrl = `${SITE_URL}${person.portrait}`;

const portraitNode = {
  "@type": "ImageObject",
  "@id": ID.portrait,
  url: portraitUrl,
  contentUrl: portraitUrl,
  width: person.portraitSize.width,
  height: person.portraitSize.height,
  caption: person.fullName,
};

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
  image: portraitNode,
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
  /**
   * Dyplom plus certyfikaty. Wszystkie mają wystawcę w `recognizedBy`, bo to
   * on odróżnia fakt potwierdzony przez kogoś z zewnątrz od deklaracji o sobie
   * — a takich, niezależnie udokumentowanych faktów ta encja ma niewiele.
   *
   * Lista certyfikatów jest wyprowadzona z data/education.ts, tej samej, którą
   * renderują wizytówki i Extras. Wpisana tu na sztywno rozjeżdżałaby się
   * z widoczną treścią przy pierwszej zmianie.
   */
  hasCredential: [
    {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "degree",
      educationalLevel: "BSc",
      name: `${education.degree.title.en} (${education.degree.grade.en})`,
      recognizedBy: {
        "@type": "CollegeOrUniversity",
        name: education.degree.school,
      },
    },
    ...education.certifications.map((cert) => ({
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "certificate",
      name: cert.name,
      recognizedBy: {
        "@type": "Organization",
        name: cert.issuer.name,
        sameAs: cert.issuer.sameAs,
      },
    })),
  ],
  // Jedyny fakt o tej osobie z zewnętrznym, niezależnym udokumentowaniem —
  // ogłosił go ktoś inny. Do tej pory żył wyłącznie w prozie
  // data/experience.ts, więc dla maszyn nie istniał.
  award: "Best New E-commerce — Premios eCommerce MX 2024 (Safetystore.mx)",
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
    /**
     * Znak marki z /public/app-icons — ten sam plik, którym renderują się
     * kafelki na pulpicie. Uwaga: to wersja biała, przygotowana pod ciemne
     * tło; jeśli kiedyś powstanie wariant kontrastowy, `logo` powinno
     * wskazywać właśnie na niego.
     */
    logo: `${SITE_URL}/app-icons/us-icon.svg`,
    foundingDate: "2024-08",
    /**
     * Dwóch założycieli, nie jeden. `ultrastud.io` deklaruje drugiego
     * współzałożyciela pod stabilnym `@id`, więc wersja z samym Jakubem
     * sprawiała, że dwie domeny mówiły o tej samej firmie co innego —
     * a sprzeczność między dokumentami jest dokładnie tym, co kasuje zaufanie
     * do encji. Sama referencja, bez `name`: patrz komentarz przy ID.
     */
    founder: [{ "@id": ID.person }, { "@id": ID.ultraStudioCoFounder }],
    /**
     * Konto, do którego studio linkuje z własnej witryny (/, /o-nas,
     * /kontakt) — czyli potwierdzone przez samą organizację, a nie zgadnięte.
     */
    sameAs: ["https://www.instagram.com/ultrastud.io/"],
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
    description: "Gamified IT learning and interview-preparation platform.",
    logo: `${SITE_URL}/app-icons/squizzu-icon.svg`,
    foundingDate: "2024-07",
    founder: { "@id": ID.person },
    // Sama aplikacja stoi na osobnej subdomenie i jest drugą powierzchnią
    // tej samej organizacji — bez tego graf opisuje wyłącznie witrynę
    // wizerunkową i nie wie o produkcie.
    sameAs: [contactInfo.squizzuApp],
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
        // Nazwa i domena brzmią inaczej, a w wynikach wyszukiwania Google
        // wybiera jedną z nich jako „site name". Bez tego pola wybiera sam.
        alternateName: new URL(SITE_URL).hostname,
        // Opis witryny, nie osoby — biogram niesie już węzeł Person, a dwa
        // węzły z tym samym `description` to zmarnowany sygnał. Składany
        // z pól `person`, żeby nie powstało trzecie miejsce z tymi faktami.
        description: `Personal website and portfolio of ${person.fullName}, ${person.jobTitle.en}, based in ${person.locality}, Poland.`,
        inLanguage: ["pl-PL", "en-GB"],
        /**
         * `about` to jedyne pole, które mówi wprost „ta witryna JEST o tej
         * osobie". Samo `publisher` znaczy tylko tyle, że osoba ją wydaje —
         * tak samo wyglądałby firmowy blog. `copyrightHolder` domyka
         * własność: na witrynie-encji autor, wydawca i właściciel praw to
         * ten sam byt, i lepiej, żeby powiedział to dokument, niż żeby
         * crawler zgadywał.
         */
        about: { "@id": ID.person },
        publisher: { "@id": ID.person },
        copyrightHolder: { "@id": ID.person },
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
        // Referencja, nie kopia: węzeł ImageObject jest już w tym dokumencie
        // (Person.image z siteGraph), więc wizytówka i osoba wskazują
        // dosłownie ten sam obrazek.
        primaryImageOfPage: { "@id": ID.portrait },
        // Data z data/site.ts, utrzymywana ręcznie razem z faktami. Celowo
        // nie `new Date()`: to stemplowałoby czas builda i po każdym deployu
        // wizytówka twierdziłaby, że fakty o osobie się zmieniły.
        dateModified: FACTS_UPDATED,
      },
    ],
  };
}
