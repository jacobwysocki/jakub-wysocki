import type { L10n } from "@/lib/lang";

/** Tekst lekkiego, serwerowo renderowanego wejścia w widoku prostym. */
export const askJakubEntryCopy = {
  trigger: {
    pl: "Zapytaj o moją pracę",
    en: "Ask about my work",
  },
} as const satisfies Record<string, L10n>;
