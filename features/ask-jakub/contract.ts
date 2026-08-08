import type { EvidenceId, SuggestionId } from "@/features/portfolio-knowledge";
import type { Lang } from "@/lib/lang";

export const ASK_PROTOCOL_VERSION = 1 as const;

export const ASK_LIMITS = Object.freeze({
  bodyBytes: 32_768,
  questionCharacters: 600,
  identifierCharacters: 128,
  historyTurns: 12,
  historyTurnCharacters: 1_200,
  historyCharacters: 6_000,
  selectedKnowledgeEntries: 6,
  selectedKnowledgeCharacters: 900,
  answerCharacters: 2_400,
  responseBytes: 8_192,
  timeoutMs: 8_000,
});

export type AskProblemCode =
  | "empty-question"
  | "question-too-long"
  | "busy"
  | "offline"
  | "rate-limited"
  | "timeout"
  | "budget-disabled"
  | "unavailable"
  | "invalid-response";

export type AskProblem = Readonly<{
  code: AskProblemCode;
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
}>;

export type CompletedTurn = Readonly<{
  role: "portfolio-visitor" | "ask-jakub";
  text: string;
}>;

export type AskRequest = Readonly<{
  version: typeof ASK_PROTOCOL_VERSION;
  sessionId: string;
  requestId: string;
  language: Lang;
  question: string;
  history: readonly CompletedTurn[];
}>;

export type AskEvent =
  | Readonly<{
      version: typeof ASK_PROTOCOL_VERSION;
      requestId: string;
      type: "request.accepted";
    }>
  | Readonly<{
      version: typeof ASK_PROTOCOL_VERSION;
      requestId: string;
      type: "phase.changed";
      phase: "retrieving" | "composing";
    }>
  | Readonly<{
      version: typeof ASK_PROTOCOL_VERSION;
      requestId: string;
      type: "answer.completed";
      kind: "answered" | "clarification" | "not-covered";
      text: string;
      evidenceIds: readonly EvidenceId[];
      suggestionIds: readonly SuggestionId[];
    }>
  | Readonly<{
      version: typeof ASK_PROTOCOL_VERSION;
      requestId: string;
      type: "answer.failed";
      problem: AskProblem;
    }>;
