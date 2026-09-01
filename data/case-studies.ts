import type { L10n } from "@/lib/lang";

/**
 * Katalog case studies UX: jedna, znormalizowana tożsamość dla sześciu
 * projektów, które do tej pory żyły w czterech różnych plikach danych
 * (projects/showcase/personal/education). Ten plik jest projekcją nad tamtymi
 * źródłami, nie szóstą niezależną narracją: fakt, który ma właściciela w
 * data/*.ts, wolno tu tylko cytować albo komponować, nigdy przerabiać.
 *
 * Filozofia sekcji jest taka sama jak w całym repo: obowiązkowy kręgosłup
 * (problem → decyzje → rozwiązanie → dowody) gwarantuje, że żaden case nie
 * jest pusty, a każda sekcja procesowa (discovery, media, wynik) jest opt-in.
 * Cienki projekt pozostaje uczciwy przez POMINIĘCIE sekcji, nigdy przez
 * zmyślenie treści. Metryka nie może być wyższa niż dowód.
 */

export const PROJECT_IDS = [
  "squizzu",
  "ultra-studio",
  "venor",
  "alumed",
  "printly",
  "drone-path",
] as const;

export type ProjectId = (typeof PROJECT_IDS)[number];

/**
 * Stare identyfikatory, którymi inne pliki danych nazywają te same projekty.
 * Resolver lokacji przyjmuje alias, ale kanonicznym adresem jest ProjectId.
 */
export const PROJECT_ID_ALIASES: Record<string, ProjectId> = {
  "ultrastudio-site": "ultra-studio",
};

export function parseProjectId(value: string): ProjectId | null {
  if ((PROJECT_IDS as readonly string[]).includes(value)) {
    return value as ProjectId;
  }
  return PROJECT_ID_ALIASES[value] ?? null;
}

/** Jedno odwołanie do materiału wizualnego; lustrzane wobec wzorca z cases.ts. */
export type CaseMedia = {
  src: string;
  alt: L10n;
  kind?: "image" | "video" | "diagram";
  caption?: L10n;
};

/** Decyzja projektowa wraz z uzasadnieniem: podstawowa jednostka case'a UX. */
export type CaseDecision = { decision: L10n; rationale: L10n };

/**
 * Zmierzony wynik. Celowo opcjonalny: sekcja wyników znika, gdy niczego nie
 * zmierzono. `verified` odblokowuje słowo „zmierzone" tylko dla liczb
 * sprawdzalnych niezależnie.
 */
export type CaseMetric = {
  value: string;
  label: L10n;
  verified?: boolean;
};

/**
 * Rozdział o identyfikacji: znak, jego znaczenie, droga do niego i system
 * kolorów. Sekcja jest w całości opcjonalna — dostaje ją tylko projekt,
 * którego proces brandingowy jest udokumentowany źródłowo (brandbook,
 * archiwum eksploracji), nigdy zrekonstruowany z pamięci.
 */
export type BrandSection = {
  /** Idea znaku: co geometria znaczy i czego celowo nie obiecuje. */
  intro: L10n;
  /** Plakiety lockupu na jasnej i ciemnej powierzchni marki. */
  lockup: {
    light: string;
    dark?: string;
    /** Tła plakiet pochodzą ze świata marki, nie z motywu portfolio. */
    surfaces?: { light: string; dark: string };
    caption?: L10n;
  };
  explorations?: {
    note: L10n;
    marks: { src: string; name: string; caption?: L10n; winner?: boolean }[];
  };
  construction?: {
    note: L10n;
    /** Rysunek geometrii znaku: komponent z mapy wizualizacji case'ów. */
    component?: string;
  };
  palette?: {
    note?: L10n;
    colors: { name: string; value: string; role?: L10n }[];
    /** Kierunki zbadane i odrzucone — historia decyzji, nie produkcja. */
    explored?: { note: L10n; marks: { src: string; name: string }[] };
  };
  typography?: L10n;
};

export type UxCaseStudy = {
  slug: ProjectId;
  client: string;
  tag: L10n;
  role: L10n;
  period?: L10n;
  team?: L10n;
  gradient: string;
  cover: CaseMedia | null;

  links?: {
    live?: string;
    repo?: string;
    external?: { url: string; label: L10n };
    embed?: boolean;
  };

  problem: L10n;
  context?: L10n[];

  discovery?: {
    method: L10n;
    findings: L10n[];
  };

  architecture?: {
    summary: L10n;
    /** Nazwa komponentu (np. "VenorPipeline") albo statyczny materiał. */
    diagram?: CaseMedia | { component: string };
  };

  process?: { note: L10n; media: CaseMedia[] };

  decisions: CaseDecision[];

  solution: { summary: L10n; media: CaseMedia[] };

  /** Rozdział identyfikacji; renderowany po rozwiązaniu, przed wynikiem. */
  brand?: BrandSection;

  outcome?: { narrative?: L10n; metrics?: CaseMetric[] };

  reflection?: L10n;

  /** Wzorzec uczciwości z personal.ts: czego ta praca świadomie NIE twierdzi. */
  boundary?: L10n;
};

/**
 * Rekordy uzupełniane są etapami (najpierw treść zweryfikowana w danych
 * źródłowych, potem materiały procesowe z Adobe XD). Brakujący wpis oznacza
 * „case jeszcze nie opublikowany" i każda powierzchnia ma się na nim zamykać
 * bezpiecznie (404 / brak ikony), a nie renderować pustkę.
 */
export const caseStudies: Partial<Record<ProjectId, UxCaseStudy>> = {
  squizzu: {
    slug: "squizzu",
    client: "Squizzu",
    tag: { pl: "SaaS · współzałożyciel", en: "SaaS · co-founder" },
    role: {
      pl: "Co-Founder & Full-Stack Engineer",
      en: "Co-Founder & Full-Stack Engineer",
    },
    period: { pl: "lip 2024 - dziś", en: "Jul 2024 - present" },
    team: {
      pl: "Współtworzony z zespołem back-endu; odpowiadam za product design, front-end i system projektowy.",
      en: "Co-built with a backend team; I own the product design, the frontend and the design system.",
    },
    gradient: "linear-gradient(150deg, #FFC205 0%, #FF8C00 100%)",
    cover: {
      src: "/projects/squizzu.jpg",
      kind: "image",
      alt: {
        pl: "Strona główna Squizzu otwarta w przeglądarce na MacBooku: nagłówek „Practice The Interview Quiz by Quiz” i pierścień ikon kategorii technologicznych na ciemnym tle.",
        en: "The Squizzu homepage open in a browser on a MacBook: the headline “Practice The Interview Quiz by Quiz” and a ring of technology-category icons on a dark background.",
      },
    },
    links: { live: "https://squizzu.com", embed: true },
    problem: {
      pl: "Przygotowanie do rozmów technicznych jest żmudne i łatwo je porzucić. Squizzu miało zamienić tę harówkę w grę, do której się wraca — i całość produktu, od ścieżek użytkownika po kontrakty API, trzeba było ustawić, zanim padła pierwsza linijka kodu.",
      en: "Preparing for technical interviews is a grind that's easy to abandon. Squizzu had to turn that grind into a game people come back to — and the whole product, from user journeys to API contracts, had to be settled before the first line of code.",
    },
    context: [
      {
        pl: "Greenfield: zaczynaliśmy od zera użytkowników i pustego repozytorium.",
        en: "Greenfield: we started from zero users and an empty repository.",
      },
      {
        pl: "Jeden człowiek odpowiada za definicję produktu, markę, system projektowy i front-end — bez gotowych szablonów UI.",
        en: "One person owns product definition, brand, design system and frontend — with no pre-made UI kit.",
      },
    ],
    architecture: {
      summary: {
        pl: "Wczesne pomysły przełożyłem na wymagania techniczne, ścieżki użytkownika i kontrakty między front-endem a back-endem. Architektura produktu była ustalona, zanim ruszył kod.",
        en: "I translated the early ideas into technical requirements, user journeys and the contracts between frontend and backend. The product architecture was settled before code began.",
      },
    },
    process: {
      note: {
        pl: "System projektowy nie był pożyczony, tylko zbudowany w Adobe XD: stała paleta (od ciepłych bursztynów #FFCD5D i #FDB410 po niemal czernie), wspólna biblioteka assetów i druga generacja landing page rozrysowana w wariancie jasnym i ciemnym. Ponad sto responsywnych ekranów i autorskie ikony.",
        en: "The design system wasn't borrowed, it was built in Adobe XD: a fixed palette (from warm ambers #FFCD5D and #FDB410 to near-blacks), a shared asset library, and a second-generation landing page drawn out in both light and dark. Over a hundred responsive screens and custom icons.",
      },
      media: [],
    },
    decisions: [
      {
        decision: {
          pl: "Definicja przed pikselami: wymagania, ścieżki i kontrakty API ustalone przed budową.",
          en: "Definition before pixels: requirements, journeys and API contracts settled before building.",
        },
        rationale: {
          pl: "Współzałożyciel nie ma budżetu na przeróbki — kształt produktu musiał się trzymać, zanim ktokolwiek napisał ekran.",
          en: "A co-founder can't afford rework — the shape of the product had to hold before anyone built a screen.",
        },
      },
      {
        decision: {
          pl: "System projektowy od zera, ani jednego gotowego szablonu.",
          en: "A design system from scratch, not a single pre-made template.",
        },
        rationale: {
          pl: "Produkt do nauki stoi spójnością i rozpoznawalną tożsamością; szablon sprawiłby, że wyglądałby jak wszyscy inni.",
          en: "A learning product lives on consistency and a recognisable identity; a template would have made it look like everyone else.",
        },
      },
      {
        // Kod potwierdza rankingi, streaki i śledzenie postępów; odznaki
        // pozostały konceptem projektowym, więc case ich nie deklaruje.
        decision: {
          pl: "Grywalizacja jako główny mechanizm: rankingi XP i celnych odpowiedzi, streaki, śledzenie postępów i kilka trybów nauki.",
          en: "Gamification as the core mechanic: XP and correct-answer rankings, streaks, progress tracking and several learning modes.",
        },
        rationale: {
          pl: "Naukę porzuca się, gdy jest nudna. Pętle z gry dają powód, żeby wrócić następnego dnia.",
          en: "Studying gets abandoned when it's dull. Game loops give a reason to come back the next day.",
        },
      },
      {
        decision: {
          pl: "Kontrakty pilnowane automatycznie: klienci TypeScript z OpenAPI, bramki jakości i samonaprawiająca się walidacja JSON-a od agentów GPT-4o.",
          en: "Contracts kept honest automatically: TypeScript clients from OpenAPI, quality gates and self-healing validation of the JSON from GPT-4o agents.",
        },
        rationale: {
          pl: "W produkcie o dwóch stronach rozjazd między front-endem a API ma łamać build, a nie ekran użytkownika.",
          en: "On a two-sided product, drift between the frontend and the API should break the build, not a user's screen.",
        },
      },
    ],
    solution: {
      summary: {
        pl: "Produkt dostarczony end-to-end: marka i system projektowy, dostępny front-end w TypeScripcie, React 19 i Next.js z trybem ciemnym, na .NET 8 z orkiestracją Aspire i CosmosDB na Azure — a na wierzchu warstwa grywalizacji, która zamienia naukę w grę.",
        en: "Delivered end to end: brand and design system, an accessible frontend in TypeScript, React 19 and Next.js with dark mode, on .NET 8 with Aspire orchestration and CosmosDB on Azure — topped with a gamification layer that turns studying into a game.",
      },
      media: [
        {
          src: "/projects/squizzu-app-preview.jpg",
          kind: "image",
          alt: {
            pl: "Logo Squizzu: uśmiechnięta żółta ośmiornica w okrągłych okularach obok napisu SQUIZZU w zaokrąglonym, żartobliwym kroju.",
            en: "The Squizzu logo: a smiling yellow octopus in round glasses beside the SQUIZZU wordmark in a rounded, playful typeface.",
          },
        },
        {
          src: "/projects/squizzu-landing-preview.jpg",
          kind: "image",
          alt: {
            pl: "Strona główna squizzu.com w oknie przeglądarki: nagłówek Boost Your Confidence Quiz by Quiz, przyciski Get started i How it works, wokół nich ikony kategorii technologicznych na ciemnym tle.",
            en: "The squizzu.com homepage in a browser window: the headline Boost Your Confidence Quiz by Quiz, the Get started and How it works buttons, and technology-category icons on a dark background.",
          },
        },
      ],
    },
    outcome: {
      narrative: {
        pl: "Na warstwie grywalizacji, którą zaprojektowałem i wdrożyłem, platforma urosła od zera do ponad tysiąca użytkowników.",
        en: "On the gamification layer I designed and shipped, the platform grew from zero to over a thousand users.",
      },
      metrics: [
        {
          value: "0 → 1,000+",
          label: { pl: "użytkowników", en: "users" },
        },
      ],
    },
    reflection: {
      pl: "Definicja, marka i kod w jednej głowie sprawiają, że szwy między nimi znikają — produkt zachowuje się spójnie, bo nikt nie musiał zgadywać cudzych intencji.",
      en: "Definition, brand and code in one head keep the seams between them invisible — the product feels coherent because nobody had to guess at someone else's intent.",
    },
  },

  "ultra-studio": {
    slug: "ultra-studio",
    client: "Ultra Studio",
    tag: { pl: "Branding + strona studia", en: "Branding + studio site" },
    role: {
      pl: "Co-Founder, Design & Development",
      en: "Co-Founder, Design & Development",
    },
    period: { pl: "sie 2024 - dziś", en: "Aug 2024 - present" },
    gradient: "linear-gradient(145deg, #0A0A0C 0%, #1D1D1F 45%, #C2410C 130%)",
    cover: {
      src: "/projects/ultrastudio-case2.jpg",
      kind: "image",
      alt: {
        pl: "Laptop na czarnym tle ze stroną ultrastud.io: logo „us.”, hasło „branding & web design” i wielki napis ultrastud.io u dołu.",
        en: "A laptop on a black background showing the ultrastud.io homepage: the “us.” logo, the headline “branding & web design”, and a large ultrastud.io wordmark below.",
      },
    },
    links: { live: "https://ultrastud.io" },
    problem: {
      pl: "Własna marka to najtrudniejszy brief studia: musi przejść dokładnie tę poprzeczkę, którą stawiamy płatnym klientom. Ultra Studio potrzebowało tożsamości i strony, które są jego najlepszą wizytówką — i sposobu pracy, w którym projekt trafia na żywo bez utraty kontroli nad detalem.",
      en: "A studio's own brand is its hardest brief: it has to clear the exact bar we set for paying clients. Ultra Studio needed an identity and a site that were its best calling card — and a way of working where design ships live without losing control of the detail.",
    },
    context: [
      {
        pl: "Branding z wyższej półki, web design i custom development — kliencka, wizualna strona mojego profilu.",
        en: "High-end branding, web design and custom development — the client-facing, visual side of my profile.",
      },
      {
        pl: "To okno jest hubem: pełne case'y klientów (Alumed, Printly, Venor, identyfikacja Squizzu) żyją w osobnych oknach.",
        en: "This window is the hub: the full client cases (Alumed, Printly, Venor, the Squizzu identity) live in their own windows.",
      },
    ],
    process: {
      note: {
        pl: "Strona jest zbudowana we Framerze, więc decyzja projektowa trafia na żywo tego samego dnia — bez oddawania kontroli nad detalem i wydajnością, bez czekania na osobny build.",
        en: "The site is built in Framer, so a design decision goes live the same day — without giving up control over detail or performance, and without waiting on a separate build step.",
      },
      media: [],
    },
    decisions: [
      {
        decision: {
          pl: "Ta sama poprzeczka, co dla klientów: markę i stronę studia dopracowaliśmy równie skrupulatnie jak każdy projekt klientowski.",
          en: "The same bar as for clients: we crafted the studio's own brand and site with the same rigour as any client project.",
        },
        rationale: {
          pl: "To nasza najlepsza wizytówka. Studio, które ścina zakręty na sobie, nie może prosić klientów o zaufanie.",
          en: "It's our best calling card. A studio that cuts corners on itself can't ask clients to trust it.",
        },
      },
      {
        decision: {
          pl: "Budowa we Framerze zamiast klasycznego przekazania do developmentu.",
          en: "Build in Framer instead of a classic design-to-dev handoff.",
        },
        rationale: {
          pl: "Pętla między projektem a wersją live zostaje krótka, a kontrola nad detalem i wydajnością — po naszej stronie.",
          en: "The loop between design and the live site stays short, and control over detail and performance stays with us.",
        },
      },
      {
        decision: {
          pl: "Autonomiczny agent AI, który crawluje strony klientów i sam generuje dane strukturalne JSON-LD.",
          en: "An autonomous AI agent that crawls client sites and generates their JSON-LD structured data on its own.",
        },
        rationale: {
          pl: "Pozycjonowanie ma napędzać kod pracujący w tle, a nie ręczna, powtarzalna robota.",
          en: "Rankings should be driven by code running in the background, not by manual, repetitive busywork.",
        },
      },
    ],
    solution: {
      summary: {
        pl: "Marka i strona studia zbudowane we Framerze, spięte z autorskim narzędziem SEO — i będące bramą do realnych realizacji klientowskich, którym poświęcone są osobne case'y.",
        en: "The studio's brand and site built in Framer, wired to an in-house SEO tool — and serving as the gateway to the real client work that has its own dedicated cases.",
      },
      media: [],
    },
    reflection: {
      pl: "Ultra Studio to designowa strona mojego profilu, nie pojedynczy problem UX. Jego siłą jest to, do czego prowadzi: cztery prawdziwe realizacje i narzędzie, które sam zbudowałem.",
      en: "Ultra Studio is the design side of my profile, not a single UX problem. Its strength is what it leads to: four real projects and a tool I built myself.",
    },
  },

  venor: {
    slug: "venor",
    client: "Venor",
    tag: { pl: "Narzędzie wewnętrzne", en: "Internal tool" },
    role: {
      pl: "Projekt i budowa, samodzielnie",
      en: "Solo design and build",
    },
    // Prawdziwe pole marki: Brand Dark przechodzący w Deep Mulberry
    // z brandbooka — case i ikona aplikacji niosą jedną tożsamość.
    gradient: "linear-gradient(145deg, #171216 0%, #2B1622 55%, #8A2853 150%)",
    cover: null,
    problem: {
      pl: "Ultra Studio potrzebowało stałego sposobu na znajdowanie i kwalifikowanie właściwych firm do kontaktu — i na zaufanie tej krótkiej liście. Trudne nie jest zebranie nazw, tylko wyprodukowanie oceny, którą da się wyjaśnić, bez udawania większej wiedzy niż się ma.",
      en: "Ultra Studio needed a steady way to find and qualify the right companies to reach out to — and to trust that shortlist. The hard part isn't collecting names; it's producing a score you can actually explain, without pretending to know more than you do.",
    },
    context: [
      {
        pl: "To nie jest produkt na sprzedaż: nie ma użytkowników, rejestracji ani billingu.",
        en: "This is not a product for sale: no users, no sign-up, no billing.",
      },
      {
        pl: "Repozytorium prywatne, w codziennym użyciu w studiu; działa na publicznych źródłach.",
        en: "A private repository, in daily use at the studio; it runs on public sources.",
      },
    ],
    architecture: {
      summary: {
        pl: "Ciężka praca — odkrywanie firm, crawle Playwright i Lighthouse, wizualna ocena strony przez Claude'a — leci lokalnie jako skrypty CLI i zapisuje gotowy results.json. Panel na Vercelu tylko go czyta, więc Chromium, pamięć i długie zadania kończą się na kresce wdrożenia; po drugiej stronie zostaje lekki CRUD.",
        en: "The heavy work — discovery, Playwright and Lighthouse crawls, Claude's visual read of each site — runs locally as CLI scripts and writes a finished results.json. The panel on Vercel only reads it, so Chromium, memory and long-running jobs stop at the deployment line; past it there's nothing but light CRUD.",
      },
      diagram: { component: "VenorPipeline" },
    },
    decisions: [
      {
        decision: {
          pl: "Przeglądarka trzymana z dala od serwera: Playwright, Lighthouse i Claude działają lokalnie, panel dostaje gotowy JSON.",
          en: "Keep the browser off the server: Playwright, Lighthouse and Claude run locally, the panel gets finished JSON.",
        },
        rationale: {
          pl: "Chromium nigdy nie powinien startować w funkcji serverless.",
          en: "Chromium should never boot inside a serverless function.",
        },
      },
      {
        decision: {
          pl: "Ocena, którą da się wyjaśnić, a nie magiczna liczba: pięć wymiarów, wagi kampanii walidowane do sumy 1, pewność danych raportowana osobno.",
          en: "An explainable score, not a magic number: five dimensions, campaign weights validated to sum to 1, data confidence reported separately.",
        },
        rationale: {
          pl: "Wynik, który potrafisz uzasadnić, jest wart więcej niż taki, który tylko pokazujesz.",
          en: "A score you can justify is worth more than one you can only display.",
        },
      },
      {
        decision: {
          pl: "Praca, która przeżywa ponowny przebieg: analityka i stan CRM w dwóch magazynach, kluczowane przez workspace, kampanię i firmę.",
          en: "Work that survives a re-run: analytics and CRM state in two stores, keyed by workspace, campaign and company.",
        },
        rationale: {
          pl: "Ponowny eksport świeżych danych nie może skasować dnia pracy w CRM.",
          en: "Re-exporting fresh data must never wipe a day of CRM work.",
        },
      },
      {
        decision: {
          pl: "Eksporty budowane w przeglądarce: audyt PDF i CSV powstają po stronie klienta.",
          en: "Exports built in the browser: the audit PDF and CSV are generated client-side.",
        },
        rationale: {
          pl: "Bez endpointu, bez kolejki zadań, bez Chromium po stronie serwera.",
          en: "No endpoint, no job queue, no server-side Chromium.",
        },
      },
      {
        decision: {
          pl: "Wybrałem znak, który odmawia składania obietnic: jedna obserwacja ustępująca zrównoważonemu wnioskowi, celowo nie strzałka, wykres, sieć ani cel.",
          en: "I chose a mark that refuses to overpromise: one observation yielding to a counterweighted conclusion, deliberately not an arrow, chart, network or target.",
        },
        rationale: {
          pl: "Uczciwość produktu polega na tym, że dowód prowadzi do przemyślanego następnego kroku, a nie do gwarantowanego wyniku. Forma musiała nieść tę samą granicę — mieć kierunek, ale nigdy nie twierdzić wyniku.",
          en: "The product's honesty is that evidence leads to a reasoned next action, not a guaranteed outcome. The form had to carry that same boundary — directional, but never claiming a result.",
        },
      },
      {
        decision: {
          pl: "Wybierałem przez system, nie nastrój: 374 kandydatów, kolejne listy skrótowe i prompt dopracowania z zablokowaną formą, wydestylowany z siedmiu wyborów.",
          en: "I picked by system, not mood: 374 candidates, successive shortlists, and a form-locked refinement prompt distilled from seven picks.",
        },
        rationale: {
          pl: "Faworyt z jednej sesji byłby zgadywaniem. Zawężenie 374 znaków przez jawne listy skrótowe i spisany kontrakt gustu sprawiło, że ostateczny wybór jest powtarzalny i możliwy do obrony, a nie kwestią chwilowego smaku.",
          en: "A single-session favourite would have been a guess. Narrowing 374 marks through explicit shortlists and a written taste contract made the final choice reproducible and defensible, not a matter of taste on the day.",
        },
      },
    ],
    solution: {
      summary: {
        pl: "System prospectingu, który prowadzi pracę od surowego sygnału do następnego działania: odkrywa firmy z publicznych źródeł, ocenia ich dopasowanie do konkretnej usługi i trzyma stan follow-upu — bez ciężkiego back-endu.",
        en: "A prospecting system that carries the work from a raw signal to the next action: it discovers companies from public sources, scores their fit to a specific service and keeps the follow-up state — with no heavyweight backend.",
      },
      /**
       * Kadry z wbudowanego generatora materiałów demo: dziesięć jawnie
       * fikcyjnych firm, odizolowany CRM, przywrócenie prywatnego eksportu
       * bajt w bajt. Zrzut z realnymi firmami nigdy nie może tu trafić.
       */
      media: [
        {
          src: "/projects/venor/app/panel-evidence.png",
          kind: "image",
          alt: {
            pl: "Panel Venora z otwartą szufladą dowodów: wynik kampanii 73/100, osobno raportowana pewność kwalifikacji 0,84, plakietka „Wymaga sprawdzenia” i zacytowane sygnały. Dane pokazowe — fikcyjne firmy.",
            en: "The Venor panel with the evidence drawer open: a 73/100 campaign score, qualification confidence of 0.84 reported separately, a “needs checking” badge and quoted signals. Demo data — fictional companies.",
          },
          caption: {
            pl: "Szuflada dowodów: wynik, którego można się doczepić — pewność danych osobno, sygnały zacytowane, niepewność oznaczona. Kadry z danych pokazowych (fikcyjne firmy).",
            en: "The evidence drawer: a score you can interrogate — data confidence reported separately, signals quoted, uncertainty flagged. Captured on demo data (fictional companies).",
          },
        },
        {
          src: "/projects/venor/app/panel-ranking.png",
          kind: "image",
          alt: {
            pl: "Ranking leadów w panelu Venora: firmy z priorytetami 92, 86 i 78 na 100, pasmami A/B i akcjami kontaktu; filtry kampanii u góry. Dane pokazowe — fikcyjne firmy.",
            en: "The Venor lead ranking: companies scored 92, 86 and 78 out of 100 with A/B bands and contact actions; campaign filters above. Demo data — fictional companies.",
          },
          caption: {
            pl: "Ranking per kampania: liczba nigdy nie występuje sama — obok zawsze stoi pasmo priorytetu i następna akcja. Dane pokazowe.",
            en: "Per-campaign ranking: a number never stands alone — a priority band and the next action always sit beside it. Demo data.",
          },
        },
        {
          src: "/projects/venor/app/mini-audit.png",
          kind: "image",
          alt: {
            pl: "Jednostronicowy mini-audyt PDF wygenerowany w przeglądarce: kadr strony, potencjał zmiany 92/100, obserwacje, wskaźniki techniczne, oceny doświadczenia i rekomendowany punkt rozmowy. Dane pokazowe.",
            en: "A one-page mini-audit PDF generated in the browser: a site frame, a 92/100 change-potential score, observations, technical metrics, experience ratings and a recommended talking point. Demo data.",
          },
          caption: {
            pl: "Mini-audyt składany w całości po stronie klienta — bez endpointu i bez Chromium na serwerze — ze stopką, która uczciwie nazywa materiał orientacyjnym. Dane pokazowe.",
            en: "The mini-audit assembled entirely client-side — no endpoint, no server Chromium — with a footer that honestly calls the material indicative. Demo data.",
          },
        },
      ],
    },
    brand: {
      intro: {
        pl: "Znak to jedna niewielka obserwacja ustępująca większemu, zrównoważonemu przeciwwagą wnioskowi, ustawiona na osi 45 stopni. Jest celowo abstrakcyjny — żadnej strzałki, wykresu, sieci ani obietnicy wyniku — relacja ma kierunek, ale niczego nie deklaruje. Odbija to, co Venor naprawdę robi: dowód staje się przemyślanym następnym krokiem, a o budżecie czy zamiarach firmy nic się nie twierdzi.",
        en: "The mark is one small observation yielding to a larger, counterweighted conclusion, set on a 45-degree bearing. It stays abstract on purpose — no arrow, no chart, no network, no promise of an outcome — a relationship that has direction without claiming a result. It mirrors what Venor actually does: evidence becomes a reasoned next action, and nothing about a company's budget or intent is asserted.",
      },
      lockup: {
        light: "/projects/venor/lockup.svg",
        dark: "/projects/venor/lockup-dark.svg",
        // Powierzchnie plakiet wprost z brandbooka: Brand Paper i Brand Dark.
        surfaces: { light: "#FCFAFB", dark: "#171217" },
      },
      typography: {
        pl: "Logotyp to zawsze pisane małą literą venor, złożone w Instrument Sans SemiBold (600) z trackingiem −0,025em, dostarczane jako obrysowane ścieżki glifów — lockup nie ma żadnej zależności od fontu w czasie działania.",
        en: "The wordmark is always lowercase venor, set in Instrument Sans SemiBold (600) at −0.025em tracking, shipped as outlined glyph paths — the lockup carries no runtime font dependency.",
      },
      explorations: {
        note: {
          pl: "Znak wyłonił się z 374 kandydatów w czterech rundach w ciągu trzech dni: najpierw sześć geometrycznych kierunków, potem dwadzieścia dwa tory oparte na researchu, następnie runda dopracowania z zablokowaną formą, a na końcu organiczna fala pod kontraktem na jakość krzywej. Dziesięciu finalistów niżej; zwycięzca, Final Weight, pochodzi z rundy dopracowania.",
          en: "The mark came out of 374 candidates across four rounds in three days: six geometric direction lanes first, then twenty-two research-driven lanes, then a form-locked refinement round, and finally an organic wave held to a curve-quality contract. The ten finalists are below; the winner, Final Weight, came from the refinement round.",
        },
        marks: [
          {
            src: "/projects/venor/explorations/signal-trail.svg",
            name: "Signal Trail",
            caption: {
              pl: "Trzy obserwacje nabierają pewności, zbliżając się do stałego punktu — narastanie czytelne bez strzałek i linii ruchu.",
              en: "Three observations gain confidence as they approach a solid fix — accumulation made legible without arrows or speed lines.",
            },
          },
          {
            src: "/projects/venor/explorations/closing-trace.svg",
            name: "Closing Trace",
            caption: {
              pl: "Pięć kropek zbiega się po osi 45 stopni, gdy odstęp i skala się domykają — obserwowany rytm staje się wybranym momentem działania.",
              en: "Five dots converge on a 45-degree trace, spacing and scale closing in — observed cadence becoming a chosen moment to act.",
            },
          },
          {
            src: "/projects/venor/explorations/lattice-v.svg",
            name: "Lattice V",
            caption: {
              pl: "Pięć równych sygnałów w precyzyjnej literze V, jeden punkt domyka zejście — poszukiwanie sprowadzone do najprostszego odczytu.",
              en: "Five equal signals in a precise V lattice, one point completing the descent — the hunt reduced to its simplest read.",
            },
          },
          {
            src: "/projects/venor/explorations/convergent-fix.svg",
            name: "Convergent Fix",
            caption: {
              pl: "Dwa punktowe namiary zbiegają się z szerokiego pola w jeden punkt z przodu — pościg i działanie, bez oklepanego zamkniętego V.",
              en: "Two dotted bearings converge from a wide field into one forward fix — pursuit and action, without the enclosed-V cliché.",
            },
          },
          {
            src: "/projects/venor/explorations/held-eclipse.svg",
            name: "Held Eclipse",
            caption: {
              pl: "Jeden dysk wysuwa się nad drugi po osi 45 stopni, zostawiając rozstrzygnięty półksiężyc — pościg oddany bez strzałki i dosłownego celu.",
              en: "One disc advances over another on a 45-degree bearing, leaving a resolved crescent — pursuit carried without an arrow or a literal target.",
            },
          },
          {
            src: "/projects/venor/explorations/folded-ridge.svg",
            name: "Folded Ridge",
            caption: {
              pl: "Płytka grań w kształcie V składa się w aksonometryczną bryłę; jedna ściana zmienia kontur w ukierunkowaną formę.",
              en: "A shallow V ridge folds into an axonometric solid; one face turns the outline into a directional volume.",
            },
          },
          {
            src: "/projects/venor/explorations/blue-limb.svg",
            name: "Blue Limb",
            caption: {
              pl: "Dwa równe dyski zachodzą na siebie po osi 45 stopni, widoczna zostaje tylko wysuwająca się krawędź.",
              en: "Two equal discs overlap on a 45-degree axis, leaving only the advancing limb visible.",
            },
          },
          {
            src: "/projects/venor/explorations/steady-bearing.svg",
            name: "Steady Bearing",
            caption: {
              pl: "Stromy, trzykamienny namiar sprowadza poszukiwanie do jednej pewnej, organicznej masy.",
              en: "A steep three-stone bearing compresses the hunt into one confident, organic mass.",
            },
          },
          {
            src: "/projects/venor/explorations/bronze-sweep.svg",
            name: "Bronze Sweep",
            caption: {
              pl: "Niskie, szerokie V sprawia wrażenie odlanego i osadzonego; wyśrodkowany punkt spina szeroką sylwetkę.",
              en: "A low, wide V feels cast and settled; a centred counter-fix holds the broad silhouette together.",
            },
          },
          {
            src: "/projects/venor/explorations/final-weight.svg",
            name: "Final Weight",
            winner: true,
            caption: {
              pl: "Jedna szeroka obserwacja ustępuje większemu, precyzyjnie zrównoważonemu wnioskowi.",
              en: "One broad observation yields to a larger, precisely counterweighted conclusion.",
            },
          },
        ],
      },
      construction: {
        component: "VenorConstruction",
        note: {
          pl: "Konstrukcja to siatka 64 jednostek: obserwacja tuszem o promieniu 8 w punkcie (20, 20) i wniosek w kolorze Deep Mulberry o promieniu 12 w punkcie (37,33, 37,33), stosunek pól 4:9 na osi 45 stopni. Ważony tymi polami środek ciężkości pary trafia dokładnie w (32, 32), środek pola konstrukcji.",
          en: "The construction is a 64-unit grid: an r8 ink observation at (20, 20) and an r12 Deep Mulberry conclusion at (37.33, 37.33), a 4:9 area ratio on a 45-degree bearing. Weighted by those areas, the pair's centroid lands exactly at (32, 32), the centre of the box.",
        },
      },
      palette: {
        note: {
          pl: "Formę zamknięto, zanim wybrano jakikolwiek kolor. Deep Mulberry #8A2853 wybrano jako kierunek produkcyjny 17.08.2026, z mierzonym kontrastem 8,05:1 na Paper; na ciemnym tle rdzeniowy akcent spada do 2,21:1, więc wymagany jest tam wariant Night Mulberry.",
          en: "The form was locked before any colour was chosen. Deep Mulberry #8A2853 was selected as the production direction on 2026-08-17, with a measured 8.05:1 contrast on Paper; on a dark field the core accent drops to 2.21:1, so a Night Mulberry variant is required there.",
        },
        colors: [
          {
            name: "Deep Mulberry",
            value: "#8A2853",
            role: {
              pl: "wniosek w znaku i akcent marki na jasnych polach",
              en: "the conclusion circle and brand accent on light surfaces",
            },
          },
          {
            name: "Brand Ink",
            value: "#171216",
            role: {
              pl: "obserwacja w znaku, logotyp i tekst",
              en: "the mark's observation, wordmark and primary text",
            },
          },
          {
            name: "Brand Paper",
            value: "#FCFAFB",
            role: {
              pl: "główne tło redakcyjne",
              en: "the primary editorial background",
            },
          },
          {
            name: "Mulberry Display",
            value: "#D77BA2",
            role: {
              pl: "wniosek na ciemnym polu (Night Mulberry)",
              en: "the conclusion on dark fields (Night Mulberry)",
            },
          },
        ],
        explored: {
          note: {
            pl: "Sześć rozważanych, lecz niezatwierdzonych kierunków — kobalt, bursztyn, sosnowa zieleń, fiolet, koral i morski — pozostaje historią decyzji, nie opcjami.",
            en: "Six explored-but-not-approved directions — cobalt, amber, pine, violet, coral and teal — are kept as decision history, not as options.",
          },
          marks: [
            {
              src: "/projects/venor/colors/color-03.svg",
              name: "Cobalt Majority",
            },
            {
              src: "/projects/venor/colors/color-05.svg",
              name: "Burnished Amber",
            },
            { src: "/projects/venor/colors/color-06.svg", name: "Pine Green" },
            {
              src: "/projects/venor/colors/color-07.svg",
              name: "Quiet Violet",
            },
            { src: "/projects/venor/colors/color-08.svg", name: "Clay Coral" },
            { src: "/projects/venor/colors/color-09.svg", name: "Deep Teal" },
          ],
        },
      },
    },
    boundary: {
      pl: "Venor wykrywa dopasowanie, potrzebę i sygnał momentu. Nie wie, czy firma ma budżet ani czy zamierza kupić, więc decyzję o kontakcie zawsze podejmuje człowiek. Świadomie nie ma tu też liczby firm w bazie ani skuteczności scoringu: pierwsze reklamowałoby prywatną bazę z danymi realnych firm, drugiego nie zmierzono.",
      en: "Venor detects fit, need and timing signals. It doesn't know whether a company has a budget or intends to buy, so the decision to reach out is always a person's. There are also deliberately no database sizes or scoring-accuracy figures here: one would advertise a private database of real companies, the other hasn't been measured.",
    },
  },

  alumed: {
    slug: "alumed",
    client: "Alumed",
    tag: {
      pl: "UX design + web development",
      en: "UX design + web development",
    },
    role: {
      pl: "Projekt UX i realizacja front-endu",
      en: "UX design and front-end build",
    },
    gradient: "linear-gradient(135deg, #1D1D1F 0%, #6E6E73 100%)",
    cover: {
      src: "/projects/alumed.jpg",
      kind: "image",
      alt: {
        pl: "MacBook na jasnym tle ze stroną alumed.mx: kliniki medycyny estetycznej, nagłówek „Medicina Estética Avanzada”, zdjęcie twarzy w ujęciu przed/po oraz przyciski kontaktu i rezerwacji.",
        en: "A MacBook on a light background showing alumed.mx: an aesthetic-medicine clinic, the headline “Medicina Estética Avanzada”, a before/after face image, and contact and booking buttons.",
      },
    },
    links: { live: "https://alumed.mx" },
    problem: {
      pl: "Klinika medycyny estetycznej z segmentu premium potrzebowała strony, która wygląda tak ekskluzywnie jak sama praktyka — a jednocześnie ładuje się błyskawicznie i zostaje łatwa w edycji dla zespołu. Te trzy siły zwykle ze sobą walczą.",
      en: "A premium aesthetic-medicine clinic needed a site that looks as exclusive as the practice itself — while loading instantly and staying easy for the team to edit. Those three pulls usually fight each other.",
    },
    decisions: [
      {
        decision: {
          pl: "Doświadczenie zaprojektowane od zera, bez szablonu.",
          en: "The experience designed from scratch, no template.",
        },
        rationale: {
          pl: "Klinika premium nie może wyglądać jak gotowy motyw; wrażenie ekskluzywności musiało być skrojone na miarę.",
          en: "A premium clinic can't look like an off-the-shelf theme; the exclusive feel had to be bespoke.",
        },
      },
      {
        decision: {
          pl: "Lekki, w pełni customowy HTML, CSS i JavaScript na skrojonej strukturze WordPressa.",
          en: "Lightweight, fully custom HTML, CSS and JavaScript on a tailored WordPress structure.",
        },
        rationale: {
          pl: "Ręcznie pisany front-end trzyma błyskawiczne ładowanie, a WordPress pod spodem zostawia stronę edytowalną dla nietechnicznego zespołu.",
          en: "A hand-written frontend keeps it loading fast, while WordPress underneath leaves the site editable for a non-technical team.",
        },
      },
    ],
    solution: {
      summary: {
        pl: "Skrojona, szybko ładująca się strona osadzona na strukturze WordPressa, którą zespół kliniki prowadzi samodzielnie.",
        en: "A bespoke, fast-loading site on a WordPress structure the clinic's team runs themselves.",
      },
      media: [],
    },
  },

  printly: {
    slug: "printly",
    client: "Printly",
    tag: {
      pl: "UX/UI + architektura informacji",
      en: "UX/UI + information architecture",
    },
    role: {
      pl: "UX/UI i architektura informacji",
      en: "UX/UI and information architecture",
    },
    period: { pl: "kwi 2024 · 7–8 tygodni", en: "Apr 2024 · 7–8 weeks" },
    gradient: "linear-gradient(135deg, #40180A 0%, #C2410C 100%)",
    cover: {
      src: "/projects/printly.jpg",
      kind: "image",
      alt: {
        pl: "Plenerowe nośniki reklamowe z identyfikacją Printly: pomarańczowe plakaty z hasłem „follow your prints.” i znakiem „p”, adres printly.pl oraz kadr z pracownikiem drukarni.",
        en: "Outdoor advertising mockups carrying the Printly identity: orange posters reading “follow your prints.” with the “p” mark, the printly.pl address, and a shot of a print-shop worker.",
      },
    },
    links: {
      external: {
        url: "https://ultrastud.io/portfolio/printly",
        label: {
          pl: "Zobacz case study na ultrastud.io",
          en: "See the case study on ultrastud.io",
        },
      },
    },
    problem: {
      pl: "Checkout B2B dla druku to dziesiątki wariantów: formaty, gramatury, uszlachetnienia, nakłady i wyceny. Klienci gubili się, zanim sfinalizowali zamówienie.",
      en: "A B2B print checkout means dozens of variables: formats, paper weights, finishes, volumes and quotes. Customers were getting lost before they finished an order.",
    },
    context: [
      {
        pl: "Printly to nowoczesna drukarnia internetowa z Suwałk, która szybko wyrasta na lidera w swojej branży.",
        en: "Printly is a modern online printing house from Suwałki, rapidly becoming a leader in its industry.",
      },
      {
        pl: "Zakres: identyfikacja wizualna, projekt UI/UX i responsywna strona zbudowana wokół prostego procesu składania zamówień.",
        en: "Scope: a visual identity, UI/UX design and a responsive site built around a simple order-placement process.",
      },
    ],
    architecture: {
      summary: {
        pl: "Przeprojektowałem architekturę informacji od zera, tak żeby katalog i proces zamówienia odwzorowywały to, jak kupujący naprawdę dobiera zlecenie druku.",
        en: "I redesigned the information architecture from the ground up, so the catalogue and the order flow map to how a buyer actually specifies a print job.",
      },
    },
    process: {
      note: {
        pl: "Praca jest udokumentowana na 17 artboardach w Adobe XD: dwa rozrysowane kierunki strony głównej na desktopie (v1 i v2), widoki kategorii i produktu na desktopie i mobile, osobny wariant zamówienia „Mam projekt”, megamenu, listing, koszyk i ekran zamówienia oraz pięcioekranowa sekcja „Moje konto”, w której szczegóły zamówienia niosą stepper statusu dostawy. Wcześniejszy plik zapasowy trzyma poprzednią generację, więc „przed i po” jest realne.",
        en: "The work is documented across 17 Adobe XD artboards: two explored directions for the desktop homepage (v1 and v2), category and product views for desktop and mobile, a dedicated “I have a project” ordering variant, a megamenu, listing, cart and order screens, and a five-screen account area whose order detail carries a delivery-status stepper. An earlier backup file holds the previous generation, so the before-and-after is real.",
      },
      media: [],
    },
    decisions: [
      {
        decision: {
          pl: "Architektura informacji przebudowana od podstaw.",
          en: "The information architecture rebuilt from the ground up.",
        },
        rationale: {
          pl: "Problemem była złożoność katalogu; jego reorganizacja była rozwiązaniem, a nie ozdobą.",
          en: "The catalogue's complexity was the problem; reorganising it was the fix, not decoration.",
        },
      },
      {
        decision: {
          pl: "Złożony checkout B2B rozłożony na elegancki, kilkukrokowy przepływ, który prowadzi za rękę.",
          en: "A complex B2B checkout broken into an elegant, guided multi-step flow.",
        },
        rationale: {
          pl: "Dziesiątki powiązanych zmiennych przytłaczają w jednym formularzu; krok po kroku prowadzi kupującego bez gubienia się.",
          en: "Dozens of interacting variables overwhelm a single form; step by step leads the buyer without them getting lost.",
        },
      },
      {
        decision: {
          pl: "Osobna ścieżka „Mam projekt” obok przeglądania katalogu.",
          en: "A dedicated “I have a project” path alongside browsing the catalogue.",
        },
        rationale: {
          pl: "Kupujący z gotowym plikiem potrzebuje innej drogi niż ten, który dopiero dobiera produkt.",
          en: "A buyer arriving with a ready file needs a different route than one still choosing a product.",
        },
      },
      {
        decision: {
          pl: "Desktop i mobile projektowane razem, nie po kolei.",
          en: "Desktop and mobile designed together, not one after the other.",
        },
        rationale: {
          pl: "Zamówienia B2B na druk składa się z obu urządzeń; przepływ musiał trzymać się także na telefonie.",
          en: "B2B print orders come from both; the flow had to hold up on a phone as well.",
        },
      },
    ],
    solution: {
      summary: {
        pl: "Spójna wizualnie z marką, responsywna strona zbudowana wokół prostego, intuicyjnego procesu zamawiania — oddana z brandbookiem, plikami źródłowymi, dokumentacją i dostępem do CMS-a.",
        en: "A brand-consistent, responsive site built around a simple, intuitive ordering process — delivered with a brandbook, source files, documentation and CMS access.",
      },
      media: [],
    },
    reflection: {
      pl: "Cała robota sprowadzała się do redukcji złożoności: nie dodać kolejnych opcji, tylko ułożyć te istniejące tak, żeby zamówienie samo się prowadziło.",
      en: "The whole job came down to reducing complexity: not adding more options, but arranging the existing ones so the order almost places itself.",
    },
  },

  "drone-path": {
    slug: "drone-path",
    client: "Drone Simulation",
    tag: {
      pl: "Symulacja 3D · optymalizacja flot",
      en: "3D simulation · fleet optimization",
    },
    role: {
      pl: "Autor: badania, algorytmy i implementacja",
      en: "Author: research, algorithms and implementation",
    },
    period: {
      pl: "Praca dyplomowa 2023, rozwijana od tego czasu",
      en: "Dissertation 2023, developed since",
    },
    gradient: "linear-gradient(150deg, #FF9F0A 0%, #FF375F 100%)",
    cover: {
      src: "/images/drone-sim.mp4",
      kind: "video",
      alt: {
        pl: "Zapętlony kadr z symulacji 3D: drony dostawcze prowadzą bezkolizyjne trasy nad siatką miasta z drogami i wieżowcami.",
        en: "A looping capture of the 3D simulation: delivery drones fly collision-free routes over a city grid of roads and skyscrapers.",
      },
    },
    links: {
      live: "https://jacobwysocki.github.io/drone-path-optimization/",
      repo: "https://github.com/jacobwysocki/drone-path-optimization",
      embed: true,
    },
    problem: {
      pl: "Mając zestaw dostaw dronami: jaka najmniejsza flota zrealizuje je bezpiecznie w limitach baterii i udźwigu — i jak poprowadzić ją przez trójwymiarową przestrzeń powietrzną bez kolizji?",
      en: "Given a set of drone deliveries: what is the smallest fleet that can complete them safely within battery and payload limits — and how do you route it through 3D airspace without collisions?",
    },
    context: [
      {
        pl: "Zaczęło się jako projekt badawczy na ostatnim roku w Northumbria University; dziś to pełne przepisanie 3D.",
        en: "It started as a final-year research project at Northumbria University; today it's a full 3D rewrite.",
      },
    ],
    discovery: {
      method: {
        pl: "Badania na ostatnim roku studiów (dyplom z wyróżnieniem, First Class Honours).",
        en: "Final-year academic research (First Class Honours).",
      },
      findings: [
        {
          pl: "Klasyczne A* i Dijkstra dają krótsze trasy pojedynczych dronów, ale przeprowadzają je przez siebie nawzajem — i to jest właśnie uzasadnienie dla kooperacyjnego, wieloagentowego pathfindera.",
          en: "Classic A* and Dijkstra find shorter individual paths, but they fly the drones through each other — which is precisely what motivates a cooperative, multi-agent pathfinder.",
        },
      ],
    },
    architecture: {
      summary: {
        pl: "Trzyetapowy potok, każdy etap rozwiązuje inny znany podproblem: K-Means grupuje dostawy przestrzennie, Ant Colony Optimization układa kolejność wizyt jako problem komiwojażera (15 mrówek, 50 iteracji), a Cooperative A* szuka trasy w stanie czasoprzestrzennym (wiersz, kolumna, wysokość, czas) względem wspólnej tablicy rezerwacji.",
        en: "A three-stage pipeline, each stage solving a different well-known sub-problem: K-Means groups deliveries spatially, Ant Colony Optimization orders the visits as a Travelling Salesperson problem (15 ants, 50 iterations), and Cooperative A* searches a space-time state (row, column, altitude, time) against a shared reservation table.",
      },
    },
    process: {
      note: {
        pl: "Pierwsza wersja to autorska platforma w React.js; od tego czasu przepisana w pełne 3D na Three.js z react-three-fiber, a wszystkie pięć algorytmów napisane od zera w czystym JavaScripcie, bez bibliotek.",
        en: "The first version was a custom React.js platform; it's since been rewritten in full 3D on Three.js with react-three-fiber, with all five algorithms written from scratch in plain JavaScript, no libraries.",
      },
      media: [],
    },
    decisions: [
      {
        decision: {
          pl: "Uczynić nieprzejrzysty algorytm czytelnym: całą misję plan, animacja i narracja na żywo w terminalu symulacji.",
          en: "Make an opaque algorithm legible: plan, animate and narrate the whole mission live in a simulation terminal.",
        },
        rationale: {
          pl: "Wieloagentowy router jest niewidoczny; pokazanie, jak grupuje, trasuje i wraca po doładunek, to jedyny sposób, żeby widz naprawdę go zrozumiał.",
          en: "A multi-agent router is invisible; showing it cluster, route and return to reload is the only way a viewer can actually understand it.",
        },
      },
      {
        decision: {
          pl: "Pokazać punkt odniesienia, żeby trudna część była widoczna: A* i Dijkstra zaimplementowane obok kooperacyjnego pathfindera.",
          en: "Show the baseline so the hard part is visible: A* and Dijkstra implemented alongside the cooperative pathfinder.",
        },
        rationale: {
          pl: "Widok tego, jak baza rozbija drony o siebie, tłumaczy sens wariantu wieloagentowego lepiej niż jakikolwiek opis.",
          en: "Watching the baseline crash the drones into each other explains why the multi-agent variant exists better than any prose.",
        },
      },
      {
        decision: {
          pl: "Cooperative A* w stanie czasoprzestrzennym, z rezerwacjami na wierzchołkach i krawędziach oraz asymetrycznymi kosztami ruchu (lot poziomy 1, wznoszenie 2, opadanie 0,5).",
          en: "Cooperative A* over space-time, with vertex and edge reservations and asymmetric move costs (flat flight 1, climbing 2, descending 0.5).",
        },
        rationale: {
          pl: "Tylko tak dwa drony nie przenikną przez siebie zamianą pozycji, a przelot nad budynkiem opłaca się jedynie wtedy, gdy jest tańszy od czekania.",
          en: "It's the only way two drones can't swap through each other, and flying over a building pays off only when it beats waiting.",
        },
      },
    ],
    solution: {
      summary: {
        pl: "Interaktywna symulacja 3D: rozstaw cele dostaw na siatce miasta, podaj wielkość floty albo pozwól aplikacji wyliczyć ją z zasięgu i udźwigu, a potem patrz, jak flota planuje bezkolizyjne trasy, wraca do bazy po doładunek i wraca do domu — z narracją na żywo.",
        en: "An interactive 3D simulation: drop delivery targets on a city grid, set a fleet size or let the app derive it from range and payload, then watch the fleet plan collision-free routes, return to base to reload and fly home — narrated live.",
      },
      media: [],
    },
    reflection: {
      pl: "Uczciwie co do zakresu: to aplikacja jednostronicowa, bez back-endu i bez testów poza domyślnymi z toolchainu. Jest po to, żeby pokazać, jak rozkładam trudny problem na czynniki — dzielę go na podproblemy, dobieram właściwe narzędzie do każdego i sprawiam, że wynik widać.",
      en: "Scope-honest by design: a single-page app, no backend, no tests beyond the toolchain's default. It's here to show how I break a hard problem down — decomposing it into sub-problems, picking the right tool for each, and making the result visible.",
    },
  },
};

export function findCaseStudy(value: string): UxCaseStudy | null {
  const id = parseProjectId(value);
  return id ? (caseStudies[id] ?? null) : null;
}

/**
 * „Jak pracuję" — oświadczenie procesowe pod rekrutera. Każdy krok to zasada
 * robocza wyprowadzona z wzorca, który powtarza się w rekordach powyżej
 * (definicja przed pikselami, system od zera, desktop i mobile razem,
 * spójność pilnowana automatycznie, wyjaśnialne ponad magiczne, uczciwość co
 * do zakresu). Nie ma tu rytuałów badawczych, których case'y nie pokazują.
 */
export const designProcess: {
  title: L10n;
  intro: L10n;
  steps: { title: L10n; text: L10n }[];
} = {
  title: { pl: "Jak pracuję", en: "How I work" },
  intro: {
    pl: "Pracuję na styku designu i inżynierii, więc ta sama decyzja trzyma się od pierwszego szkicu po wdrożony ekran. To zasady, na których stoją projekty z tej strony.",
    en: "I work at the seam between design and engineering, so the same decision holds from the first sketch to the shipped screen. These are the principles the projects here stand on.",
  },
  steps: [
    {
      title: {
        pl: "Definicja przed pikselami",
        en: "Definition before pixels",
      },
      text: {
        pl: "Zanim narysuję ekran, ustalam problem, ścieżki użytkownika i kontrakty między front-endem a back-endem — żeby kształt produktu się trzymał, zanim ktokolwiek się na niego zamknie.",
        en: "Before I draw a screen, I settle the problem, the user journeys and the contracts between frontend and backend — so the shape of the product holds before anyone commits to it.",
      },
    },
    {
      title: {
        pl: "System, nie zbiór ekranów",
        en: "A system, not a set of screens",
      },
      text: {
        pl: "System projektowy — paletę, komponenty, ikony — buduję od zera, zamiast opierać się na szablonie, bo to spójność i rozpoznawalna tożsamość sprawiają, że interfejs jest jednym produktem.",
        en: "I build the design system from scratch — palette, components, icons — rather than lean on a template, because consistency and a recognisable identity are what make an interface feel like one product.",
      },
    },
    {
      title: {
        pl: "Desktop i mobile naraz",
        en: "Desktop and mobile together",
      },
      text: {
        pl: "Desktop i mobile projektuję jako jeden przepływ, a nie po kolei — żeby doświadczenie trzymało się tam, gdzie naprawdę się go używa, a nie było doginane do mniejszego ekranu.",
        en: "I design desktop and mobile as one flow, not one after the other, so the experience holds up wherever it's actually used instead of being retrofitted to the smaller screen.",
      },
    },
    {
      title: {
        pl: "Spójność pilnowana automatycznie",
        en: "Consistency kept honest automatically",
      },
      text: {
        pl: "Tam, gdzie się da, pozwalam, żeby to build pilnował kontraktu — generowani klienci i bramki jakości — tak żeby rozjazd między projektem, front-endem a API łamał test, a nie ekran użytkownika.",
        en: "Where I can, I let the build enforce the contract — generated clients and quality gates — so drift between design, frontend and API breaks a check, not a user's screen.",
      },
    },
    {
      title: { pl: "Wyjaśnialne ponad magiczne", en: "Explainable over magic" },
      text: {
        pl: "Wolę wynik, który da się podważyć, od takiego, na który można tylko patrzeć: ocena, ranking czy reguła mają być czymś, co potrafię wyjaśnić, a nie czarną skrzynką.",
        en: "I favour a result someone can question over one they can only look at: a score, a ranking or a rule should be something I can explain, not a black box.",
      },
    },
    {
      title: { pl: "Uczciwość co do zakresu", en: "Honest about scope" },
      text: {
        pl: "Nazywam granicę tego, co dana praca robi — i czego nie robi — i nie przypisuję sobie wyniku, którego nie zmierzyłem. Nazwana granica jest bardziej przydatna niż zawyżona i ukryta.",
        en: "I name the boundary of what a piece of work does — and doesn't — do, and I don't claim an outcome I didn't measure. A stated limit is more useful than an inflated one left hidden.",
      },
    },
  ],
};
