import "server-only";

import {
  findEvidence,
  type EvidenceId,
  type KnowledgeEntry,
  type KnowledgeId,
  type SuggestionId,
} from "@/features/portfolio-knowledge";
import { ASK_LIMITS, type AskEvent, type AskRequest } from "../contract";
import type { ModelResult } from "./model-port";

export const MAX_ANSWER_CHARACTERS = ASK_LIMITS.answerCharacters;
const MAX_RAW_RESULT_IDS = 12;
const MAX_EVIDENCE_LINKS = 3;
const MAX_SUGGESTIONS = 3;
const MAX_CLARIFICATION_CHARACTERS = 240;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
const hasOnlyResultKeys = (value: Record<string, unknown>) => {
  const allowed = new Set(["kind", "text", "knowledgeIds", "suggestionIds"]);
  return (
    Object.keys(value).length === allowed.size &&
    Object.keys(value).every((key) => allowed.has(key))
  );
};

const characterCount = (value: string) => Array.from(value).length;
const EXPLICIT_DESTINATION =
  /(?:\b[A-Z][A-Z0-9+.-]*:\/\/|\bjavascript\s*:|\bdata:(?=\S)|\b(?:mailto|tel):|www\.|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b)/iu;
const PROTOCOL_RELATIVE_DESTINATION = /(?:^|[\s("'`])\/\/[^\s/][^\s]*/iu;
const BARE_HOST_DESTINATION =
  /\b(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,63}\/[^\s]*/iu;
const HTML_TAG = /<\/?[A-Za-z][^>]*>/u;
const MARKDOWN_DESTINATION = /\[[^\]\n]{1,200}\]\([^\n)]*\)/u;
const INTERNAL_APP_ID = /\bsite:[a-z0-9-]+\b/iu;

function unique<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)];
}

export function validateTerminalAnswer(
  value: unknown,
  request: AskRequest,
  selectedEntries: readonly KnowledgeEntry[],
  allowedSuggestionIds: readonly SuggestionId[],
): Extract<AskEvent, { type: "answer.completed" }> | undefined {
  if (
    !isRecord(value) ||
    !hasOnlyResultKeys(value) ||
    (value.kind !== "answered" &&
      value.kind !== "clarification" &&
      value.kind !== "not-covered") ||
    typeof value.text !== "string" ||
    !isStringArray(value.knowledgeIds) ||
    !isStringArray(value.suggestionIds) ||
    value.knowledgeIds.length > MAX_RAW_RESULT_IDS ||
    value.suggestionIds.length > MAX_RAW_RESULT_IDS
  ) {
    return undefined;
  }

  const text = value.text.trim();
  if (
    !text ||
    characterCount(text) > MAX_ANSWER_CHARACTERS ||
    EXPLICIT_DESTINATION.test(text) ||
    PROTOCOL_RELATIVE_DESTINATION.test(text) ||
    BARE_HOST_DESTINATION.test(text) ||
    HTML_TAG.test(text) ||
    MARKDOWN_DESTINATION.test(text) ||
    INTERNAL_APP_ID.test(text)
  ) {
    return undefined;
  }
  if (
    value.kind === "clarification" &&
    (characterCount(text) > MAX_CLARIFICATION_CHARACTERS ||
      !text.endsWith("?") ||
      text.split("?").length !== 2)
  ) {
    return undefined;
  }

  const entryById = new Map(selectedEntries.map((entry) => [entry.id, entry]));
  const knowledgeIds = unique(value.knowledgeIds as KnowledgeId[]);
  if (
    knowledgeIds.some((id) => !entryById.has(id)) ||
    (value.kind === "answered" && knowledgeIds.length === 0)
  ) {
    return undefined;
  }

  const allowedSuggestions = new Set(allowedSuggestionIds);
  const suggestionIds = unique(value.suggestionIds as SuggestionId[]);
  if (suggestionIds.some((id) => !allowedSuggestions.has(id))) {
    return undefined;
  }

  const evidenceIds = unique(
    knowledgeIds.flatMap(
      (id) => entryById.get(id)?.evidence ?? ([] as EvidenceId[]),
    ),
  );
  if (
    evidenceIds.some((id) => findEvidence(id) === undefined) ||
    (value.kind === "answered" && evidenceIds.length === 0) ||
    (value.kind === "not-covered" &&
      evidenceIds.length === 0 &&
      suggestionIds.length === 0)
  ) {
    return undefined;
  }

  const result = value as ModelResult;
  return {
    version: 1,
    requestId: request.requestId,
    type: "answer.completed",
    kind: result.kind,
    text,
    evidenceIds: evidenceIds.slice(0, MAX_EVIDENCE_LINKS),
    suggestionIds: suggestionIds.slice(0, MAX_SUGGESTIONS),
  };
}
