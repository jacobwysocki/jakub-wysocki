import type { AskTransport } from "./transport-port";

/** Deterministic provider-disabled experience for tests, previews, and demos. */
export const providerDisabledAskTransport: AskTransport = {
  async *stream(request, { signal }) {
    if (signal.aborted) return;
    yield {
      version: 1,
      requestId: request.requestId,
      type: "request.accepted",
    };
    if (signal.aborted) return;
    yield {
      version: 1,
      requestId: request.requestId,
      type: "phase.changed",
      phase: "retrieving",
    };
    if (signal.aborted) return;
    yield {
      version: 1,
      requestId: request.requestId,
      type: "answer.failed",
      problem: {
        code: "unavailable",
        message:
          request.language === "pl"
            ? "Ask Jakub jest teraz niedostępny."
            : "Ask Jakub is currently unavailable.",
        retryable: true,
      },
    };
  },
};
