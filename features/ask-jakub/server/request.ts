import "server-only";

import {
  ASK_LIMITS,
  type AskProblemCode,
  type AskRequest,
  type CompletedTurn,
} from "../contract";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const characterCount = (value: string) => Array.from(value).length;
const hasOnlyKeys = (value: Record<string, unknown>, keys: readonly string[]) =>
  Object.keys(value).length === keys.length &&
  Object.keys(value).every((key) => keys.includes(key));

const isSafeIdentifier = (value: unknown): value is string =>
  typeof value === "string" &&
  characterCount(value) >= 1 &&
  characterCount(value) <= ASK_LIMITS.identifierCharacters &&
  /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value);

export type RequestValidation =
  | Readonly<{ ok: true; request: AskRequest }>
  | Readonly<{
      ok: false;
      requestId: string;
      language: "pl" | "en";
      code: Extract<
        AskProblemCode,
        "empty-question" | "question-too-long" | "invalid-response"
      >;
    }>;

function failure(
  value: unknown,
  code: Extract<
    AskProblemCode,
    "empty-question" | "question-too-long" | "invalid-response"
  > = "invalid-response",
): RequestValidation {
  return {
    ok: false,
    requestId:
      isRecord(value) && isSafeIdentifier(value.requestId)
        ? value.requestId
        : "invalid-request",
    language:
      isRecord(value) && value.language === "pl" ? value.language : "en",
    code,
  };
}

function parseHistory(value: unknown): readonly CompletedTurn[] | undefined {
  if (!Array.isArray(value) || value.length > ASK_LIMITS.historyTurns) {
    return undefined;
  }

  const history: CompletedTurn[] = [];
  let totalCharacters = 0;
  for (const item of value) {
    if (
      !isRecord(item) ||
      !hasOnlyKeys(item, ["role", "text"]) ||
      (item.role !== "portfolio-visitor" && item.role !== "ask-jakub") ||
      typeof item.text !== "string"
    ) {
      return undefined;
    }
    const text = item.text.trim();
    const length = characterCount(text);
    totalCharacters += length;
    if (
      length < 1 ||
      length > ASK_LIMITS.historyTurnCharacters ||
      totalCharacters > ASK_LIMITS.historyCharacters
    ) {
      return undefined;
    }
    history.push({ role: item.role, text });
  }
  return history;
}

export function validateAskRequest(value: unknown): RequestValidation {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "version",
      "sessionId",
      "requestId",
      "language",
      "question",
      "history",
    ]) ||
    value.version !== 1 ||
    !isSafeIdentifier(value.sessionId) ||
    !isSafeIdentifier(value.requestId) ||
    (value.language !== "pl" && value.language !== "en") ||
    typeof value.question !== "string"
  ) {
    return failure(value);
  }

  const question = value.question.trim();
  const questionLength = characterCount(question);
  if (questionLength === 0) return failure(value, "empty-question");
  if (questionLength > ASK_LIMITS.questionCharacters) {
    return failure(value, "question-too-long");
  }

  const history = parseHistory(value.history);
  if (!history) return failure(value);

  return {
    ok: true,
    request: {
      version: 1,
      sessionId: value.sessionId,
      requestId: value.requestId,
      language: value.language,
      question,
      history,
    },
  };
}

export function parseAskRequest(value: unknown): AskRequest | undefined {
  const result = validateAskRequest(value);
  return result.ok ? result.request : undefined;
}
