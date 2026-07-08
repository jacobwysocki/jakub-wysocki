import type { L10n } from "@/lib/lang-store";
import { contactInfo } from "./site";

export type ShowcaseSite = {
  slug: string;
  /** Nazwa wyświetlana jako tytuł okna / etykieta ikony */
  name: string;
  url: string;
  /** Repozytorium (opcjonalne) — ikona GitHub w pasku adresu */
  repo?: string;
  tag: L10n;
  description: L10n;
  /** Zakładka "Przegląd" w oknie aplikacji: czym jest projekt i jak powstał */
  overview: {
    what: L10n;
    how: L10n;
    role: L10n;
    tech: string[];
  };
  /** Gradient kafelka ikony i karty zapasowej */
  gradient: string;
  /**
   * Czy stronę można osadzić w iframe. Wymaga, by serwer NIE wysyłał
   * X-Frame-Options / CSP frame-ancestors blokujących osadzanie.
   */
  embed: boolean;
};

export const showcase: ShowcaseSite[] = [
  {
    slug: "squizzu",
    name: "Squizzu",
    url: contactInfo.squizzu,
    tag: { pl: "SaaS — współzałożyciel", en: "SaaS — co-founder" },
    description: {
      pl: "Grywalizowany SaaS rekrutacyjny budowany od zera — od 0 do 1000+ użytkowników.",
      en: "A greenfield gamified recruitment SaaS — scaled from 0 to 1,000+ users.",
    },
    overview: {
      what: {
        pl: "Squizzu to grywalizowana platforma rekrutacyjna: kandydaci rywalizują w quizach i wyzwaniach, a rankingi, odznaki i ścieżki progresji zamieniają proces rekrutacji w grę.",
        en: "Squizzu is a gamified recruitment platform: candidates compete in quizzes and challenges while leaderboards, badges and progression paths turn hiring into a game.",
      },
      how: {
        pl: "Backend to .NET 8 z orkiestracją Aspire i bazą CosmosDB na Azure; frontend — Next.js z React 19. Zaprojektowałem 100+ ekranów od zera w Adobe XD i współpracowałem przy integracji produktowych agentów GPT-4o z samonaprawiającą się walidacją JSON-a.",
        en: "The backend runs .NET 8 with Aspire orchestration and CosmosDB on Azure; the frontend is Next.js with React 19. I designed 100+ screens from scratch in Adobe XD and collaborated on integrating GPT-4o product agents with self-healing JSON validation.",
      },
      role: {
        pl: "Co-Founder & Full-Stack Engineer — architektura, design i kod.",
        en: "Co-Founder & Full-Stack Engineer — architecture, design and code.",
      },
      tech: [".NET 8", "Aspire", "Next.js", "React 19", "CosmosDB", "Azure", "GPT-4o"],
    },
    gradient: "linear-gradient(150deg, #FFC205 0%, #FF8C00 100%)",
    embed: true,
  },
  {
    slug: "drone-path",
    name: "Drone Simulation",
    url: contactInfo.droneLive,
    repo: contactInfo.droneRepo,
    tag: { pl: "Symulacja 3D · optymalizacja flot", en: "3D simulation · fleet optimization" },
    description: {
      pl: "Interaktywna symulacja 3D planowania tras flot dronów dostawczych — od pracy dyplomowej do pełnego przepisania z kooperacyjnym wyszukiwaniem ścieżek.",
      en: "An interactive 3D simulation of delivery-drone fleet routing — grown from my dissertation into a full rewrite with cooperative pathfinding.",
    },
    overview: {
      what: {
        pl: "Symulacja odpowiada na realne pytanie logistyczne: jaka najmniejsza flota dronów zrealizuje zestaw dostaw w limitach baterii i udźwigu — i jak poprowadzić ją bez kolizji w powietrzu? Dostawy rozmieszcza się na trójwymiarowej siatce miasta, a misja planuje się i animuje na żywo, z narracją w terminalu symulacji.",
        en: "The simulation answers a real logistics question: what is the smallest drone fleet that can complete a set of deliveries within battery and payload limits — and how do you route it without mid-air collisions? Deliveries are placed on a 3D city grid, and each mission plans and animates live, narrated in a simulation terminal.",
      },
      how: {
        pl: "Trzyetapowy potok algorytmiczny napisany od zera: klasteryzacja dostaw K-Means, kolejność wizyt przez Ant Colony Optimization (TSP) i bezkolizyjna nawigacja Cooperative A* z czasoprzestrzenną tablicą rezerwacji. Scena 3D działa na Three.js (react-three-fiber), a klasyczne A* i Dijkstra służą jako punkt odniesienia. Projekt wyrósł z mojej pracy dyplomowej (First Class Honours) i kod jest otwarty na GitHubie.",
        en: "A three-stage algorithmic pipeline written from scratch: K-Means delivery clustering, Ant Colony Optimization (TSP) for visit order, and collision-free Cooperative A* navigation with a space-time reservation table. The 3D scene runs on Three.js (react-three-fiber), with classic A* and Dijkstra as baselines. It grew out of my dissertation (First Class Honours) and the code is open on GitHub.",
      },
      role: {
        pl: "Autor — badania, algorytmy i implementacja.",
        en: "Author — research, algorithms and implementation.",
      },
      tech: ["React", "Three.js", "Cooperative A*", "ACO", "K-Means", "Dijkstra"],
    },
    gradient: "linear-gradient(150deg, #FF9F0A 0%, #FF375F 100%)",
    embed: true,
  },
];
