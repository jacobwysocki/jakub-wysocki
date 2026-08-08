import type { AskEvent, AskProblemCode, AskRequest } from "../contract";
import { ASK_LIMITS, ASK_PROTOCOL_VERSION } from "../contract";

export type AskTransportOptions = Readonly<{ signal: AbortSignal }>;

/** Internal browser-to-owned-route seam. Ordinary React callers never use it. */
export type AskTransport = Readonly<{
  stream(
    request: AskRequest,
    options: AskTransportOptions,
  ): AsyncIterable<AskEvent>;
}>;

export type AskTransportProblemCode = Extract<
  AskProblemCode,
  | "offline"
  | "rate-limited"
  | "timeout"
  | "budget-disabled"
  | "unavailable"
  | "invalid-response"
>;

/** Safe operational failure vocabulary for Adapters; never exposes internals. */
export class AskTransportFailure extends Error {
  constructor(
    readonly code: AskTransportProblemCode,
    readonly retryAfterMs?: number,
  ) {
    super(`Ask Jakub transport failed: ${code}`);
    this.name = "AskTransportFailure";
  }
}

const PROBLEM_CODES = new Set<AskProblemCode>([
  "empty-question",
  "question-too-long",
  "busy",
  "offline",
  "rate-limited",
  "timeout",
  "budget-disabled",
  "unavailable",
  "invalid-response",
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

const characterCount = (value: string) => Array.from(value).length;

const isSafeIdentifier = (value: unknown, prefix?: string): value is string =>
  typeof value === "string" &&
  characterCount(value) >= 1 &&
  characterCount(value) <= ASK_LIMITS.identifierCharacters &&
  /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value) &&
  (prefix === undefined || value.startsWith(prefix));

const isIdentifierArray = (value: unknown, prefix: string): value is string[] =>
  Array.isArray(value) &&
  value.length <= 12 &&
  value.every((item) => isSafeIdentifier(item, prefix));

/** Runtime guard for the remote-owned event stream. */
export function parseAskEvent(value: unknown): AskEvent | undefined {
  if (
    !isRecord(value) ||
    value.version !== ASK_PROTOCOL_VERSION ||
    !isSafeIdentifier(value.requestId) ||
    typeof value.type !== "string"
  ) {
    return undefined;
  }

  if (value.type === "request.accepted") {
    return hasOnlyKeys(value, ["version", "requestId", "type"])
      ? (value as AskEvent)
      : undefined;
  }

  if (value.type === "phase.changed") {
    return hasOnlyKeys(value, ["version", "requestId", "type", "phase"]) &&
      (value.phase === "retrieving" || value.phase === "composing")
      ? (value as AskEvent)
      : undefined;
  }

  if (value.type === "answer.completed") {
    return hasOnlyKeys(value, [
      "version",
      "requestId",
      "type",
      "kind",
      "text",
      "evidenceIds",
      "suggestionIds",
    ]) &&
      (value.kind === "answered" ||
        value.kind === "clarification" ||
        value.kind === "not-covered") &&
      typeof value.text === "string" &&
      value.text === value.text.trim() &&
      characterCount(value.text) >= 1 &&
      characterCount(value.text) <= ASK_LIMITS.answerCharacters &&
      isIdentifierArray(value.evidenceIds, "evidence:") &&
      isIdentifierArray(value.suggestionIds, "suggestion:")
      ? (value as AskEvent)
      : undefined;
  }

  if (value.type !== "answer.failed") return undefined;
  if (
    !hasOnlyKeys(value, ["version", "requestId", "type", "problem"]) ||
    !isRecord(value.problem) ||
    !hasOnlyKeys(
      value.problem,
      value.problem.retryAfterMs === undefined
        ? ["code", "message", "retryable"]
        : ["code", "message", "retryable", "retryAfterMs"],
    ) ||
    typeof value.problem.code !== "string" ||
    !PROBLEM_CODES.has(value.problem.code as AskProblemCode) ||
    typeof value.problem.message !== "string" ||
    characterCount(value.problem.message.trim()) < 1 ||
    typeof value.problem.retryable !== "boolean" ||
    (value.problem.retryAfterMs !== undefined &&
      (typeof value.problem.retryAfterMs !== "number" ||
        !Number.isFinite(value.problem.retryAfterMs) ||
        value.problem.retryAfterMs <= 0))
  ) {
    return undefined;
  }
  return value as AskEvent;
}
