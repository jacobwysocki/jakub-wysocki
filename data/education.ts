import type { L10n } from "@/lib/lang-store";

export const education = {
  degree: {
    title: {
      pl: "BSc (Hons) Computer Science",
      en: "BSc (Hons) Computer Science",
    },
    grade: {
      pl: "Dyplom z wyróżnieniem (First Class Honours)",
      en: "First Class Honours",
    },
    school: "Northumbria University",
    place: {
      pl: "Newcastle, Wielka Brytania",
      en: "Newcastle, United Kingdom",
    },
    period: { pl: "2019-2023", en: "2019-2023" },
    projectsLabel: { pl: "Wybrane projekty", en: "Key projects" },
    keyProjects: [
      {
        pl: "Aplikacja webowa spinająca Google Maps, Twitter i Geonames API z logowaniem Google OAuth 2.0 (PHP, JavaScript/jQuery), wdrożona na maszynie Ubuntu w Microsoft Azure.",
        en: "Web app integrating the Google Maps, Twitter and Geonames APIs with Google OAuth 2.0 sign-in (PHP, JavaScript/jQuery), deployed to an Ubuntu VM on Microsoft Azure.",
      },
      {
        pl: "Zespołowy program do ewidencji zadań: od diagramów UML i makiet w Adobe XD po implementację w Javie/JavaFX.",
        en: "Team-built task-entry software: from UML diagrams and Adobe XD mock-ups to a Java/JavaFX implementation.",
      },
      {
        pl: "Studium porównawcze klasyfikatorów K-NN i SVM z metodą PCA w rozpoznawaniu pisma odręcznego (MNIST), zbudowane jako aplikacja w MATLAB-ie.",
        en: "Comparative study of K-NN and SVM classifiers with PCA for handwritten digit recognition (MNIST), built as a MATLAB application.",
      },
    ] as L10n[],
  },
  dissertation: {
    label: { pl: "Praca dyplomowa", en: "Dissertation" },
    title: {
      pl: "„Implementation of Path Optimization Algorithm for the Optimal Number of Unmanned Aerial Vehicles Used Within Goods Delivery”",
      en: "“Implementation of Path Optimization Algorithm for the Optimal Number of Unmanned Aerial Vehicles Used Within Goods Delivery”",
    },
    scope: {
      pl: "Analiza i symulacja odpowiadająca na pytanie logistyczne: jak mała flota dronów wykona zadany zestaw dostaw w granicach udźwigu i baterii oraz jak ją poprowadzić bez kolizji w powietrzu. Dostawy grupuje K-Means, kolejność odwiedzin rozwiązuje Ant Colony Optimization jako problem komiwojażera, a trasy bezkolizyjne wyznacza Cooperative A* przeszukujący stan czasoprzestrzenny (wiersz, kolumna, wysokość, czas) względem wspólnej tablicy rezerwacji. A* i Dijkstra są zaimplementowane jako baza porównawcza: dają krótsze trasy pojedynczych dronów, ale przeprowadzają je przez siebie nawzajem, co jest właśnie uzasadnieniem dla wariantu wieloagentowego.",
      en: "An analysis and simulation answering a logistics question: how small a fleet of drones can complete a given set of deliveries within payload and battery limits, and how to route it without mid-air collisions. Deliveries are grouped with K-Means, visit order is solved as a Travelling Salesperson problem with Ant Colony Optimization, and collision-free routes come from Cooperative A* searching a space-time state of row, column, altitude and time against a shared reservation table. A* and Dijkstra are implemented as the baseline: they find shorter individual paths but fly the drones through each other, which is precisely what motivates the multi-agent variant.",
    },
    platformNote: {
      pl: "Interaktywna platforma symulacyjna zbudowana od zera w React.js, dziś rozwinięta w pełne przepisanie 3D na Three.js z react-three-fiber. Wszystkie pięć algorytmów napisane od podstaw w czystym JavaScripcie, bez bibliotek. Działa na żywo jako Drone Simulation.",
      en: "The interactive simulation platform was custom-built in React.js, since rewritten in full 3D on Three.js with react-three-fiber. All five algorithms are written from scratch in plain JavaScript, with no libraries. It runs live as Drone Simulation.",
    },
    algorithms: [
      "K-Means",
      "Ant Colony Optimization",
      "Cooperative A*",
      "A*",
      "Dijkstra",
    ],
    /**
     * Kadr albo pętla z symulacji. Wrzuć plik do /public/images i podmień
     * null, np. "/images/drone-sim.webm" (wideo .webm/.mp4, autoplay
     * w pętli) albo "/images/drone-sim.png" (statyczny screen).
     * null oznacza brak medium.
     */
    media: "/images/drone-sim.mp4" as string | null,
  },
  bootcamp: {
    title: {
      pl: "JavaScript Full-Stack Bootcamp (online)",
      en: "JavaScript Full-Stack Online Bootcamp",
    },
    school: "Barcelona Code School",
    period: { pl: "wrz 2020-2021", en: "Sep 2020-2021" },
    scope: {
      pl: "Intensywny program full-stack JavaScript: React i React Native, Node.js z Express, MongoDB, rendering po stronie serwera pod SEO oraz praca zespołowa i w parach, od front-endu po wdrożenia aplikacji webowych i mobilnych.",
      en: "An intensive full-stack JavaScript programme: React and React Native, Node.js with Express, MongoDB, server-side rendering for SEO, plus team and pair programming, from front-end work to shipping web and mobile apps.",
    },
  },
  certifications: [
    { name: "Azure Fundamentals", code: "AZ-900" },
    { name: "Azure AI Fundamentals", code: "AI-900" },
    { name: "Azure Data Fundamentals", code: "DP-900" },
    { name: "ITIL® Foundation, IT Service Management", code: "ITIL" },
    { name: "CEFR Cambridge English", code: "CEFR" },
  ],
  /**
   * `short` to zwarta etykieta poziomu dla miejsc, gdzie nie ma miejsca na
   * pełne zdanie (strony-wizytówki). Osobne pole, bo wcześniej skrót
   * wyłuskiwano z `level` przez split na em dashu, co wiązało treść z kodem.
   */
  languages: [
    {
      name: { pl: "polski", en: "Polish" },
      short: { pl: "ojczysty", en: "native" },
      level: { pl: "język ojczysty", en: "native" },
    },
    {
      name: { pl: "angielski", en: "English" },
      short: { pl: "C1/C2 Cambridge", en: "C1/C2 Cambridge" },
      level: {
        pl: "C1/C2 Cambridge, pełna biegłość zawodowa i akademicka",
        en: "C1/C2 Cambridge, full professional & academic fluency",
      },
    },
    {
      name: { pl: "hiszpański", en: "Spanish" },
      short: { pl: "B1", en: "B1" },
      level: {
        pl: "certyfikat B1 · 212 dni serii Duolingo",
        en: "B1 certificate · 212-day Duolingo streak",
      },
    },
  ] as { name: L10n; short: L10n; level: L10n }[],
} as const;

export type Hobby = {
  id: string;
  title: L10n;
  text: L10n;
};

export const hobbies: Hobby[] = [
  {
    id: "hiking",
    title: { pl: "Góry", en: "Mountain hiking" },
    text: {
      pl: "Techniczne szlaki po polskiej i słowackiej stronie Tatr.",
      en: "Trekking technical trails on the Polish and Slovak sides of the Tatra Mountains.",
    },
  },
  {
    id: "diving",
    title: { pl: "Nurkowanie", en: "Scuba diving" },
    text: {
      pl: "Certyfikaty PADI Open Water, PADI Advanced i PSAI Dry Suit.",
      en: "Certified PADI Open Water, PADI Advanced and PSAI Dry Suit diver.",
    },
  },
  {
    id: "running",
    title: { pl: "Bieganie", en: "Running" },
    text: {
      pl: "Międzynarodowe starty w elitarnej europejskiej serii półmaratonów SuperHalfs.",
      en: "Competing internationally in the elite European SuperHalfs half-marathon series.",
    },
  },
  {
    id: "racket",
    title: { pl: "Sporty rakietowe", en: "Racket sports" },
    text: {
      pl: "Aktywny gracz squasha; wicemistrz regionu w tenisie stołowym w podstawówce.",
      en: "Active squash player and primary-school regional table-tennis vice-champion.",
    },
  },
  {
    id: "travel",
    title: { pl: "Podróże", en: "Global travel" },
    text: {
      pl: "Odkrywanie kultur świata, z długoterminowym celem: wszystkie 7 kontynentów.",
      en: "Exploring diverse cultures with a long-term goal of hitting all 7 continents.",
    },
  },
];
