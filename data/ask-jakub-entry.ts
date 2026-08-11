import type { L10n } from "@/lib/lang";

/** Teksty lekkich, serwerowo renderowanych wejść w widoku prostym. */
export const askJakubEntryCopy = {
  trigger: {
    pl: "Zapytaj o moją pracę",
    en: "Ask about my work",
  },
  inlinePrompt: {
    pl: "Szukasz czegoś konkretnego?",
    en: "Looking for something specific?",
  },
} as const satisfies Record<string, L10n>;
