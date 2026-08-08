import "server-only";

import { ASK_LIMITS, type AskEvent } from "../contract";
import { answerAskJakub } from "./answer";
import {
  AnswerAbortedError,
  AnswerTimeoutError,
  createOperationDeadline,
  type OperationDeadline,
} from "./deadline";
import type { AnswerModelPort } from "./model-port";

const RESPONSE_HEADERS = {
  "cache-control": "no-store",
  "content-type": "application/x-ndjson; charset=utf-8",
  "x-content-type-options": "nosniff",
} as const;

function serializeEvents(events: readonly AskEvent[]): string {
  return `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
}

function eventResponse(
  events: readonly AskEvent[],
  status: number,
  language: "pl" | "en" = "en",
): Response {
  let responseEvents = events;
  let responseStatus = status;
  let body = serializeEvents(responseEvents);

  if (new TextEncoder().encode(body).byteLength > ASK_LIMITS.responseBytes) {
    const requestId = events[0]?.requestId ?? "invalid-request";
    responseEvents = [
      ...events.filter(
        (event) =>
          event.type === "request.accepted" || event.type === "phase.changed",
      ),
      {
        version: 1,
        requestId,
        type: "answer.failed",
        problem: {
          code: "invalid-response",
          message:
            language === "pl"
              ? "Odpowiedź przekroczyła bezpieczny limit. Spróbuj ponownie."
              : "The answer exceeded the safe response limit. Please try again.",
          retryable: true,
        },
      },
    ];
    responseStatus = 503;
    body = serializeEvents(responseEvents);
  }

  const headers = new Headers(RESPONSE_HEADERS);
  const terminalFailure = responseEvents.find(
    (event): event is Extract<AskEvent, { type: "answer.failed" }> =>
      event.type === "answer.failed",
  );
  if (
    responseStatus === 429 &&
    terminalFailure?.problem.retryAfterMs !== undefined
  ) {
    headers.set(
      "retry-after",
      String(Math.ceil(terminalFailure.problem.retryAfterMs / 1_000)),
    );
  }

  return new Response(body, { status: responseStatus, headers });
}

class BodyTooLargeError extends Error {}

async function readBoundedBody(
  request: Request,
  deadline: OperationDeadline,
): Promise<string> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > ASK_LIMITS.bodyBytes
  ) {
    throw new BodyTooLargeError();
  }

  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  let readCompleted = false;

  try {
    while (true) {
      const { done, value } = await deadline.run(() => reader.read());
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > ASK_LIMITS.bodyBytes) {
        throw new BodyTooLargeError();
      }
      chunks.push(value);
    }
    readCompleted = true;
  } catch (error) {
    void reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    if (readCompleted) reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

const invalidRequestEvent = (message: string): AskEvent => ({
  version: 1,
  requestId: "invalid-request",
  type: "answer.failed",
  problem: {
    code: "invalid-response",
    message,
    retryable: false,
  },
});

function deadlineFailureResponse(error: unknown): Response | undefined {
  if (error instanceof AnswerTimeoutError) {
    return eventResponse(
      [
        {
          version: 1,
          requestId: "invalid-request",
          type: "answer.failed",
          problem: {
            code: "timeout",
            message: "The request took too long. Please try again.",
            retryable: true,
          },
        },
      ],
      504,
    );
  }
  if (error instanceof AnswerAbortedError) {
    return eventResponse(
      [
        {
          version: 1,
          requestId: "invalid-request",
          type: "answer.failed",
          problem: {
            code: "unavailable",
            message: "The request was cancelled. You can try again.",
            retryable: true,
          },
        },
      ],
      503,
    );
  }
  return undefined;
}

export type AskJakubRouteOptions = Readonly<{ timeoutMs?: number }>;

export function createAskJakubRoute(
  model: AnswerModelPort,
  options: AskJakubRouteOptions = {},
) {
  return async function post(request: Request): Promise<Response> {
    const deadline = createOperationDeadline(request.signal, options.timeoutMs);
    try {
      if (
        request.headers
          .get("content-type")
          ?.split(";", 1)[0]
          .trim()
          .toLowerCase() !== "application/json"
      ) {
        return eventResponse(
          [invalidRequestEvent("Invalid Ask Jakub request.")],
          400,
        );
      }

      let body: unknown;
      try {
        const source = await readBoundedBody(request, deadline);
        body = await deadline.run(async () => JSON.parse(source) as unknown);
      } catch (error) {
        if (error instanceof BodyTooLargeError) {
          return eventResponse(
            [invalidRequestEvent("Ask Jakub request body is too large.")],
            413,
          );
        }
        const deadlineFailure = deadlineFailureResponse(error);
        if (deadlineFailure) return deadlineFailure;
        body = undefined;
      }

      const result = await answerAskJakub(body, model, { deadline });
      return eventResponse(
        result.events,
        result.status,
        typeof body === "object" &&
          body !== null &&
          "language" in body &&
          body.language === "pl"
          ? "pl"
          : "en",
      );
    } finally {
      deadline.dispose();
    }
  };
}
