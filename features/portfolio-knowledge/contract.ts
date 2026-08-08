import type { Lang, L10n } from "@/lib/lang";
import type { PortfolioLocation } from "@/features/portfolio-navigation/contract";

export type KnowledgeId = `knowledge:${string}`;
export type EvidenceId = `evidence:${string}`;
export type SuggestionId = `suggestion:${string}`;

export type AskTopic =
  | "profile"
  | "hiring"
  | "experience"
  | "engineering"
  | "design"
  | "ai"
  | "projects"
  | "skills"
  | "education"
  | "contact"
  | "portfolio";

export type EvidenceLink = Readonly<{
  id: EvidenceId;
  label: L10n;
  location: PortfolioLocation;
  href: `/${string}`;
}>;

export type KnowledgeEntry = Readonly<{
  id: KnowledgeId;
  topics: readonly AskTopic[];
  keywords: Readonly<Record<Lang, readonly string[]>>;
  fact: L10n;
  evidence: readonly EvidenceId[];
}>;

export type SuggestedQuestion = Readonly<{
  id: SuggestionId;
  question: L10n;
  topics: readonly AskTopic[];
  knowledge: readonly KnowledgeId[];
}>;

export type PortfolioKnowledgeCatalog = Readonly<{
  entries: readonly KnowledgeEntry[];
  evidence: readonly EvidenceLink[];
  suggestions: readonly SuggestedQuestion[];
}>;

export type RetrievalMatch = Readonly<{
  entry: KnowledgeEntry;
  score: number;
  matchedTopics: readonly AskTopic[];
}>;
