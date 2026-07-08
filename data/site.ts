import type { L10n } from "@/lib/lang-store";

/**
 * Publiczny adres produkcyjny — bazowy URL dla metadanych OG, robots
 * i sitemap. Po podpięciu własnej domeny ustaw NEXT_PUBLIC_SITE_URL
 * w env Vercela (albo podmień fallback).
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://jakub-wysocki.vercel.app";

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
      pl: "Łączę piksele z architekturą backendu. Od 5 lat działam na styku inżynierii i designu: w Ultra Studio buduję marki i systemy projektowe, a jako inżynier piszę kod w .NET i React, który je napędza. Design uczy mnie empatii i prostoty, kod — precyzji.",
      en: "I connect pixels with backend architecture. For 5 years I've worked where engineering meets design: at Ultra Studio I build brands and design systems, and as an engineer I write the .NET and React code that powers them. Design teaches me empathy and simplicity; code teaches me precision.",
    } satisfies L10n,
  },
  /** Kluczowe metryki z CV — count-up w sekcji "O mnie" */
  metrics: [
    {
      value: 5,
      suffix: "",
      label: {
        pl: "lat doświadczenia — Polska, UK i Meksyk",
        en: "years of experience across Poland, the UK & Mexico",
      },
    },
    {
      value: 100,
      suffix: "+",
      label: {
        pl: "ekranów Squizzu zaprojektowanych od zera, bez szablonów",
        en: "Squizzu screens designed from scratch, no UI templates",
      },
    },
    {
      value: 40,
      suffix: "k+",
      label: {
        pl: "aktywnych użytkowników aplikacji uczelnianej po moim redesignie",
        en: "active users of the university app after my UX redesign",
      },
    },
    {
      value: 35,
      suffix: "+",
      label: {
        pl: "stron dostarczonych zespołom badawczym w UK",
        en: "sites delivered for UK research teams",
      },
    },
    {
      value: 5,
      suffix: "h",
      label: {
        pl: "tygodniowo oszczędzone dzięki mojemu interfejsowi text-to-SQL",
        en: "saved weekly by my conversational text-to-SQL interface",
      },
    },
  ] as { value: number; suffix: string; label: L10n }[],
  contact: {
    heading: { pl: "Porozmawiajmy.", en: "Let's talk." } satisfies L10n,
    subline: {
      pl: "Masz projekt — markę do zbudowania albo produkt do zaprogramowania? Napisz.",
      en: "Got a project — a brand to build or a product to engineer? Drop me a line.",
    } satisfies L10n,
  },
} as const;
