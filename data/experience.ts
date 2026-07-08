import type { L10n } from "@/lib/lang-store";

export type Role = {
  id: string;
  company: string;
  role: L10n;
  period: L10n;
  location: L10n;
  /** Jednozdaniowe streszczenie — nagłówek panelu / timeline */
  summary: L10n;
  /** Konkretne, mierzalne osiągnięcia — punkty pod streszczeniem */
  highlights: L10n[];
  /** Kanoniczne tagi technologii — zasilają filtry w oknie Doświadczenie */
  tech: string[];
};

export const engineeringRoles: Role[] = [
  {
    id: "squizzu",
    company: "Squizzu",
    role: {
      pl: "Co-Founder & Full-Stack Engineer",
      en: "Co-Founder & Full-Stack Engineer",
    },
    period: { pl: "lip 2024 — dziś", en: "Jul 2024 — present" },
    location: { pl: "Kraków (zdalnie)", en: "Kraków (remote)" },
    summary: {
      pl: "Grywalizowany SaaS rekrutacyjny budowany od zera — od 0 do 1000+ użytkowników.",
      en: "Greenfield gamified recruitment SaaS — scaled from 0 to 1,000+ users.",
    },
    highlights: [
      {
        pl: "Zaprojektowałem 100+ ekranów od zera w Adobe XD — pełny UX bez gotowych szablonów UI.",
        en: "Designed 100+ screens from scratch in Adobe XD — end-to-end UX with zero pre-made UI templates.",
      },
      {
        pl: "Zbudowałem złożone przepływy grywalizacji: rankingi, odznaki progresji, ścieżki rozwoju.",
        en: "Built complex gamification flows: leaderboards, progression badges and player journeys.",
      },
      {
        pl: "Zintegrowałem produktowych agentów GPT-4o z samonaprawiającą się walidacją uszkodzonego JSON-a.",
        en: "Integrated GPT-4o product agents with self-healing validation of malformed JSON.",
      },
      {
        pl: "Architektura: .NET 8 (Aspire), Next.js / React 19, CosmosDB, Azure.",
        en: "Architecture: .NET 8 (Aspire), Next.js / React 19, CosmosDB, Azure.",
      },
    ],
    tech: [".NET 8", "Aspire", "Next.js", "React 19", "CosmosDB", "Azure", "GPT-4o", "Adobe XD"],
  },
  {
    id: "mandata",
    company: "Mandata Ltd",
    role: { pl: "Software Engineer", en: "Software Engineer" },
    period: { pl: "paź 2023 — cze 2026", en: "Oct 2023 — Jun 2026" },
    location: { pl: "UK (zdalnie)", en: "UK (remote)" },
    summary: {
      pl: "Korporacyjna platforma logistyczna (TMS) — desktop i chmura — dla 300+ firm transportowych w UK.",
      en: "Enterprise desktop/cloud logistics platform (TMS) serving 300+ UK haulage firms.",
    },
    highlights: [
      {
        pl: "Dostarczyłem 50+ funkcji end-to-end — od analizy przez implementację po wdrożenie.",
        en: "Delivered 50+ features end-to-end — from analysis through implementation to release.",
      },
      {
        pl: "Zaprojektowałem interfejs mapowy (HERE Maps API) z naciskiem na intuicyjność dla nietechnicznych kierowców.",
        en: "Designed a map interface (HERE Maps API) focused on intuitive UI for non-technical drivers.",
      },
      {
        pl: "Zmigrowałem 1000+ modułów z Sybase do MS SQL Server z zachowaniem pełnej zgodności.",
        en: "Migrated 1,000+ modules from Sybase to MS SQL Server, fully compliant.",
      },
    ],
    tech: ["Delphi", "C# / .NET", "SQL Server", "REST / SOAP", "Docker", "HERE Maps"],
  },
  {
    id: "bunzl",
    company: "Bunzl plc",
    role: { pl: "Freelance Developer", en: "Freelance Developer" },
    period: { pl: "sie 2023 — gru 2024", en: "Aug 2023 — Dec 2024" },
    location: { pl: "Meksyk (zdalnie)", en: "Mexico (remote)" },
    summary: {
      pl: "Frontend engineering dla Safetystore.mx i autorski portal B2B dla espomega.mx.",
      en: "Frontend engineering for Safetystore.mx and a custom B2B portal for espomega.mx.",
    },
    highlights: [
      {
        pl: "Safetystore.mx (React, TypeScript, VTEX) zdobył tytuł „Best New E-commerce” na krajowej gali Premios eCommerce MX 2024.",
        en: "Safetystore.mx (React, TypeScript, VTEX) won “Best New E-commerce” at Mexico's national Premios eCommerce MX 2024.",
      },
      {
        pl: "Zaprojektowałem i zbudowałem portal B2B (React, Node.js) z konwersacyjnym interfejsem text-to-SQL w języku naturalnym.",
        en: "Designed and built a B2B management portal (React, Node.js) featuring a conversational text-to-SQL natural-language interface.",
      },
      {
        pl: "Interfejs text-to-SQL oszczędza zespołom sprzedaży ~5 godzin ręcznej pracy z danymi tygodniowo.",
        en: "The text-to-SQL interface saves sales teams ~5 hours of manual data work every week.",
      },
    ],
    tech: ["React", "TypeScript", "VTEX", "Node.js", "Text-to-SQL / AI"],
  },
  {
    id: "northumbria",
    company: "Northumbria University",
    role: { pl: "Software Developer", en: "Software Developer" },
    period: { pl: "wrz 2021 — paź 2023", en: "Sep 2021 — Oct 2023" },
    location: { pl: "Newcastle, UK", en: "Newcastle, UK" },
    summary: {
      pl: "„NU Connect” — wieloplatformowa aplikacja mobilna używana przez 40 000+ osób.",
      en: "Shipped “NU Connect” — a cross-platform mobile app used by 40,000+ people.",
    },
    highlights: [
      {
        pl: "Poprowadziłem migrację z Xamarin do .NET MAUI i pełny redesign UX — +40% aktywnych użytkowników.",
        en: "Led the Xamarin → .NET MAUI migration and a complete UX redesign — a 40% increase in active users.",
      },
      {
        pl: "Zarządzałem modelami tożsamości 50 000+ użytkowników w MS SQL Server i zmigrowałem usługi do Azure (Kubernetes).",
        en: "Managed identity models for 50,000+ users in MS SQL Server and migrated services to Azure on Kubernetes.",
      },
      {
        pl: "Prowadziłem uczelniany serwis web developmentu dla naukowców — 30+ stron na WordPressie i w kodzie własnym.",
        en: "Led the university's web-development service for researchers — 30+ sites on WordPress and custom code.",
      },
    ],
    tech: [".NET MAUI", "Xamarin", "C# / .NET", "SQL Server", "Azure", "Kubernetes", "WordPress"],
  },
];

/**
 * Ultra Studio w kontekście inżynierskim — notka strukturalna, nie pełna
 * pozycja: praca kreatywna studia żyje w osobnym oknie / sekcji.
 */
export const studioNote: Role = {
  id: "ultrastudio",
  company: "Ultra Studio",
  role: { pl: "Co-Founder & Tech Lead", en: "Co-Founder & Tech Lead" },
  period: { pl: "sie 2024 — dziś", en: "Aug 2024 — present" },
  location: { pl: "Kraków", en: "Kraków" },
  summary: {
    pl: "Równoległe przedsięwzięcie, które obecnie wypełnia moje zawodowe życie — kreatywne studio brandingu, web designu i custom developmentu.",
    en: "A concurrent venture that currently occupies my active life — a creative studio for high-end branding, web design and custom development.",
  },
  highlights: [
    {
      pl: "Zbudowałem autonomicznego agenta AI, który crawluje strony klientów i generuje ustrukturyzowane dane JSON-LD pod pozycjonowanie SEO.",
      en: "Built an autonomous AI crawling agent that auto-generates structured JSON-LD data to optimise client SEO positioning.",
    },
    {
      pl: "Strona designowa mojego profilu — pełne portfolio kreatywne znajdziesz w oknie Ultra Studio.",
      en: "This is the design side of my profile — the full creative portfolio lives in the Ultra Studio window.",
    },
  ],
  tech: ["Next.js", "Framer", "WordPress", "AI agents", "JSON-LD / SEO"],
};

/** Wszystkie pozycje dla widoków, które pokazują też notkę o studiu —
 *  Ultra Studio pierwsze jako najświeższe zajęcie */
export const allRoles: Role[] = [studioNote, ...engineeringRoles];

/** Kuratorowana lista filtrów technologii (sidebar okna Doświadczenie) */
export const TECH_FILTERS = [
  ".NET",
  "React",
  "TypeScript",
  "Azure",
  "SQL",
  "AI",
  "Mobile",
] as const;

/** Mapowanie filtra → czy rola go dotyczy (tagi bywają szczegółowe) */
export function roleMatchesFilter(role: Role, filter: string): boolean {
  const haystack = role.tech.join(" ").toLowerCase();
  switch (filter) {
    case ".NET":
      return haystack.includes(".net") || haystack.includes("c#");
    case "SQL":
      return haystack.includes("sql") || haystack.includes("cosmos");
    case "AI":
      return (
        haystack.includes("ai") ||
        haystack.includes("gpt") ||
        haystack.includes("text-to-sql")
      );
    case "Mobile":
      return haystack.includes("maui") || haystack.includes("xamarin");
    default:
      return haystack.includes(filter.toLowerCase());
  }
}
