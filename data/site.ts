import type { L10n } from "@/lib/lang-store";

/**
 * Publiczny adres produkcyjny — bazowy URL dla metadanych OG, robots
 * i sitemap. Po podpięciu własnej domeny ustaw NEXT_PUBLIC_SITE_URL
 * w env Vercela (albo podmień fallback).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jakub-wysocki.com";

/**
 * Realne dane kontaktowe i linki — jedno źródło prawdy dla obu trybów
 * (prosty layout, tryb pulpitu), menu systemowych, stopki i mailto.
 */
export const contactInfo = {
  email: "wysockijakub00@gmail.com",
  emailAlt: "jakub@ultrastud.io",
  location: "Kraków, PL",
  timezone: "Europe/Warsaw",
  linkedin: "https://www.linkedin.com/in/jakub-wysocki00",
  github: "https://github.com/jacobwysocki",
  behance: "https://www.behance.net/jakub-wysocki",
  stackoverflow: "https://stackoverflow.com/users/14391216/jakub-wysocki",
  droneRepo: "https://github.com/jacobwysocki/drone-path-optimization",
  droneLive: "https://jacobwysocki.github.io/drone-path-optimization/",
  squizzu: "https://www.squizzu.com",
  squizzuApp: "https://app.squizzu.com",
  ultrastudio: "https://ultrastud.io",
} as const;

/**
 * Profile reprezentujące tę samą osobę — JEDNA lista dla dwóch odbiorców:
 * tablicy `sameAs` w danych strukturalnych (lib/schema.ts) i widocznych
 * linków `rel="me"` na wizytówkach (components/EntityHome.tsx). Zgodność
 * jednego z drugim jest dla Google osobnym sygnałem.
 *
 * Wcześniej były to dwie osobne listy i rozjazd między nimi przechodził
 * niezauważony: dopisanie profilu w jednym miejscu nie wywala ani `tsc`,
 * ani builda. Przy jednym źródle rozjazd jest niemożliwy, nie tylko
 * wykrywalny — dlatego zamiast testu jest to.
 *
 * Dopisuj tu każdy nowy zweryfikowany profil (Wikidata, ORCID, Crunchbase).
 * `label` jest tekstem linku na wizytówce, więc nie jest tłumaczony:
 * nazwy własne serwisów brzmią tak samo w obu językach.
 */
export const entityProfiles = [
  { label: "LinkedIn", href: contactInfo.linkedin },
  { label: "GitHub", href: contactInfo.github },
  { label: "Behance", href: contactInfo.behance },
  { label: "Stack Overflow", href: contactInfo.stackoverflow },
  { label: "Ultra Studio", href: contactInfo.ultrastudio },
  { label: "Squizzu", href: contactInfo.squizzu },
] as const;

export const site = {
  // Nazwa własna, nie slug repo — ta wartość jest marką w nawigacji, więc
  // to ona odpowiada za obecność frazy „Jakub Wysocki" w widocznej treści
  // strony głównej. Wcześniej nazwisko było tylko w stopce i w JSON-LD.
  // Ta sama decyzja co przy `applicationName` w app/layout.tsx.
  name: "Jakub Wysocki",
  studio: "Ultra Studio",
  hero: {
    headline: {
      pl: "Buduję marki i oprogramowanie.",
      en: "I build brands and software.",
    } satisfies L10n,
    subline: {
      pl: "Software engineer i projektant UX/UI. Współzałożyciel Ultra Studio i Squizzu.",
      en: "Software engineer & UX/UI designer. Co-founder of Ultra Studio and Squizzu.",
    } satisfies L10n,
    /** Te same fakty mają osobno wartość oraz etykietę kompaktową i pełną.
     *  Mobile dostaje krótki pas metryk, a desktop zachowuje dotychczasowe
     *  zdania bez utrzymywania dwóch niezależnych zestawów faktów. */
    facts: [
      {
        value: { pl: "5 lat", en: "5 years" },
        label: { pl: "doświadczenia", en: "of experience" },
        compactLabel: { pl: "doświadczenia", en: "experience" },
      },
      {
        value: { pl: "PL · UK · MX", en: "PL · UK · MX" },
        label: { pl: "", en: "" },
        compactLabel: {
          pl: "doświadczenie międzynarodowe",
          en: "international work",
        },
      },
      {
        value: { pl: "40k+", en: "40k+" },
        label: {
          pl: "użytkowników moich aplikacji",
          en: "users of my apps",
        },
        compactLabel: {
          pl: "użytkowników aplikacji",
          en: "app users",
        },
      },
    ] satisfies { value: L10n; label: L10n; compactLabel: L10n }[],
  },
  about: {
    paragraph: {
      pl: "Łączę piksele z architekturą backendu. Od 5 lat działam na styku inżynierii i designu: w Ultra Studio buduję marki i systemy projektowe, a jako inżynier piszę kod w .NET i React, który je napędza. Design uczy mnie empatii i prostoty, a kod precyzji.",
      en: "I connect pixels with backend architecture. For 5 years I've worked where engineering meets design: at Ultra Studio I build brands and design systems, and as an engineer I write the .NET and React code that powers them. Design teaches me empathy and simplicity; code teaches me precision.",
    } satisfies L10n,
  },
  /** Kluczowe metryki z CV — count-up w sekcji "O mnie" */
  metrics: [
    {
      value: 5,
      suffix: {
        pl: "lat",
        en: "years",
      },
      label: {
        pl: "doświadczenia w UK, Polsce i Meksyku",
        en: "of experience across the UK, Poland & Mexico",
      },
    },
    {
      value: 100,
      suffix: { pl: "+", en: "+" },
      label: {
        pl: "ekranów Squizzu zaprojektowanych od zera, bez szablonów",
        en: "Squizzu screens designed from scratch, no UI templates",
      },
    },
    {
      value: 40,
      suffix: { pl: "k+", en: "k+" },
      label: {
        pl: "aktywnych użytkowników aplikacji uczelnianej po moim redesignie",
        en: "active users of the university app after my UX redesign",
      },
    },
    {
      // 30+, nie 35+ — tyle wynika z LinkedIna („past 30 sites") i z opisu
      // roli w data/experience.ts. Metryka nie może być wyższa niż dowód.
      value: 30,
      suffix: { pl: "+", en: "+" },
      label: {
        pl: "stron dostarczonych zespołom badawczym w UK",
        en: "sites delivered for UK research teams",
      },
    },
    {
      value: 5,
      suffix: { pl: "h", en: "h" },
      label: {
        pl: "tygodniowo oszczędzone dzięki mojemu interfejsowi text-to-SQL",
        en: "saved weekly by my conversational text-to-SQL interface",
      },
    },
  ] satisfies { value: number; suffix: L10n; label: L10n }[],
  contact: {
    heading: { pl: "Porozmawiajmy.", en: "Let's talk." } satisfies L10n,
    subline: {
      pl: "Masz projekt? Markę do zbudowania albo produkt do zaprogramowania? Napisz.",
      en: "Got a project? A brand to build, or a product to engineer? Drop me a line.",
    } satisfies L10n,
  },
} as const;

/**
 * Kanoniczne fakty o osobie — jedno źródło prawdy dla JSON-LD (lib/schema.ts)
 * i stron-wizytówek /about oraz /o-mnie.
 *
 * WAŻNE: te wartości muszą być identyczne z LinkedInem, GitHubem i Wikidatą.
 * Google buduje encję z powtarzalności — każda rozbieżność w nazwie, tytule
 * czy lokalizacji osłabia dopasowanie.
 */
export const person = {
  fullName: "Jakub Wysocki",
  givenName: "Jakub",
  familyName: "Wysocki",
  jobTitle: {
    pl: "Software Engineer i projektant UX/UI",
    en: "Software Engineer & UX/UI Designer",
  } satisfies L10n,
  nationality: "PL",
  locality: "Kraków",
  country: "PL",
  // JPEG, nie PNG: to fotografia, a PNG jest bezstratny i dawał 1,7 MB.
  // Person.image w lib/schema.ts wskazuje wprost na ten plik, więc musi to
  // być zwykły URL, nie adres optymalizatora Next (/_next/image?...).
  // Nazwa pliku jest sygnałem w wyszukiwarce grafiki, dlatego zawiera
  // imię i nazwisko zamiast generycznego "portrait".
  portrait: "/images/jakub-wysocki-portrait.jpg",
  /** Kanoniczna nota biograficzna — ta sama treść co w bio LinkedIna. */
  bio: {
    pl: "Jakub Wysocki jest inżynierem oprogramowania i projektantem UX/UI z siedzibą w Krakowie. Współzałożyciel Ultra Studio (studio kreatywne zajmujące się brandingiem, web designem i custom developmentem) oraz Squizzu, grywalizowanej platformy do nauki IT i przygotowania do rozmów rekrutacyjnych. Od 2021 roku pracuje na styku inżynierii i designu w Wielkiej Brytanii, Polsce i Meksyku, budując systemy w .NET i React dla klientów korporacyjnych i produktów wczesnej fazy.",
    en: "Jakub Wysocki is a software engineer and UX/UI designer based in Kraków, Poland. He is a co-founder of Ultra Studio, a creative studio for branding, web design and custom development, and of Squizzu, a gamified IT learning and interview-preparation platform. Since 2021 he has worked at the intersection of engineering and design across the United Kingdom, Poland and Mexico, building .NET and React systems for enterprise clients and early-stage products.",
  } satisfies L10n,
  /** Dziedziny kompetencji — knowsAbout w schema.org/Person. */
  knowsAbout: [
    "Software engineering",
    "UX/UI design",
    ".NET",
    "C#",
    "Node.js",
    "React",
    "Next.js",
    "TypeScript",
    "Design systems",
    "Microsoft Azure",
    "Brand identity design",
  ],
  /** Adresy stron-wizytówek w obu językach — canonical + hreflang. */
  entityHome: { en: "/about", pl: "/o-mnie" },
} as const;
