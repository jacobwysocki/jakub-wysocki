import type { Lang } from "@/lib/lang";
import { portfolioKnowledge } from "./catalog";
import type {
  AskTopic,
  KnowledgeEntry,
  PortfolioKnowledgeCatalog,
  RetrievalMatch,
} from "./contract";

const COMBINING_MARKS = /\p{M}+/gu;
const NON_SEARCH_CHARACTER = /[^a-z0-9]+/g;

const SEARCH_STOP_WORDS = new Set([
  "a",
  "about",
  "albo",
  "an",
  "and",
  "any",
  "are",
  "at",
  "by",
  "can",
  "co",
  "could",
  "czy",
  "dla",
  "do",
  "does",
  "for",
  "from",
  "go",
  "had",
  "has",
  "have",
  "he",
  "her",
  "him",
  "his",
  "i",
  "in",
  "is",
  "it",
  "jak",
  "jaka",
  "jakie",
  "jaki",
  "jego",
  "jej",
  "jest",
  "lub",
  "me",
  "na",
  "o",
  "od",
  "of",
  "on",
  "or",
  "ona",
  "oraz",
  "przy",
  "sa",
  "she",
  "should",
  "sie",
  "ta",
  "ten",
  "that",
  "the",
  "their",
  "them",
  "they",
  "this",
  "to",
  "we",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "w",
  "with",
  "would",
  "you",
  "z",
  "ze",
]);

/**
 * A deliberately small word-family map handles common Polish inflections and
 * English plurals without turning retrieval into an aggressive stemmer.
 */
const CANONICAL_TOKEN_FORMS: Readonly<Record<string, string>> = {
  baz: "baza",
  baza: "baza",
  bazach: "baza",
  bazami: "baza",
  baze: "baza",
  bazie: "baza",
  bazom: "baza",
  bazy: "baza",
  bazodanowa: "baza",
  bazodanowe: "baza",
  bazodanowego: "baza",
  bazodanowych: "baza",
  bazodanowymi: "baza",
  bazodanowy: "baza",
  dane: "dane",
  danych: "dane",
  danymi: "dane",
  database: "database",
  databases: "database",
  doswiadczenia: "doswiadczenie",
  doswiadczeniem: "doswiadczenie",
  doswiadczeniu: "doswiadczenie",
  migrations: "migration",
  migracja: "migracja",
  migracje: "migracja",
  migracji: "migracja",
  korporacyjna: "korporacyjny",
  korporacyjne: "korporacyjny",
  korporacyjnego: "korporacyjny",
  korporacyjnych: "korporacyjny",
  korporacyjnym: "korporacyjny",
  korporacyjnymi: "korporacyjny",
  projekt: "projekt",
  projektach: "projekt",
  projektami: "projekt",
  projekcie: "projekt",
  projektem: "projekt",
  projekty: "projekt",
  projektow: "projekt",
  projektu: "projekt",
  projects: "project",
  role: "role",
  roles: "role",
  rola: "role",
  rolach: "role",
  roli: "role",
  startup: "startup",
  startupach: "startup",
  startupie: "startup",
  startupow: "startup",
  startups: "startup",
  startupu: "startup",
  system: "system",
  systemach: "system",
  systemami: "system",
  systems: "system",
  systemow: "system",
  systemy: "system",
  technologies: "technology",
  technologie: "technologia",
  technologiach: "technologia",
  technologiami: "technologia",
  technologii: "technologia",
  umiejetnosc: "umiejetnosc",
  umiejetnosciach: "umiejetnosc",
  umiejetnosci: "umiejetnosc",
  umiejetnosciami: "umiejetnosc",
  skills: "skill",
};

/**
 * Search normalization is deliberately language-independent. It folds Polish
 * diacritics, punctuation, casing, and whitespace while keeping deterministic
 * ASCII tokens suitable for a small in-process corpus.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .replaceAll("ł", "l")
    .replaceAll("Ł", "l")
    .toLowerCase()
    .replace(NON_SEARCH_CHARACTER, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function canonicalSearchToken(token: string): string {
  return CANONICAL_TOKEN_FORMS[token] ?? token;
}

function searchTokens(value: string): readonly string[] {
  return normalizeSearchText(value)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !SEARCH_STOP_WORDS.has(token))
    .map(canonicalSearchToken);
}

function canonicalSearchText(value: string): string {
  return normalizeSearchText(value)
    .split(" ")
    .filter(Boolean)
    .map(canonicalSearchToken)
    .join(" ");
}

type AliasGroup = Readonly<{
  phrases: readonly string[];
  expansion: readonly string[];
  topics: readonly AskTopic[];
}>;

const aliasGroups: readonly AliasGroup[] = [
  {
    phrases: [
      "ai",
      "sztuczna inteligencja",
      "sztucznej inteligencji",
      "artificial intelligence",
      "gpt",
      "llm",
    ],
    expansion: ["ai", "gpt", "agents", "agenci", "machine learning"],
    topics: ["ai"],
  },
  {
    phrases: [".net", "dotnet", "c sharp", "aspire"],
    expansion: ["net", "dotnet", "c sharp", "c", "aspire"],
    topics: ["engineering", "skills"],
  },
  {
    phrases: ["front end", "frontend", "react", "next js"],
    expansion: ["frontend", "front end", "react", "next js", "typescript"],
    topics: ["engineering", "skills"],
  },
  {
    phrases: ["full stack", "fullstack", "end to end"],
    expansion: ["full stack", "fullstack", "frontend", "backend", "end to end"],
    topics: ["engineering", "skills", "hiring"],
  },
  {
    phrases: [
      "database",
      "baza",
      "baza danych",
      "sql",
      "sql server",
      "sybase",
      "cosmosdb",
      "sqlite",
      "model danych",
      "data model",
    ],
    expansion: [
      "database",
      "baza danych",
      "sql",
      "sql server",
      "sybase",
      "migration",
      "migracja",
    ],
    topics: ["engineering", "skills", "experience", "hiring"],
  },
  {
    phrases: [
      "startup",
      "start up",
      "early stage",
      "mloda firma",
      "mlodej firmie",
    ],
    expansion: [
      "startup",
      "co founder",
      "wspolzalozyciel",
      "product",
      "produkt",
      "Squizzu",
      "Ultra Studio",
    ],
    topics: ["experience", "projects", "hiring"],
  },
  {
    phrases: [
      "enterprise",
      "enterprise system",
      "corporate system",
      "system korporacyjny",
      "duzy system",
    ],
    expansion: [
      "enterprise",
      "system korporacyjny",
      "large system",
      "duzy system",
      "Mandata",
      "TMS",
    ],
    topics: ["engineering", "experience", "hiring"],
  },
  {
    phrases: [
      "good at",
      "good with",
      "skilled",
      "experience with",
      "would he",
      "fit for",
      "dobry w",
      "zna sie",
      "umie",
      "potrafi",
      "poradzilby",
      "sprawdzilby",
    ],
    expansion: ["skill", "umiejetnosc", "experience", "doswiadczenie"],
    topics: ["skills", "experience", "hiring"],
  },
  {
    phrases: [
      "ux",
      "ui",
      "product design",
      "projektowanie produktu",
      "design system",
    ],
    expansion: [
      "ux",
      "ui",
      "design",
      "projektowanie",
      "product design",
      "design system",
    ],
    topics: ["design"],
  },
  {
    phrases: [
      "job",
      "hire",
      "hiring",
      "recruiter",
      "rekrutacja",
      "zatrudnienie",
      "szukam",
    ],
    expansion: ["hiring", "rekrutacja", "experience", "doswiadczenie", "role"],
    topics: ["hiring", "experience"],
  },
  {
    phrases: [
      "education",
      "degree",
      "university",
      "studia",
      "wyksztalcenie",
      "uczelnia",
      "certificate",
      "certificates",
      "certification",
      "certifications",
      "certyfikat",
      "certyfikaty",
    ],
    expansion: ["education", "degree", "university", "studia", "wyksztalcenie"],
    topics: ["education"],
  },
  {
    phrases: [
      "project",
      "projects",
      "projekt",
      "projekty",
      "portfolio",
      "case study",
    ],
    expansion: [
      "project",
      "projects",
      "projekt",
      "projekty",
      "portfolio",
      "case study",
    ],
    topics: ["projects"],
  },
  {
    phrases: [
      "contact",
      "email",
      "e mail",
      "kontakt",
      "napisz",
      "wiadomosc",
      "skontaktowac",
      "skontaktuj",
    ],
    expansion: ["contact", "email", "kontakt", "message", "wiadomosc"],
    topics: ["contact"],
  },
  {
    phrases: ["mobile", "telefon", "aplikacja mobilna", "maui", "xamarin"],
    expansion: ["mobile", "telefon", "maui", "xamarin", "nu connect"],
    topics: ["engineering", "design", "skills"],
  },
  {
    phrases: ["where", "location", "based", "gdzie", "lokalizacja", "mieszka"],
    expansion: ["where", "location", "based", "gdzie", "lokalizacja", "krakow"],
    topics: ["profile", "contact"],
  },
];

function phraseAppears(normalized: string, phrase: string): boolean {
  return ` ${normalized} `.includes(` ${normalizeSearchText(phrase)} `);
}

function canonicalPhraseAppears(normalized: string, phrase: string): boolean {
  return ` ${canonicalSearchText(normalized)} `.includes(
    ` ${canonicalSearchText(phrase)} `,
  );
}

export type ExpandedQuery = Readonly<{
  normalized: string;
  tokens: ReadonlySet<string>;
  topics: ReadonlySet<AskTopic>;
}>;

export function expandSearchAliases(question: string): ExpandedQuery {
  const normalized = normalizeSearchText(question);
  const tokens = new Set(searchTokens(normalized));
  const topics = new Set<AskTopic>();

  for (const group of aliasGroups) {
    if (
      !group.phrases.some(
        (phrase) =>
          phraseAppears(normalized, phrase) ||
          canonicalPhraseAppears(normalized, phrase),
      )
    ) {
      continue;
    }
    for (const expansion of group.expansion) {
      for (const token of searchTokens(expansion)) {
        if (token) tokens.add(token);
      }
    }
    for (const topic of group.topics) topics.add(topic);
  }

  return { normalized, tokens, topics };
}

function normalizedPhrases(
  entry: KnowledgeEntry,
  lang: Lang,
): readonly string[] {
  return entry.keywords[lang]
    .map(normalizeSearchText)
    .filter((keyword) => keyword.length > 0);
}

function scoreEntry(
  entry: KnowledgeEntry,
  lang: Lang,
  query: ExpandedQuery,
): RetrievalMatch | undefined {
  const keywordPhrases = normalizedPhrases(entry, lang);
  const keywordTokens = new Set(
    keywordPhrases.flatMap((phrase) => searchTokens(phrase)),
  );
  const factTokens = new Set(searchTokens(entry.fact[lang]));

  let score = 0;
  for (const phrase of keywordPhrases) {
    if (phraseAppears(query.normalized, phrase)) {
      score += phrase.includes(" ") ? 14 : 9;
    }
  }

  let keywordOverlap = 0;
  let factOverlap = 0;
  for (const token of query.tokens) {
    if (keywordTokens.has(token)) keywordOverlap += 1;
    if (factTokens.has(token)) factOverlap += 1;
  }
  score += keywordOverlap * 4;
  score += Math.min(factOverlap, 10);

  const matchedTopics = entry.topics.filter((topic) => query.topics.has(topic));
  score += matchedTopics.length * 6;

  return score > 0 ? { entry, score, matchedTopics } : undefined;
}

export type RetrievalOptions = Readonly<{
  limit?: number;
  catalog?: PortfolioKnowledgeCatalog;
}>;

/**
 * Deterministic bounded lexical retrieval. The same input and catalog always
 * produce the same order; ties are resolved by stable Knowledge ID.
 */
export function retrieveKnowledge(
  question: string,
  lang: Lang,
  options: RetrievalOptions = {},
): readonly RetrievalMatch[] {
  const query = expandSearchAliases(question);
  if (!query.normalized) return [];

  const limit = Math.max(1, Math.min(options.limit ?? 6, 10));
  const catalog = options.catalog ?? portfolioKnowledge;

  return catalog.entries
    .map((entry) => scoreEntry(entry, lang, query))
    .filter((match): match is RetrievalMatch => match !== undefined)
    .sort((left, right) => {
      if (left.score !== right.score) return right.score - left.score;
      return left.entry.id < right.entry.id ? -1 : 1;
    })
    .slice(0, limit);
}
