import type { L10n } from "@/lib/lang";
import type { SpotlightResultKind } from "./contract";

export const spotlightCopy = {
  open: { pl: "Szukaj w portfolio", en: "Search portfolio" },
  dialog: { pl: "Wyszukiwanie portfolio", en: "Portfolio search" },
  placeholder: {
    pl: "Aplikacje, doświadczenie, technologie, projekty…",
    en: "Apps, experience, technologies, projects…",
  },
  curated: { pl: "Polecane miejsca", en: "Suggested destinations" },
  results: { pl: "Wyniki", en: "Results" },
  noResults: {
    pl: "Brak wyników. Spróbuj nazwy firmy, technologii lub projektu.",
    en: "No results. Try a company, technology, or project name.",
  },
  unavailable: {
    pl: "To miejsce nie jest teraz dostępne.",
    en: "That destination is not available right now.",
  },
  close: { pl: "Zamknij wyszukiwanie", en: "Close search" },
  shortcut: { pl: "⌘K / Ctrl K", en: "⌘K / Ctrl K" },
} as const satisfies Record<string, L10n>;

export const spotlightKindCopy = {
  app: { pl: "Aplikacja", en: "App" },
  profile: { pl: "Profil", en: "Profile" },
  experience: { pl: "Doświadczenie", en: "Experience" },
  education: { pl: "Edukacja", en: "Education" },
  project: { pl: "Projekt", en: "Project" },
  contact: { pl: "Kontakt", en: "Contact" },
  portfolio: { pl: "Portfolio", en: "Portfolio" },
} as const satisfies Record<SpotlightResultKind, L10n>;
