import "server-only";

import {
  followUpSuggestedQuestions,
  type KnowledgeEntry,
  type RetrievalMatch,
  type SuggestionId,
} from "@/features/portfolio-knowledge";
import { ASK_LIMITS, type AskRequest } from "../contract";
import type { ModelInput } from "./model-port";

export type BoundedModelInput = Readonly<{
  input: ModelInput;
  selectedEntries: readonly KnowledgeEntry[];
}>;

const characterCount = (value: string) => Array.from(value).length;

function relatedSuggestionIds(
  selectedEntries: readonly KnowledgeEntry[],
): readonly SuggestionId[] {
  if (selectedEntries.length === 0) {
    return followUpSuggestedQuestions.slice(0, 3).map(({ id }) => id);
  }

  const selectedKnowledgeIds = new Set(selectedEntries.map(({ id }) => id));
  const selectedTopics = new Set(
    selectedEntries.flatMap(({ topics }) => topics),
  );

  return followUpSuggestedQuestions
    .map((suggestion, catalogIndex) => {
      const knowledgeOverlap = suggestion.knowledge.filter((id) =>
        selectedKnowledgeIds.has(id),
      ).length;
      const topicOverlap = suggestion.topics.filter((topic) =>
        selectedTopics.has(topic),
      ).length;
      return {
        id: suggestion.id,
        score: knowledgeOverlap * 12 + topicOverlap * 3,
        catalogIndex,
      };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.catalogIndex - right.catalogIndex,
    )
    .map(({ id }) => id);
}

/** Build structured provider input without mixing untrusted history into facts. */
export function buildBoundedModelInput(
  request: AskRequest,
  matches: readonly RetrievalMatch[],
  knowledgeCoverage: ModelInput["knowledgeCoverage"],
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
      knowledgeCoverage,
      knowledge,
      // Follow-ups are curated, deterministic, and ranked from the selected
      // evidence rather than recycling the empty-state starter list.
      allowedSuggestionIds: relatedSuggestionIds(selectedEntries),
    },
  };
}
