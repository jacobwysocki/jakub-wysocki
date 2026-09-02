import type { L10n } from "@/lib/lang";

/**
 * Wspólny słownik Ask Jakub dla obu prezentacji portfolio.
 * Widoki wybierają z niego tylko potrzebne teksty; fakty i sugerowane
 * pytania nadal należą do Portfolio Knowledge.
 */
export const askJakubCopy = {
  title: { pl: "Zapytaj o Jakuba", en: "Ask Jakub" },
  widgetLabel: {
    pl: "Szybki czat Ask Jakub",
    en: "Ask Jakub quick chat",
  },
  widgetIntroduction: {
    pl: "Zadaj krótkie pytanie o moją pracę albo otwórz pełną rozmowę.",
    en: "Ask a quick question about my work or open the full conversation.",
  },
  latestAnswer: { pl: "Ostatnia odpowiedź", en: "Latest answer" },
  openFullChat: { pl: "Otwórz pełny czat", en: "Open full chat" },
  identity: {
    pl: "Przewodnik AI po portfolio",
    en: "AI portfolio guide",
  },
  introduction: {
    pl: "Zapytaj o moją pracę, projekty albo o to, jak łączę inżynierię z designem. Odpowiedzi korzystają z tego portfolio i prowadzą do źródeł.",
    en: "Ask about my work, projects, or how engineering and design connect. Answers use this portfolio and link back to the source.",
  },
  dataDisclosure: {
    pl: "Pytanie trafia do zewnętrznego dostawcy modelu AI; ta rozmowa nie jest zapisywana.",
    en: "Your question goes to a third-party model provider; this conversation is not stored.",
  },
  suggestionsLabel: { pl: "Możesz zacząć tutaj", en: "Start with a question" },
  composerLabel: {
    pl: "Pytanie o pracę Jakuba",
    en: "Question about Jakub's work",
  },
  composerDescription: {
    pl: "Zapytaj o udokumentowaną pracę, projekty, umiejętności lub podejście.",
    en: "Ask about documented work, projects, skills, or approach.",
  },
  composerPlaceholder: {
    pl: "Np. co pokazuje pełny stack?",
    en: "e.g. what shows the full stack?",
  },
  ask: { pl: "Zapytaj", en: "Ask" },
  conversation: { pl: "Rozmowa", en: "Conversation" },
  visitorTurn: { pl: "Twoje pytanie", en: "Your question" },
  guideTurn: { pl: "Odpowiedź przewodnika", en: "Guide answer" },
  retrieving: {
    pl: "Przeszukuję portfolio…",
    en: "Searching the portfolio…",
  },
  composing: {
    pl: "Układam ugruntowaną odpowiedź…",
    en: "Composing a grounded answer…",
  },
  cancelled: { pl: "Odpowiedź anulowana.", en: "Request cancelled." },
  cancel: { pl: "Anuluj odpowiedź", en: "Cancel answer" },
  retry: { pl: "Spróbuj ponownie", en: "Retry" },
  clear: { pl: "Wyczyść rozmowę", en: "Clear conversation" },
  answered: { pl: "Odpowiedź ze źródłami", en: "Grounded answer" },
  clarification: { pl: "Doprecyzujmy", en: "Clarification" },
  notCovered: { pl: "Poza zakresem portfolio", en: "Not covered" },
  evidence: { pl: "Źródła w portfolio", en: "Portfolio evidence" },
  copyAnswer: { pl: "Kopiuj odpowiedź", en: "Copy answer" },
  copied: { pl: "Skopiowano", en: "Copied" },
  answerReady: { pl: "Odpowiedź gotowa", en: "Answer ready" },
  followUps: { pl: "Dopytaj", en: "Continue exploring" },
  offlineTitle: { pl: "Jesteś offline", en: "You're offline" },
  unavailableTitle: {
    pl: "Przewodnik jest niedostępny",
    en: "Guide unavailable",
  },
  timeoutTitle: { pl: "Przekroczono czas odpowiedzi", en: "Answer timed out" },
  invalidTitle: {
    pl: "Nie udało się zweryfikować odpowiedzi",
    en: "Answer could not be verified",
  },
  rateLimitedTitle: {
    pl: "Limit pytań został osiągnięty",
    en: "Question limit reached",
  },
  budgetTitle: { pl: "Przewodnik wstrzymany", en: "Guide paused" },
  recoveryTitle: { pl: "Nie udało się odpowiedzieć", en: "Answer unavailable" },
  retryIn: { pl: "Spróbuj ponownie za", en: "Try again in" },
  second: { pl: "s", en: "second" },
  seconds: { pl: "s", en: "seconds" },
  directPortfolio: {
    pl: "Portfolio działa niezależnie od przewodnika:",
    en: "The portfolio works independently of the guide:",
  },
  viewExperience: { pl: "Zobacz doświadczenie", en: "View experience" },
  contactJakub: { pl: "Skontaktuj się", en: "Contact Jakub" },
  characterCount: { pl: "Licznik znaków", en: "Character count" },
  historicalFailure: {
    pl: "Poprzednia odpowiedź niedostępna.",
    en: "Previous answer unavailable.",
  },
  simpleClose: {
    pl: "Zamknij",
    en: "Close",
  },
  simpleNavigationUnavailable: {
    pl: "To źródło nie ma celu w prostym widoku.",
    en: "This source has no destination in Simple view.",
  },
} as const satisfies Record<string, L10n>;
