import type { L10n } from "@/lib/lang-store";

export type Role = {
  id: string;
  company: string;
  role: L10n;
  period: L10n;
  location: L10n;
  /** Jednozdaniowe streszczenie, nagłówek panelu i timeline'u */
  summary: L10n;
  /** Konkretne, mierzalne osiągnięcia, punkty pod streszczeniem */
  highlights: L10n[];
  /** Kanoniczne tagi technologii, zasilają filtry w oknie Doświadczenie */
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
    period: { pl: "lip 2024 - dziś", en: "Jul 2024 - present" },
    location: { pl: "Kraków (zdalnie)", en: "Kraków (remote)" },
    summary: {
      pl: "Grywalizowana platforma do nauki IT i przygotowania do rozmów rekrutacyjnych. Odpowiadam za product design, architekturę front-endu i development, od koncepcji do produkcji.",
      en: "A gamified IT learning and interview-preparation platform. I lead its product design, frontend architecture and development, from concept to production.",
    },
    highlights: [
      {
        pl: "Ukształtowałem architekturę produktu i przełożyłem wczesne pomysły na wymagania techniczne, ścieżki użytkownika i kontrakty między front-endem a back-endem.",
        en: "Shaped the product architecture and translated early ideas into technical requirements, user journeys and frontend to backend contracts.",
      },
      {
        pl: "Zaprojektowałem w Adobe XD 100+ autorskich, responsywnych ekranów, własne ikony i spójny system projektowy, bez gotowych szablonów UI.",
        en: "Designed 100+ original responsive screens, custom icons and a consistent design system in Adobe XD, without using pre-made UI templates.",
      },
      {
        pl: "Prowadzę development front-endu w TypeScripcie, React 19 i Next.js: dostępne interfejsy, tryb ciemny, komponenty do wielokrotnego użycia.",
        en: "Lead frontend development with TypeScript, React 19 and Next.js: accessible interfaces, dark mode and reusable components.",
      },
      {
        pl: "Wprowadziłem proces integracji API-first na klientach TypeScript generowanych z OpenAPI/Swagger; współpracuję z zespołem back-endu nad API w .NET 8, uwierzytelnianiem i płatnościami.",
        en: "Established an API-first integration workflow using OpenAPI/Swagger-generated TypeScript clients, and collaborate with the backend team on .NET 8 APIs, authentication and payments.",
      },
      {
        pl: "Zaprojektowałem i wdrożyłem całą warstwę grywalizacji: rankingi, serie dni nauki, śledzenie postępów i kilka trybów nauki.",
        en: "Designed and implemented the gamification experience, including leaderboards, learning streaks, progress tracking and multiple learning modes.",
      },
      {
        pl: "Zintegrowałem produktowych agentów GPT-4o z samonaprawiającą się walidacją uszkodzonego JSON-a.",
        en: "Integrated GPT-4o product agents with self-healing validation of malformed JSON.",
      },
      {
        pl: "Zbudowałem narzędzia developerskie wspierane przez AI: produkcyjny serwer MCP, automatyczne bramki jakości i wielokrotnie używane przepływy Claude Code.",
        en: "Built AI-assisted development tooling, including a production MCP server, automated quality gates and reusable Claude Code workflows.",
      },
    ],
    tech: [
      ".NET 8",
      "Aspire",
      "Next.js",
      "React 19",
      "TypeScript",
      "CosmosDB",
      "Azure",
      "OpenAPI / Swagger",
      "GPT-4o",
      "MCP",
      "Adobe XD",
    ],
  },
  {
    id: "mandata",
    company: "Mandata",
    role: { pl: "Software Engineer", en: "Software Engineer" },
    period: { pl: "paź 2023 - cze 2026", en: "Oct 2023 - Jun 2026" },
    location: { pl: "Newcastle, UK (hybrydowo)", en: "Newcastle, UK (hybrid)" },
    summary: {
      pl: "Korporacyjna platforma logistyczna (TMS), desktopowa i chmurowa, obsługująca 300+ firm transportowych w Wielkiej Brytanii.",
      en: "Enterprise desktop and cloud logistics platform (TMS) serving 300+ UK haulage firms.",
    },
    highlights: [
      {
        pl: "Dostarczyłem 50+ funkcji end-to-end w zespole produktu korporacyjnego: od analizy i szacowania przez implementację po wydanie.",
        en: "Shipped 50+ features end-to-end as part of the enterprise product team, from analysis and estimation through implementation to release.",
      },
      {
        pl: "Współprojektowałem i zbudowałem interfejs mapowy (HERE Maps API) nastawiony na intuicyjność dla nietechnicznych kierowców.",
        en: "Co-designed and built a map interface (HERE Maps API) focused on intuitive UI for non-technical drivers.",
      },
      {
        pl: "Brałem udział w obejmującej całą platformę migracji 1000+ modułów z Sybase na MS SQL Server, z zachowaniem pełnej zgodności funkcjonalnej.",
        en: "Contributed to a platform-wide migration of 1,000+ modules from Sybase to MS SQL Server with full functional parity.",
      },
      {
        pl: "Bezpośredni kontakt z klientem: zbierałem wymagania od firm transportowych i obsługiwałem eskalacje wsparcia.",
        en: "Direct client contact: gathered requirements from haulage customers and handled support escalations.",
      },
    ],
    tech: [
      "Delphi",
      "C# / .NET",
      "SQL Server",
      "REST / SOAP",
      "Docker",
      "HERE Maps",
    ],
  },
  {
    id: "bunzl",
    company: "Bunzl plc",
    role: { pl: "Software Developer", en: "Software Developer" },
    period: { pl: "sie 2023 - gru 2024", en: "Aug 2023 - Dec 2024" },
    location: {
      pl: "Monterrey, Meksyk (zdalnie)",
      en: "Monterrey, Mexico (remote)",
    },
    summary: {
      pl: "Front-end i full-stack dla dwóch serwisów e-commerce w Bunzlu, grupie dystrybucyjnej z indeksu FTSE 100. Praca zdalna dla zespołu w Meksyku.",
      en: "Frontend and full-stack engineering for two e-commerce properties at Bunzl, a FTSE 100 distribution group. Delivered remotely to a Mexico-based team.",
    },
    highlights: [
      {
        pl: "Safetystore.mx (React, TypeScript, VTEX) zdobył tytuł „Best New E-commerce” na Premios eCommerce MX 2024, krajowej gali meksykańskiego e-commerce.",
        en: "Safetystore.mx (React, TypeScript, VTEX) won “Best New E-commerce” at Premios eCommerce MX 2024, Mexico's national e-commerce awards.",
      },
      {
        pl: "Zbudowałem autorski portal B2B (React, Node.js) z konwersacyjnym interfejsem text-to-SQL: handlowcy pytają o dane w języku naturalnym, zamiast czekać na raporty. Oszczędza to zespołom około 5 godzin pracy tygodniowo.",
        en: "Built a custom B2B management portal (React, Node.js) featuring a conversational text-to-SQL interface, letting sales staff query live data in plain language instead of waiting on reports. It saves the teams roughly 5 hours a week.",
      },
      {
        pl: "Utrzymywałem i rozwijałem sklep na Magento 2 dla espomega.mx.",
        en: "Maintained and extended the Magento 2 storefront for espomega.mx.",
      },
    ],
    tech: [
      "React",
      "TypeScript",
      "VTEX",
      "Node.js",
      "Magento 2",
      "Text-to-SQL / AI",
    ],
  },
  {
    id: "northumbria",
    company: "Northumbria University",
    role: { pl: "Software Developer", en: "Software Developer" },
    period: { pl: "wrz 2021 - paź 2023", en: "Sep 2021 - Oct 2023" },
    location: { pl: "Newcastle, UK", en: "Newcastle, UK" },
    summary: {
      pl: "Dwa lata w trzech etapach: roczny staż przemysłowy, praca part-time na ostatnim roku studiów i powrót na pełny etat po dyplomie, przy pracy nad platformą i tożsamością.",
      en: "Two years across three stages: a year-long industrial placement, part-time work through my final year of study, and a full-time return after graduating, on platform and identity work.",
    },
    highlights: [
      {
        pl: "Prowadziłem uczelniany Website Development Service: 21 stron w czasie stażu i ponad 30 łącznie, dla naukowców oraz projektów takich jak OSCE, Physiotherapy Clinic i Aerospace.",
        en: "Led the university's Website Development Service: 21 sites during the placement and 30+ in total, for researchers and for projects including OSCE, Physiotherapy Clinic and Aerospace.",
      },
      {
        pl: "Opracowałem na Elementorze rozwiązanie, które upraszcza redaktorom wypełnianie stron treścią, oraz napisałem przewodniki i wspierałem interesariuszy.",
        en: "Worked out an Elementor-based solution that simplifies content population for editors, and wrote the guides and stakeholder support around it.",
      },
      {
        pl: "Przeprojektowałem „NU Connect”, uczelnianą aplikację mobilną używaną przez 40 000+ osób: makiety i w pełni interaktywny prototyp w Adobe XD, a potem implementacja razem z zespołem IT Services (XAML, C#, .NET, Xamarin, Azure Storage). Redesign przyniósł 40% wzrostu liczby aktywnych użytkowników.",
        en: "Redesigned “NU Connect”, the university mobile app used by 40,000+ people: wireframes and a fully interactive prototype in Adobe XD, then implementation alongside the IT Services development team (XAML, C#, .NET, Xamarin, Azure Storage). The redesign lifted active users by 40%.",
      },
      {
        pl: "Poprowadziłem migrację NU Connect z Xamarina na .NET MAUI.",
        en: "Led the Xamarin to .NET MAUI migration of NU Connect.",
      },
      {
        pl: "Zarządzałem modelami tożsamości 50 000+ użytkowników uczelni w MS SQL Server i zmigrowałem usługi do Azure, na Kubernetes.",
        en: "Managed identity models for 50,000+ university users in MS SQL Server and migrated services to Azure, running on Kubernetes.",
      },
    ],
    tech: [
      ".NET MAUI",
      "Xamarin",
      "C# / .NET",
      "SQL Server",
      "Azure",
      "Kubernetes",
      "WordPress",
      "Adobe XD",
    ],
  },
];

/**
 * Ultra Studio w kontekście inżynierskim: notka strukturalna, nie pełna
 * pozycja. Praca kreatywna studia żyje w osobnym oknie i sekcji.
 */
export const studioNote: Role = {
  id: "ultrastudio",
  company: "Ultra Studio",
  role: {
    pl: "Co-Founder, Design & Development",
    en: "Co-Founder, Design & Development",
  },
  period: { pl: "sie 2024 - dziś", en: "Aug 2024 - present" },
  location: { pl: "Kraków (zdalnie)", en: "Kraków (remote)" },
  summary: {
    pl: "Równoległe przedsięwzięcie, które obecnie wypełnia moje zawodowe życie: kreatywne studio brandingu z najwyższej półki, web designu i custom developmentu.",
    en: "A concurrent venture that currently occupies my active life: a creative studio for high-end branding, web design and custom development.",
  },
  highlights: [
    {
      pl: "Wybrane realizacje: Alumed (klinika medycyny estetycznej z segmentu premium), Printly (platforma poligraficzna B2B) oraz pełna identyfikacja wizualna Squizzu.",
      en: "Selected work: Alumed (a premium aesthetic medicine clinic), Printly (a B2B print platform) and the full brand identity for Squizzu.",
    },
    {
      // Nazwa pada tu celowo: ten sam fakt ma niżej własną kartę w sekcji
      // projektów osobistych. Bez nazwy sekcja opisywałaby jedną rzecz dwa
      // razy, raz bezimiennie, i czytelnik nie miałby jak ich połączyć.
      pl: "Zbudowałem Venor, wewnętrzną platformę lead generation, która wyszukuje i kwalifikuje potencjalnych klientów dla studiów brandingowych.",
      en: "Built Venor, an in-house lead generation platform that sources and qualifies prospects for branding studios.",
    },
    {
      pl: "Zbudowałem autonomicznego agenta AI, który crawluje strony klientów i generuje dane strukturalne JSON-LD pod ich SEO.",
      en: "Built an autonomous AI crawling agent that auto-generates JSON-LD structured data to optimise client SEO.",
    },
    {
      pl: "To designowa strona mojego profilu. Pełne portfolio kreatywne znajdziesz w oknie Ultra Studio.",
      en: "This is the design side of my profile. The full creative portfolio lives in the Ultra Studio window.",
    },
  ],
  tech: [
    "Next.js",
    "Node.js",
    "Framer",
    "WordPress",
    "AI agents",
    "JSON-LD / SEO",
  ],
};

/** Wszystkie pozycje dla widoków, które pokazują też notkę o studiu.
 *  Ultra Studio pierwsze jako najświeższe zajęcie. */
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

/** Mapowanie filtra na to, czy rola go dotyczy (tagi bywają szczegółowe) */
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
        haystack.includes("mcp") ||
        haystack.includes("text-to-sql")
      );
    case "Mobile":
      return haystack.includes("maui") || haystack.includes("xamarin");
    default:
      return haystack.includes(filter.toLowerCase());
  }
}
