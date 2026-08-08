import { ASK_LIMITS, type AskEvent } from "../contract";
import {
  AskTransportFailure,
  parseAskEvent,
  type AskTransport,
  type AskTransportProblemCode,
} from "./transport-port";

export type AskHttpFetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export type HttpAskTransportOptions = Readonly<{
  endpoint?: string;
  fetcher?: AskHttpFetcher;
}>;

const utf8Bytes = (value: string) => new TextEncoder().encode(value).byteLength;

function retryAfterMs(response: Response): number | undefined {
  const seconds = Number(response.headers.get("retry-after"));
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined;
  return Math.max(1_000, Math.min(Math.ceil(seconds * 1_000), 3_600_000));
}

function statusFailure(response: Response): AskTransportFailure {
  let code: AskTransportProblemCode = "invalid-response";
  if (response.status === 429) code = "rate-limited";
  else if (response.status === 504) code = "timeout";
  else if (response.status === 503) code = "unavailable";
  return new AskTransportFailure(code, retryAfterMs(response));
}

function failureMatchesStatus(
  status: number,
  code: Extract<AskEvent, { type: "answer.failed" }>["problem"]["code"],
): boolean {
  if (status === 400 || status === 413) return code === "invalid-response";
  if (status === 429) return code === "rate-limited";
  if (status === 503) {
    return (
      code === "budget-disabled" ||
      code === "unavailable" ||
      code === "invalid-response"
    );
  }
  if (status === 504) return code === "timeout";
  return false;
}

function assertStatusMatchesTerminal(
  response: Response,
  event: AskEvent,
): void {
  if (event.type !== "answer.completed" && event.type !== "answer.failed") {
    return;
  }
  if (response.status === 200) {
    if (event.type === "answer.failed") {
      throw new AskTransportFailure("invalid-response");
    }
    return;
  }
  if (
    event.type === "answer.completed" ||
    !failureMatchesStatus(response.status, event.problem.code)
  ) {
    throw statusFailure(response);
  }
}

function isAbort(error: unknown, signal: AbortSignal): boolean {
  return (
    signal.aborted ||
    (error instanceof DOMException && error.name === "AbortError") ||
    (typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "AbortError")
  );
}

/** Bounded HTTP newline-delimited JSON Adapter for the owned Next route. */
export function createHttpAskTransport(
  options: HttpAskTransportOptions = {},
): AskTransport {
  const endpoint = options.endpoint ?? "/api/ask-jakub";
  const fetcher: AskHttpFetcher =
    options.fetcher ?? ((input, init) => globalThis.fetch(input, init));

  return {
    async *stream(request, { signal }) {
      const body = JSON.stringify(request);
      if (utf8Bytes(body) > ASK_LIMITS.bodyBytes) {
        throw new AskTransportFailure("invalid-response");
      }

      let response: Response;
      try {
        response = await fetcher(endpoint, {
          method: "POST",
          headers: {
            accept: "application/x-ndjson",
            "content-type": "application/json",
          },
          body,
          cache: "no-store",
          credentials: "same-origin",
          signal,
        });
      } catch (error) {
        if (isAbort(error, signal)) return;
        throw new AskTransportFailure("offline");
      }

      const mediaType = response.headers
        .get("content-type")
        ?.split(";", 1)[0]
        .trim()
        .toLowerCase();
      if (mediaType !== "application/x-ndjson" || !response.body) {
        throw response.ok
          ? new AskTransportFailure("invalid-response")
          : statusFailure(response);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8", { fatal: true });
      let buffer = "";
      let totalBytes = 0;
      let yielded = false;
      let eventCount = 0;
      let fullyRead = false;
      let statusCompatibleTerminal = false;

      const decode = (value?: Uint8Array, stream = false): string => {
        try {
          return decoder.decode(value, { stream });
        } catch {
          throw new AskTransportFailure("invalid-response");
        }
      };

      const parseLine = (line: string) => {
        let value: unknown;
        try {
          value = JSON.parse(line) as unknown;
        } catch {
          throw new AskTransportFailure("invalid-response");
        }
        const event = parseAskEvent(value);
        if (!event) throw new AskTransportFailure("invalid-response");
        assertStatusMatchesTerminal(response, event);
        if (
          event.type === "answer.completed" ||
          event.type === "answer.failed"
        ) {
          statusCompatibleTerminal = true;
        }
        eventCount += 1;
        if (eventCount > 4) {
          throw new AskTransportFailure("invalid-response");
        }
        return event;
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            fullyRead = true;
            break;
          }
          totalBytes += value.byteLength;
          if (totalBytes > ASK_LIMITS.responseBytes) {
            await reader.cancel().catch(() => undefined);
            throw new AskTransportFailure("invalid-response");
          }
          buffer += decode(value, true);

          let newline = buffer.indexOf("\n");
          while (newline >= 0) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            if (line) {
              yielded = true;
              yield parseLine(line);
            }
            newline = buffer.indexOf("\n");
          }
        }

        buffer += decode();
        const finalLine = buffer.trim();
        if (finalLine) {
          yielded = true;
          yield parseLine(finalLine);
        }
        if (!yielded) {
          throw response.ok
            ? new AskTransportFailure("invalid-response")
            : statusFailure(response);
        }
        if (response.status !== 200 && !statusCompatibleTerminal) {
          throw statusFailure(response);
        }
      } catch (error) {
        if (isAbort(error, signal)) return;
        if (error instanceof AskTransportFailure) throw error;
        throw new AskTransportFailure("offline");
      } finally {
        if (!fullyRead) {
          await reader.cancel().catch(() => undefined);
        }
        reader.releaseLock();
      }
    },
  };
}
