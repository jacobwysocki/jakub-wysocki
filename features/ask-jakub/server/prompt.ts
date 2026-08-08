import "server-only";

import {
  portfolioKnowledge,
  type KnowledgeEntry,
  type RetrievalMatch,
} from "@/features/portfolio-knowledge";
import { ASK_LIMITS, type AskRequest } from "../contract";
import type { ModelInput } from "./model-port";

export type BoundedModelInput = Readonly<{
  input: ModelInput;
  selectedEntries: readonly KnowledgeEntry[];
}>;

const characterCount = (value: string) => Array.from(value).length;

/** Build structured provider input without mixing untrusted history into facts. */
export function buildBoundedModelInput(
  request: AskRequest,
  matches: readonly RetrievalMatch[],
): BoundedModelInput {
  const selectedEntries: KnowledgeEntry[] = [];
  const knowledge: ModelInput["knowledge"][number][] = [];
  let selectedCharacters = 0;

  for (const { entry } of matches) {
    if (selectedEntries.length >= ASK_LIMITS.selectedKnowledgeEntries) break;
    const fact = entry.fact[request.language].trim();
    const factCharacters = characterCount(fact);
    if (
      factCharacters === 0 ||
      selectedCharacters + factCharacters >
        ASK_LIMITS.selectedKnowledgeCharacters
    ) {
      continue;
    }
    selectedCharacters += factCharacters;
    selectedEntries.push(entry);
    knowledge.push({ id: entry.id, fact });
  }

  return {
    selectedEntries,
    input: {
      language: request.language,
      question: request.question,
      // History remains a separately labelled untrusted input. Retrieval never
      // reads it and it can never become Portfolio Knowledge.
      history: request.history,
      knowledge,
      allowedSuggestionIds: portfolioKnowledge.suggestions.map(({ id }) => id),
    },
  };
}
