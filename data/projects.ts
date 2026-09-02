import type { L10n } from "@/lib/lang-store";
import { contactInfo } from "./site";

export type StudioProject = {
  slug: string;
  client: string;
  tag: L10n;
  description: L10n;
  /** Rozwinięcie case study — sekcje w oknie / modalu detalu */
  details: { title: L10n; text: L10n }[];
  services: string[];
  /**
   * Ścieżka do okładki (np. "/projects/printly.jpg" w /public).
   * Gdy null — elegancki placeholder gradientowy z typografią.
   */
  image: string | null;
  /** Dodatkowe kadry w detalu projektu (placeholdery, dopóki brak zdjęć) */
  gallery: string[];
  gradient: string;
  link?: string;
  /** Etykieta przycisku CTA w modalu (domyślnie „Otwórz stronę") */
  linkLabel?: L10n;
};

export const studioProjects: StudioProject[] = [
  {
    slug: "squizzu",
    client: "Squizzu",
    tag: { pl: "Software + branding", en: "Software + branding" },
    description: {
      pl: "Grywalizowana platforma do nauki IT dostarczona w pełnym zakresie: core software development oraz kompletny branding i identyfikacja wizualna.",
      en: "A gamified IT learning platform delivered end to end: core software development plus full branding and identity design.",
    },
    details: [
      {
        title: { pl: "Produkt", en: "The product" },
        text: {
          pl: "Współtworzę Squizzu od pierwszej linijki kodu: architektura .NET 8 z orkiestracją Aspire, frontend Next.js z React 19 i CosmosDB na Azure.",
          en: "I co-build Squizzu from the first line of code: .NET 8 architecture with Aspire orchestration, a Next.js/React 19 frontend and CosmosDB on Azure.",
        },
      },
      {
        title: { pl: "Marka", en: "The brand" },
        text: {
          pl: "Pełna identyfikacja wizualna powstała w studiu: logo, system kolorów i komponentów oraz ponad 100 ekranów produktu zaprojektowanych od zera.",
          en: "The complete identity was designed in-studio: the logo, colour and component system, and 100+ product screens designed from scratch.",
        },
      },
    ],
    services: ["Core Software Development", "Branding / Identity", "UX/UI"],
    image: "/projects/squizzu.jpg",
    gallery: [],
    gradient: "linear-gradient(150deg, #FFC205 0%, #FF8C00 100%)",
    link: contactInfo.squizzu,
  },
  {
    slug: "ultrastudio-site",
    client: "Ultra Studio",
    tag: { pl: "Branding + strona studia", en: "Branding + studio site" },
    description: {
      pl: "Marka i nowa strona własnego studia, witryna zbudowana we Framerze.",
      en: "The studio's own brand and new website, built in Framer.",
    },
    details: [
      {
        title: { pl: "Studio", en: "The studio" },
        text: {
          pl: "Ultra Studio to kreatywna pracownia zajmująca się brandingiem z wyższej półki, web designem i custom developmentem. Współprowadzę ją jako Co-Founder, Design & Development.",
          en: "Ultra Studio is a creative studio handling high-end branding, web design and custom development. I co-run it as Co-Founder, Design & Development.",
        },
      },
      {
        title: { pl: "Technologia w służbie SEO", en: "Tech serving SEO" },
        text: {
          pl: "Zbudowałem autonomicznego agenta AI, który crawluje strony klientów i automatycznie generuje ustrukturyzowane dane JSON-LD, poprawiając ich pozycjonowanie.",
          en: "I built an autonomous AI crawling agent that auto-generates structured JSON-LD data to optimise our clients' SEO positioning.",
        },
      },
    ],
    services: ["Branding", "Web design", "Framer", "AI / SEO"],
    image: "/projects/ultrastudio.jpg",
    gallery: [],
    gradient: "linear-gradient(145deg, #0A0A0C 0%, #1D1D1F 45%, #C2410C 130%)",
    link: contactInfo.ultrastudio,
  },
  {
    slug: "alumed",
    client: "Alumed",
    tag: {
      pl: "Projekt UX + strona WWW",
      en: "UX design + web development",
    },
    description: {
      pl: "Kompleksowy UX design i strona premium dla kliniki medycyny estetycznej.",
      en: "End-to-end premium UX design and web development for an aesthetic medicine clinic.",
    },
    details: [
      {
        title: { pl: "Wyzwanie", en: "The challenge" },
        text: {
          pl: "Klinika premium potrzebowała strony, która wygląda ekskluzywnie, a jednocześnie ładuje się błyskawicznie i jest łatwa w edycji dla zespołu.",
          en: "A premium clinic needed a site that looks exclusive yet loads instantly and stays easy for the team to edit.",
        },
      },
      {
        title: { pl: "Rozwiązanie", en: "The solution" },
        text: {
          pl: "Zaprojektowałem doświadczenie od zera i zbudowałem błyskawiczną stronę na lekkim, w pełni customowym HTML, CSS i JavaScript, osadzonym na skrojonej pod klienta strukturze WordPressa.",
          en: "I designed the experience from scratch and built a lightning-fast site with lightweight, fully custom HTML, CSS and JavaScript on top of a tailored WordPress structure.",
        },
      },
    ],
    services: ["UX Design", "Custom HTML/CSS/JS", "WordPress"],
    image: "/projects/alumed.jpg",
    gallery: [],
    gradient: "linear-gradient(135deg, #1D1D1F 0%, #6E6E73 100%)",
    link: "https://alumed.mx",
    linkLabel: { pl: "Zobacz stronę", en: "Visit site" },
  },
  {
    slug: "printly",
    client: "Printly",
    tag: {
      pl: "UX/UI + architektura informacji",
      en: "UX/UI + information architecture",
    },
    description: {
      pl: "Kompletny projekt UX/UI i architektury informacji dla e-commerce'owej platformy druku.",
      en: "Complete UX/UI and information-architecture design for an e-commerce print platform.",
    },
    details: [
      {
        title: { pl: "Wyzwanie", en: "The challenge" },
        text: {
          pl: "Checkout B2B dla druku to dziesiątki wariantów: formaty, gramatury, uszlachetnienia, nakłady i wyceny. Klienci gubili się przed finalizacją zamówienia.",
          en: "A B2B print checkout means dozens of variables: formats, paper weights, finishes, volumes and quotes. Customers were getting lost before completing an order.",
        },
      },
      {
        title: { pl: "Rozwiązanie", en: "The solution" },
        text: {
          pl: "Przeprojektowałem architekturę informacji od zera i uprościłem wysoce złożony proces zakupowy B2B do eleganckiego, kilkukrokowego przepływu, który prowadzi użytkownika za rękę.",
          en: "I redesigned the information architecture from the ground up and simplified a highly complex B2B checkout into an elegant, guided multi-step flow.",
        },
      },
    ],
    services: ["UX/UI", "Information Architecture", "E-commerce"],
    image: "/projects/printly.jpg",
    gallery: [],
    gradient: "linear-gradient(135deg, #40180A 0%, #C2410C 100%)",
    link: "https://ultrastud.io/portfolio/printly",
    linkLabel: {
      pl: "Zobacz case study na ultrastud.io",
      en: "See the case study on ultrastud.io",
    },
  },
];

/** Opis samego studia — nagłówek sekcji C i zakładki "Studio" na pulpicie */
export const studioInfo = {
  heading: {
    pl: "Marki z charakterem.",
    en: "Brands with character.",
  } satisfies L10n,
  description: {
    pl: "Ultra Studio to moja kreatywna pracownia: branding z wyższej półki, web design i custom development. Tu mieszka wizualna, kliencka strona mojej pracy: identyfikacje, systemy projektowe i dopracowane front-endy.",
    en: "Ultra Studio is my creative practice: high-end branding, web design and custom development. This is the visual, client-facing side of my work: identities, design systems and finely-tuned front-ends.",
  } satisfies L10n,
  url: contactInfo.ultrastudio,
};

/**
 * Wyróżnione case study (pinned showcase w sekcji C) — historia
 * własnego studia: marka, strona we Framerze i AI w służbie SEO.
 */
export const featuredProject = {
  client: "Ultra Studio",
  tag: { pl: "Realizacja", en: "Case study" } satisfies L10n,
  image: "/projects/ultrastudio-case2.jpg" as string | null,
  gradient: "linear-gradient(145deg, #0A0A0C 0%, #1D1D1F 45%, #C2410C 130%)",
  steps: [
    {
      title: {
        pl: "Ta sama poprzeczka, co dla klientów.",
        en: "The same bar we set for clients.",
      },
      text: {
        pl: "Markę i stronę studia dopracowaliśmy równie skrupulatnie jak każdy projekt klientowski. To nasza najlepsza wizytówka.",
        en: "We crafted the studio's own brand and site with the same rigour as any client project. It's our best calling card.",
      },
    },
    {
      title: {
        pl: "Projekt, który trafia na żywo tego samego dnia.",
        en: "Design that ships the same day.",
      },
      text: {
        pl: "Zbudowana we Framerze: zmiany w projekcie wdrażamy natychmiast, bez oddawania kontroli nad detalem i wydajnością.",
        en: "Built in Framer: design decisions go live at once, without giving up control over detail or performance.",
      },
    },
    {
      title: {
        pl: "SEO, które pracuje w tle.",
        en: "SEO that runs on autopilot.",
      },
      text: {
        pl: "Autonomiczny agent AI crawluje strony klientów i sam generuje dane JSON-LD: pozycjonowanie napędzane kodem, nie ręczną robotą.",
        en: "An autonomous AI agent crawls client sites and generates their JSON-LD on its own: rankings driven by code, not manual busywork.",
      },
    },
  ] as { title: L10n; text: L10n }[],
};
