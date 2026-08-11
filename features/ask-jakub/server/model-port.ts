import "server-only";

import type { KnowledgeId, SuggestionId } from "@/features/portfolio-knowledge";
import type { Lang } from "@/lib/lang";
import type { CompletedTurn } from "../contract";

export type ModelInput = Readonly<{
  language: Lang;
  question: string;
  history: readonly CompletedTurn[];
  knowledgeCoverage: "matched" | "nearest";
  knowledge: readonly Readonly<{ id: KnowledgeId; fact: string }>[];
  allowedSuggestionIds: readonly SuggestionId[];
}>;

export type ModelResult = Readonly<{
  kind: "answered" | "clarification" | "not-covered";
  text: string;
  knowledgeIds: readonly KnowledgeId[];
  suggestionIds: readonly SuggestionId[];
}>;

/** True-external seam. Provider details stay behind this server-only port. */
export type AnswerModelPort = Readonly<{
  generate(
    input: ModelInput,
    options: Readonly<{ signal: AbortSignal }>,
  ): Promise<ModelResult>;
}>;
