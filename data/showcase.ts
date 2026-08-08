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
    tag: { pl: "SaaS · współzałożyciel", en: "SaaS · co-founder" },
    description: {
      pl: "Grywalizowana platforma do nauki IT budowana od zera, od 0 do 1000+ użytkowników.",
      en: "A greenfield gamified IT learning platform, scaled from 0 to 1,000+ users.",
    },
    overview: {
      what: {
        pl: "Squizzu to grywalizowana platforma do nauki IT i przygotowania do rozmów rekrutacyjnych: użytkownicy rywalizują w quizach i wyzwaniach, a rankingi, odznaki i ścieżki progresji zamieniają naukę w grę.",
        en: "Squizzu is a gamified IT learning and interview-preparation platform: users compete in quizzes and challenges while leaderboards, badges and progression paths turn studying into a game.",
      },
      how: {
        pl: "Backend to .NET 8 z orkiestracją Aspire i bazą CosmosDB na Azure, frontend to Next.js z React 19 i TypeScriptem. Zaprojektowałem w Adobe XD 100+ autorskich ekranów i spójny system projektowy, integrację oparłem na klientach generowanych z OpenAPI/Swagger, a produktowych agentów GPT-4o spiąłem z samonaprawiającą się walidacją JSON-a.",
        en: "The backend runs .NET 8 with Aspire orchestration and CosmosDB on Azure; the frontend is Next.js with React 19 and TypeScript. I designed 100+ original screens and a consistent design system in Adobe XD, based the integration on OpenAPI/Swagger-generated clients, and wired GPT-4o product agents to self-healing JSON validation.",
      },
      role: {
        pl: "Co-Founder & Full-Stack Engineer: architektura, design i kod.",
        en: "Co-Founder & Full-Stack Engineer: architecture, design and code.",
      },
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
        "Adobe XD",
      ],
    },
    gradient: "linear-gradient(150deg, #FFC205 0%, #FF8C00 100%)",
    embed: true,
  },
  {
    slug: "drone-path",
    name: "Drone Simulation",
    url: contactInfo.droneLive,
    repo: contactInfo.droneRepo,
    tag: {
      pl: "Symulacja 3D · optymalizacja flot",
      en: "3D simulation · fleet optimization",
    },
    description: {
      pl: "Interaktywna symulacja 3D planowania tras flot dronów dostawczych, od pracy dyplomowej do pełnego przepisania z kooperacyjnym wyszukiwaniem ścieżek.",
      en: "An interactive 3D simulation of delivery-drone fleet routing, grown from my dissertation into a full rewrite with cooperative pathfinding.",
    },
    overview: {
      what: {
        pl: "Symulacja odpowiada na realne pytanie logistyczne: jaka najmniejsza flota dronów zrealizuje zestaw dostaw w limitach baterii i udźwigu, i jak poprowadzić ją bez kolizji w powietrzu? Dostawy rozmieszcza się na trójwymiarowej siatce miasta z drogami i wieżowcami o różnej wysokości. Wielkość floty można podać ręcznie albo pozwolić aplikacji wyliczyć ją z zasięgu i udźwigu. Dron, którego klaster przekracza ładowność, wraca w trakcie misji do bazy po doładunek. Całość planuje się i animuje na żywo, z narracją w terminalu symulacji.",
        en: "The simulation answers a real logistics question: what is the smallest drone fleet that can complete a set of deliveries within battery and payload limits, and how do you route it without mid-air collisions? Deliveries are placed on a 3D city grid of roads and skyscrapers of varying height. Fleet size is either set by hand or derived by the app from range and payload. A drone whose cluster exceeds its capacity flies back to base mid-mission to reload. Everything plans and animates live, narrated in a simulation terminal.",
      },
      how: {
        pl: "Trzyetapowy potok algorytmiczny napisany od zera. K-Means grupuje dostawy przestrzennie, żeby każdy dron dostał spójny rejon zamiast przecinać mapę. Ant Colony Optimization rozwiązuje kolejność wizyt jako problem komiwojażera (15 mrówek, 50 iteracji, selekcja ruletkowa z parowaniem feromonu). Cooperative A* szuka trasy w stanie czasoprzestrzennym (wiersz, kolumna, wysokość, czas) i sprawdza wspólną tablicę rezerwacji zarówno na wierzchołkach, jak i na krawędziach, więc dwa drony nie przenikną przez siebie zamianą pozycji. Koszty ruchu są asymetryczne: lot poziomy 1, wznoszenie 2, opadanie 0,5, dzięki czemu przelot nad budynkiem opłaca się tylko wtedy, gdy jest tańszy od czekania. Klasyczne A* i Dijkstra służą jako punkt odniesienia: dają krótsze trasy pojedynczych dronów, ale rozbijają je o siebie. Scena 3D działa na Three.js (react-three-fiber). Projekt wyrósł z mojej pracy dyplomowej (First Class Honours), kod jest otwarty na GitHubie.",
        en: "A three-stage algorithmic pipeline written from scratch. K-Means groups deliveries spatially so each drone gets a coherent local area instead of crossing the map. Ant Colony Optimization solves visit order as a Travelling Salesperson problem (15 ants, 50 iterations, roulette-wheel selection with pheromone evaporation). Cooperative A* searches a space-time state of row, column, altitude and time, checking a shared reservation table on both vertices and edges, so two drones cannot pass through each other by swapping positions. Move costs are asymmetric: flat flight 1, climbing 2, descending 0.5, so flying over a building pays off only when it beats waiting. Classic A* and Dijkstra act as the baseline: they find shorter individual paths but crash the drones into each other. The 3D scene runs on Three.js (react-three-fiber). The project grew out of my dissertation (First Class Honours) and the code is open on GitHub.",
      },
      role: {
        pl: "Autor: badania, algorytmy i implementacja.",
        en: "Author: research, algorithms and implementation.",
      },
      tech: [
        "React",
        "Three.js",
        "Cooperative A*",
        "Multi-Agent Pathfinding",
        "ACO",
        "K-Means",
        "A*",
        "Dijkstra",
      ],
    },
    gradient: "linear-gradient(150deg, #FF9F0A 0%, #FF375F 100%)",
    embed: true,
  },
];
