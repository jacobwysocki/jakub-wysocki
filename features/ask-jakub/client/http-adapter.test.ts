import { describe, expect, it, vi } from "vitest";
import { ASK_LIMITS, type AskEvent, type AskRequest } from "../contract";
import { createHttpAskTransport } from "./http-adapter";
import { AskTransportFailure } from "./transport-port";

const request: AskRequest = {
  version: 1,
  sessionId: "session-http-test",
  requestId: "request-http-test",
  language: "en",
  question: "Which project demonstrates applied AI?",
  history: [],
};

const lifecycle: readonly AskEvent[] = [
  {
    version: 1,
    requestId: request.requestId,
    type: "request.accepted",
  },
  {
    version: 1,
    requestId: request.requestId,
    type: "phase.changed",
    phase: "retrieving",
  },
  {
    version: 1,
    requestId: request.requestId,
    type: "answer.completed",
    kind: "answered",
    text: "Squizzu is a documented applied-AI example.",
    evidenceIds: ["evidence:experience:squizzu"],
    suggestionIds: ["suggestion:squizzu"],
  },
];

function ndjsonResponse(
  events: readonly AskEvent[],
  init: ResponseInit = {},
): Response {
  return new Response(
    `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
    {
      status: 200,
      ...init,
      headers: {
        "content-type": "application/x-ndjson; charset=utf-8",
        ...Object.fromEntries(new Headers(init.headers).entries()),
      },
    },
  );
}

describe("Ask Jakub HTTP transport Adapter", () => {
  it("posts the bounded request and yields lifecycle events split across chunks", async () => {
    const source = `${lifecycle
      .map((event) => JSON.stringify(event))
      .join("\n")}\n`;
    const midpoint = Math.floor(source.length / 2);
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(source.slice(0, midpoint)));
        controller.enqueue(encoder.encode(source.slice(midpoint)));
        controller.close();
      },
    });
    const fetcher = vi.fn(async () =>
      Promise.resolve(
        new Response(body, {
          status: 200,
          headers: {
            "content-type": "application/x-ndjson; charset=utf-8",
          },
        }),
      ),
    );
    const transport = createHttpAskTransport({ fetcher });
    const signal = new AbortController().signal;

    const events = await Array.fromAsync(transport.stream(request, { signal }));

    expect(events).toEqual(lifecycle);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith("/api/ask-jakub", {
      method: "POST",
      headers: {
        accept: "application/x-ndjson",
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
  });

  it.each([
    {
      name: "unexpected content type",
      response: () =>
        new Response("<html>not owned</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
      code: "invalid-response",
    },
    {
      name: "invalid NDJSON event",
      response: () =>
        new Response('{"type":"provider.token","secret":"raw"}\n', {
          status: 200,
          headers: { "content-type": "application/x-ndjson" },
        }),
      code: "invalid-response",
    },
    {
      name: "oversized response",
      response: () =>
        new Response("x".repeat(ASK_LIMITS.responseBytes + 1), {
          status: 200,
          headers: { "content-type": "application/x-ndjson" },
        }),
      code: "invalid-response",
    },
    {
      name: "gateway timeout without an event stream",
      response: () =>
        new Response(null, {
          status: 504,
          headers: { "content-type": "text/plain" },
        }),
      code: "timeout",
    },
    {
      name: "rate limit metadata without an event stream",
      response: () =>
        new Response(null, {
          status: 429,
          headers: { "content-type": "text/plain", "retry-after": "7" },
        }),
      code: "rate-limited",
      retryAfterMs: 7_000,
    },
  ] as const)(
    "maps $name to $code",
    async ({ response, code, retryAfterMs }) => {
      const transport = createHttpAskTransport({
        fetcher: vi.fn(async () => Promise.resolve(response())),
      });

      const consume = async () =>
        Array.fromAsync(
          transport.stream(request, { signal: new AbortController().signal }),
        );

      await expect(consume()).rejects.toMatchObject({ code, retryAfterMs });
    },
  );

  it("normalizes a network failure as offline", async () => {
    const transport = createHttpAskTransport({
      fetcher: vi.fn(async () => {
        throw new TypeError("NETWORK DETAIL MUST STAY INTERNAL");
      }),
    });

    await expect(
      Array.fromAsync(
        transport.stream(request, { signal: new AbortController().signal }),
      ),
    ).rejects.toEqual(new AskTransportFailure("offline"));
  });

  it("treats malformed UTF-8 bytes as an invalid owned response", async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([0xc3, 0x28]));
        controller.close();
      },
    });
    const transport = createHttpAskTransport({
      fetcher: vi.fn(async () =>
        Promise.resolve(
          new Response(body, {
            status: 200,
            headers: { "content-type": "application/x-ndjson" },
          }),
        ),
      ),
    });

    await expect(
      Array.fromAsync(
        transport.stream(request, { signal: new AbortController().signal }),
      ),
    ).rejects.toEqual(new AskTransportFailure("invalid-response"));
  });

  it("rejects more lifecycle events than the owned protocol can emit", async () => {
    const accepted: AskEvent = {
      version: 1,
      requestId: request.requestId,
      type: "request.accepted",
    };
    const transport = createHttpAskTransport({
      fetcher: vi.fn(async () =>
        Promise.resolve(
          ndjsonResponse([accepted, accepted, accepted, accepted, accepted]),
        ),
      ),
    });

    await expect(
      Array.fromAsync(
        transport.stream(request, { signal: new AbortController().signal }),
      ),
    ).rejects.toEqual(new AskTransportFailure("invalid-response"));
  });

  it("cancels the response reader when its consumer rejects the stream early", async () => {
    let cancelCount = 0;
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(`${JSON.stringify(lifecycle[0])}\n`));
      },
      cancel() {
        cancelCount += 1;
      },
    });
    const transport = createHttpAskTransport({
      fetcher: vi.fn(async () =>
        Promise.resolve(
          new Response(body, {
            status: 200,
            headers: { "content-type": "application/x-ndjson" },
          }),
        ),
      ),
    });
    const iterator = transport
      .stream(request, { signal: new AbortController().signal })
      [Symbol.asyncIterator]();

    await expect(iterator.next()).resolves.toEqual({
      done: false,
      value: lifecycle[0],
    });
    await iterator.return?.();

    expect(cancelCount).toBe(1);
  });

  it("forwards abort and ends without converting visitor cancellation into an error", async () => {
    const controller = new AbortController();
    let receivedSignal: AbortSignal | undefined;
    const transport = createHttpAskTransport({
      fetcher: vi.fn((_input, init) => {
        const signal = init?.signal as AbortSignal;
        receivedSignal = signal;
        return new Promise<Response>((_resolve, reject) => {
          signal.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        });
      }),
    });
    const iterator = transport
      .stream(request, { signal: controller.signal })
      [Symbol.asyncIterator]();
    const pending = iterator.next();

    controller.abort();

    await expect(pending).resolves.toEqual({ done: true, value: undefined });
    expect(receivedSignal).toBe(controller.signal);
  });

  it("accepts a validated failure stream even when HTTP status is non-success", async () => {
    const failedEvent: AskEvent = {
      version: 1,
      requestId: request.requestId,
      type: "answer.failed",
      problem: {
        code: "budget-disabled",
        message: "The guide is temporarily offline.",
        retryable: false,
      },
    };
    const transport = createHttpAskTransport({
      fetcher: vi.fn(async () =>
        Promise.resolve(ndjsonResponse([failedEvent], { status: 503 })),
      ),
    });

    await expect(
      Array.fromAsync(
        transport.stream(request, { signal: new AbortController().signal }),
      ),
    ).resolves.toEqual([failedEvent]);
  });

  it.each([
    {
      name: "a non-success status with a completed answer",
      response: () => ndjsonResponse(lifecycle, { status: 503 }),
      code: "unavailable",
    },
    {
      name: "an unexpected 206 success status with a completed answer",
      response: () => ndjsonResponse(lifecycle, { status: 206 }),
      code: "invalid-response",
    },
    {
      name: "a success status with a failed terminal",
      response: () =>
        ndjsonResponse([
          {
            version: 1,
            requestId: request.requestId,
            type: "answer.failed",
            problem: {
              code: "unavailable",
              message: "Contradictory terminal.",
              retryable: true,
            },
          },
        ]),
      code: "invalid-response",
    },
  ] as const)("rejects $name", async ({ response, code }) => {
    const transport = createHttpAskTransport({
      fetcher: vi.fn(async () => Promise.resolve(response())),
    });

    await expect(
      Array.fromAsync(
        transport.stream(request, { signal: new AbortController().signal }),
      ),
    ).rejects.toMatchObject({ code });
  });
});
