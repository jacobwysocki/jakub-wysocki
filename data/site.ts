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
  // Profil designerski, dopisany też do sameAs w lib/schema.ts i do widocznych
  // linków w EntityHome (te dwa miejsca muszą się zgadzać).
  // Uwaga: pole „Portfolio" na Behance wskazuje dziś na ultrastud.io, nie na tę
  // domenę, więc obustronnego potwierdzenia z entity home jeszcze NIE ma.
  // Zacznie działać dopiero, gdy w linkach profilu stanie jakub-wysocki.com.
  behance: "https://www.behance.net/jakub-wysocki",
  droneRepo: "https://github.com/jacobwysocki/drone-path-optimization",
  droneLive: "https://jacobwysocki.github.io/drone-path-optimization/",
  squizzu: "https://www.squizzu.com",
  squizzuApp: "https://app.squizzu.com",
  ultrastudio: "https://ultrastud.io",
} as const;

export const site = {
  name: "jakub-wysocki",
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
    /** Krótkie fakty pod headline'em — hero w wariancie foto + typografia */
    facts: [
      { pl: "5 lat doświadczenia", en: "5 years of experience" },
      { pl: "PL · UK · MX", en: "PL · UK · MX" },
      { pl: "40k+ użytkowników moich aplikacji", en: "40k+ users of my apps" },
    ] satisfies L10n[],
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
  portrait: "/images/portrait.jpg",
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
