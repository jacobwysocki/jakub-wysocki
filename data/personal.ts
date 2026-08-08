import type { L10n } from "@/lib/lang-store";

/**
 * Projekty osobiste: rzeczy budowane poza płatnym briefem.
 *
 * Ikony celowo nie mieszkają tutaj. Wzorzec jest ten sam co w Extras.tsx:
 * komponent mapuje `id` na komponent lucide, dzięki czemu plik danych zostaje
 * czystym TypeScriptem bez JSX.
 */
export type PersonalProject = {
  /** Klucz mapy ikon w komponencie */
  id: string;
  /** Nazwa własna, ta sama w obu językach (jak Role.company) */
  name: string;
  /** Gatunek wpisu w slocie captionu: "Eksperyment UI", "Narzędzie wewnętrzne" */
  label: L10n;
  summary: L10n;
  highlights: L10n[];
  /** Kanoniczne tagi technologii. Zawsze string[], nigdy L10n (jak Role.tech) */
  tech: string[];
  /**
   * Stack rozbity na grupy. Sens ma tylko w karcie pełnej szerokości: tam jest
   * miejsce, żeby pigułki powtórzyły podział z diagramu zamiast leżeć jedną
   * chmurą. Gdy jest, zastępuje płaskie `tech`, które zostaje dla kart wąskich.
   */
  techGroups?: { label: L10n; items: string[] }[];
  /**
   * Jedno zdanie o tym, czego projekt nie robi. Opcjonalne, bo ma sens tylko
   * tam, gdzie wpis mógłby zostać odczytany jako obietnica.
   */
  boundary?: L10n;
  /** Stopka nieinteraktywna, gdy nie ma dokąd prowadzić (brak linku, brak repo) */
  note?: L10n;
  /** Wideo/kadr w karcie; null gdy jeszcze nie ma materiału */
  media?: string | null;
};

export const interactiveOs: PersonalProject = {
  id: "interactive-os",
  name: "Interactive OS",
  label: { pl: "Eksperyment UI", en: "UI Experiment" },
  summary: {
    pl: "Webowy system operacyjny jako alternatywny sposób eksploracji mojego portfolio. Okna, dock, pasek menu, tapety, boot screen: kompletne doświadczenie budowane komponent po komponencie w React.",
    en: "A web-based operating system as an alternative way to explore my portfolio. Windows, dock, menu bar, wallpapers, boot screen: a complete experience built component by component in React.",
  },
  highlights: [
    {
      pl: "Pełny menedżer okien z przeciąganiem, skalowaniem krawędzi, minimalizacją i maksymalizacją, animowany sprężyną Framer Motion.",
      en: "Full window manager with drag, edge resize, minimise and maximise, spring-animated by Framer Motion.",
    },
    {
      pl: "Dock z magnifikacją ikon w stylu macOS: fizyczna odległość kursora steruje skalą i unoszeniem każdej ikony.",
      en: "macOS-style dock with icon magnification: cursor distance physically drives the scale and lift of each icon.",
    },
    {
      pl: "7 wbudowanych aplikacji, od live preview stron w iframe po experience timeline i kontakt, z sidebarami i zakładkami.",
      en: "7 built-in apps, from live site previews in iframes to an experience timeline and contact, with sidebars and tabs.",
    },
    {
      pl: "Pasek menu z zegarem, menu kontekstowe z wyborem tapety oraz ekran startowy z progress barem: detale, które domykają wrażenie systemu.",
      en: "Menu bar with a live clock, right-click context menu with wallpaper picker, and a boot screen with a progress bar: details that sell the OS feel.",
    },
  ],
  tech: ["Next.js", "React", "TypeScript", "Zustand", "Framer Motion"],
  media: "/images/DemoOS.mp4",
};

/**
 * Venor: wewnętrzny system prospectingu Ultra Studio.
 *
 * Trzy rzeczy są tu świadome i nie należy ich cofać:
 *
 * 1. Produkt nazywa się "Venor" i tylko tak. Nie "Venor.io", bo to adres.
 * 2. Nie ma linku. Domena nie jest jeszcze zarejestrowana, a repozytorium
 *    zostaje prywatne, bo eksport i screenshoty zawierają dane realnych firm.
 * 3. Copy nie obiecuje wyniku i mówi wprost, czego narzędzie nie wie.
 *    Do tego służy pole `boundary`.
 *
 * Nie ma tu również liczby firm w bazie ani skuteczności scoringu: pierwsze
 * byłoby reklamowaniem rozmiaru prywatnej bazy z danymi osobowymi, a drugie
 * nie zostało zmierzone.
 */
export const venor: PersonalProject = {
  id: "venor",
  name: "Venor",
  label: { pl: "Narzędzie wewnętrzne", en: "Internal tool" },
  summary: {
    pl: "Prywatny system prospectingu, który buduję dla własnego studia. Odkrywa firmy z publicznych źródeł, ocenia ich dopasowanie do konkretnej usługi i prowadzi pracę od sygnału do następnego działania. Nie jest produktem na sprzedaż: nie ma użytkowników, rejestracji ani billingu.",
    en: "A private prospecting system I build for my own studio. It discovers companies from public sources, scores how well they fit a specific service and carries the work from a signal to the next action. It is not a product for sale: no users, no sign up, no billing.",
  },
  highlights: [
    {
      pl: "Playwright, Lighthouse i Claude działają lokalnie, jako skrypty CLI. Panel na Vercelu dostaje gotowy JSON, więc Chromium nigdy nie startuje w funkcji serverless.",
      en: "Playwright, Lighthouse and Claude run locally, as CLI scripts. The panel on Vercel gets a finished JSON file, so Chromium never boots inside a serverless function.",
    },
    {
      pl: "Analityka i stan CRM leżą w dwóch magazynach, kluczowane przez workspace, kampanię i firmę. Ponowny eksport nie kasuje dnia pracy.",
      en: "Analytics and CRM state live in two stores, keyed by workspace, campaign and company. A re-export never wipes a day of work.",
    },
    {
      pl: "Pięć wymiarów, wagi kampanii walidowane do sumy 1, pewność danych raportowana osobno. Wynik da się wyjaśnić, a nie tylko pokazać.",
      en: "Five dimensions, campaign weights validated to sum to 1, data confidence reported separately. A score can be explained, not just displayed.",
    },
    {
      pl: "Audyt PDF i eksport CSV powstają w przeglądarce: bez endpointu, kolejki zadań i Chromium po stronie serwera.",
      en: "The audit PDF and CSV export are built in the browser: no endpoint, no job queue, no Chromium on the server.",
    },
  ],
  /** Wariant płaski, gdyby karta kiedyś wróciła do wąskiej kolumny */
  tech: [
    "TypeScript",
    "Node.js",
    "Next.js 15",
    "React 19",
    "Playwright",
    "Lighthouse",
    "Prisma",
    "Turso",
  ],
  /**
   * Podział powtarza architekturę z diagramu: stack ma ją potwierdzać, a nie
   * wysypywać się jedną chmurą logotypów. Claude API stoi po stronie
   * pipeline'u, bo ocena wizualna screenshotów leci lokalnie, a nie z panelu.
   * Integracje rejestrowe są celowo poza pigułkami: padają na diagramie,
   * a jako tagi ciągnęłyby wzrok mocniej, niż na to zasługują.
   */
  techGroups: [
    {
      label: { pl: "Pipeline, lokalnie", en: "Pipeline, local" },
      items: [
        "TypeScript",
        "Node.js",
        "Playwright",
        "Lighthouse",
        "Prisma",
        "SQLite",
        "Claude API",
      ],
    },
    {
      label: { pl: "Panel, wdrożony", en: "Panel, deployed" },
      items: ["Next.js 15", "React 19", "Turso", "pdfmake", "Vercel"],
    },
  ],
  boundary: {
    pl: "Venor wykrywa dopasowanie, potrzebę i sygnał momentu. Nie wie, czy firma ma budżet ani czy zamierza kupić, więc decyzję o kontakcie zawsze podejmuje człowiek.",
    en: "Venor detects fit, need and timing signals. It does not know whether a company has a budget or intends to buy, so the decision to reach out is always made by a human.",
  },
  note: {
    pl: "Repozytorium prywatne, w codziennym użyciu w Ultra Studio.",
    en: "Private repository, in daily use at Ultra Studio.",
  },
  media: null,
};

export const personalProjects: PersonalProject[] = [interactiveOs, venor];
