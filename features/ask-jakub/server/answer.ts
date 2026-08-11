import "server-only";

import { retrieveKnowledge } from "@/features/portfolio-knowledge";
import {
  ASK_LIMITS,
  ASK_PROTOCOL_VERSION,
  type AskEvent,
  type AskRequest,
} from "../contract";
import {
  AnswerAbortedError,
  AnswerTimeoutError,
  createOperationDeadline,
  type OperationDeadline,
} from "./deadline";
import type { AnswerModelPort } from "./model-port";
import {
  ModelBudgetDisabledError,
  ModelRateLimitedError,
} from "./model-failures";
import { validateTerminalAnswer } from "./output";
import { buildBoundedModelInput } from "./prompt";
import { ProviderUnavailableError } from "./provider-disabled-adapter";
import { validateAskRequest } from "./request";
import { isGenuinelyOffTopic } from "./scope";

export type AnswerOperationResult = Readonly<{
  status: number;
  events: readonly AskEvent[];
}>;

export type AnswerOperationOptions = Readonly<{
  signal?: AbortSignal;
  timeoutMs?: number;
  deadline?: OperationDeadline;
}>;

function unavailableMessage(language: AskRequest["language"]): string {
  return language === "pl"
    ? "Ask Jakub jest teraz niedostępny. Zamiast tego przejrzyj sugerowane pytania o portfolio."
    : "Ask Jakub is currently unavailable. Explore the suggested portfolio questions instead.";
}

function offTopicMessage(language: AskRequest["language"]): string {
  return language === "pl"
    ? "Ten temat jest poza zakresem tego przewodnika po portfolio, ale mogę pomóc poznać udokumentowane doświadczenie, projekty, umiejętności, wykształcenie i opcje kontaktu Jakuba."
    : "That topic is outside this portfolio guide, but I can help you explore Jakub's documented work, projects, skills, education, and contact options.";
}

function nearestKnowledgeQuery(language: AskRequest["language"]): string {
  return language === "pl"
    ? "Jakub obecna praca doświadczenie projekty umiejętności"
    : "Jakub current work experience projects skills";
}

export async function answerAskJakub(
  input: unknown,
  model: AnswerModelPort,
  options: AnswerOperationOptions = {},
): Promise<AnswerOperationResult> {
  const validation = validateAskRequest(input);
  if (!validation.ok) {
    const messages = {
      en: {
        "empty-question": "Enter a question about Jakub's portfolio.",
        "question-too-long": "Keep the question to 600 characters or fewer.",
        "invalid-response": "Invalid Ask Jakub request.",
      },
      pl: {
        "empty-question": "Wpisz pytanie o portfolio Jakuba.",
        "question-too-long": "Pytanie może mieć maksymalnie 600 znaków.",
        "invalid-response": "Nieprawidłowe żądanie Ask Jakub.",
      },
    } as const;
    return {
      status: 400,
      events: [
        {
          version: ASK_PROTOCOL_VERSION,
          requestId: validation.requestId,
          type: "answer.failed",
          problem: {
            code: validation.code,
            message: messages[validation.language][validation.code],
            retryable: false,
          },
        },
      ],
    };
  }
  const request = validation.request;

  const events: AskEvent[] = [
    {
      version: ASK_PROTOCOL_VERSION,
      requestId: request.requestId,
      type: "request.accepted",
    },
    {
      version: ASK_PROTOCOL_VERSION,
      requestId: request.requestId,
      type: "phase.changed",
      phase: "retrieving",
    },
  ];
  const offTopic = isGenuinelyOffTopic(request.question, request.language);
  const directMatches = offTopic
    ? []
    : retrieveKnowledge(request.question, request.language, {
        limit: ASK_LIMITS.selectedKnowledgeEntries,
      });

  events.push({
    version: ASK_PROTOCOL_VERSION,
    requestId: request.requestId,
    type: "phase.changed",
    phase: "composing",
  });

  if (offTopic) {
    events.push({
      version: ASK_PROTOCOL_VERSION,
      requestId: request.requestId,
      type: "answer.completed",
      kind: "not-covered",
      text: offTopicMessage(request.language),
      evidenceIds: [],
      suggestionIds: [
        "suggestion:full-stack-hiring",
        "suggestion:applied-ai",
        "suggestion:contact",
      ],
    });
    return { status: 200, events };
  }

  const usesNearestKnowledge = directMatches.length === 0;
  const matches = usesNearestKnowledge
    ? retrieveKnowledge(
        nearestKnowledgeQuery(request.language),
        request.language,
        {
          limit: ASK_LIMITS.selectedKnowledgeEntries,
        },
      )
    : directMatches;
  const boundedInput = buildBoundedModelInput(
    request,
    matches,
    usesNearestKnowledge ? "nearest" : "matched",
  );
  const modelInput = boundedInput.input;

  const deadline =
    options.deadline ??
    createOperationDeadline(options.signal, options.timeoutMs);
  const ownsDeadline = options.deadline === undefined;
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const rawResult: unknown = await deadline.run((signal) =>
        model.generate(modelInput, { signal }),
      );
      const terminal = validateTerminalAnswer(
        rawResult,
        request,
        boundedInput.selectedEntries,
        modelInput.allowedSuggestionIds,
      );
      if (terminal) {
        events.push(terminal);
        return { status: 200, events };
      }
    }
  } catch (error) {
    if (error instanceof AnswerTimeoutError) {
      events.push({
        version: ASK_PROTOCOL_VERSION,
        requestId: request.requestId,
        type: "answer.failed",
        problem: {
          code: "timeout",
          message:
            request.language === "pl"
              ? "Odpowiedź trwała zbyt długo. Spróbuj ponownie."
              : "The answer took too long. Please try again.",
          retryable: true,
        },
      });
      return { status: 504, events };
    }
    if (error instanceof AnswerAbortedError) {
      events.push({
        version: ASK_PROTOCOL_VERSION,
        requestId: request.requestId,
        type: "answer.failed",
        problem: {
          code: "unavailable",
          message:
            request.language === "pl"
              ? "Żądanie zostało anulowane. Możesz spróbować ponownie."
              : "The request was cancelled. You can try again.",
          retryable: true,
        },
      });
      return { status: 503, events };
    }
    if (error instanceof ModelRateLimitedError) {
      events.push({
        version: ASK_PROTOCOL_VERSION,
        requestId: request.requestId,
        type: "answer.failed",
        problem: {
          code: "rate-limited",
          message:
            request.language === "pl"
              ? "Limit pytań został osiągnięty. Spróbuj ponownie później."
              : "The question limit has been reached. Please try again later.",
          retryable: true,
          retryAfterMs: error.retryAfterMs,
        },
      });
      return { status: 429, events };
    }
    if (error instanceof ModelBudgetDisabledError) {
      events.push({
        version: ASK_PROTOCOL_VERSION,
        requestId: request.requestId,
        type: "answer.failed",
        problem: {
          code: "budget-disabled",
          message:
            request.language === "pl"
              ? "Przewodnik jest tymczasowo offline. Portfolio nadal jest dostępne."
              : "The guide is temporarily offline. The rest of the portfolio remains available.",
          retryable: false,
        },
      });
      return { status: 503, events };
    }
    if (error instanceof ProviderUnavailableError) {
      events.push({
        version: ASK_PROTOCOL_VERSION,
        requestId: request.requestId,
        type: "answer.failed",
        problem: {
          code: "unavailable",
          message: unavailableMessage(request.language),
          retryable: true,
        },
      });
      return { status: 503, events };
    }
    events.push({
      version: ASK_PROTOCOL_VERSION,
      requestId: request.requestId,
      type: "answer.failed",
      problem: {
        code: "unavailable",
        message: unavailableMessage(request.language),
        retryable: true,
      },
    });
    return { status: 503, events };
  } finally {
    if (ownsDeadline) deadline.dispose();
  }

  events.push({
    version: ASK_PROTOCOL_VERSION,
    requestId: request.requestId,
    type: "answer.failed",
    problem: {
      code: "invalid-response",
      message:
        request.language === "pl"
          ? "Nie udało się zweryfikować odpowiedzi. Spróbuj ponownie."
          : "The answer could not be verified. Please try again.",
      retryable: true,
    },
  });
  return { status: 503, events };
}
