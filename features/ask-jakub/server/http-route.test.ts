import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { validAskRequest } from "./__fixtures__/requests";
import { createAskJakubRoute } from "./http-route";
import { createScriptedModel } from "./scripted-model-adapter";

async function eventsFrom(response: Response) {
  return (await response.text())
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as unknown);
}

describe("Ask Jakub owned HTTP route", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("times out and cancels a request body stream that stalls", async () => {
    vi.useFakeTimers();
    let bodyController: ReadableStreamDefaultController<Uint8Array> | undefined;
    let bodyCancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        bodyController = controller;
      },
      cancel() {
        bodyCancelled = true;
        return new Promise<void>(() => undefined);
      },
    });
    const model = createScriptedModel([]);
    let settled = false;
    const pending = createAskJakubRoute(model, { timeoutMs: 20 })(
      new Request("http://portfolio.test/api/ask-jakub", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        duplex: "half",
      } as RequestInit & { duplex: "half" }),
    );
    void pending.then(() => {
      settled = true;
    });

    try {
      await vi.advanceTimersByTimeAsync(20);

      expect(settled).toBe(true);
      const response = await pending;
      expect(response.status).toBe(504);
      expect((await eventsFrom(response)).at(-1)).toMatchObject({
        type: "answer.failed",
        problem: { code: "timeout", retryable: true },
      });
      expect(bodyCancelled).toBe(true);
      expect(model.inputs).toHaveLength(0);
    } finally {
      if (!settled) {
        try {
          bodyController?.close();
        } catch {
          // The implementation may already have cancelled the stream.
        }
        await vi.advanceTimersByTimeAsync(20);
      }
    }
  });

  it("uses one absolute timeout across body reading and model work", async () => {
    vi.useFakeTimers();
    let bodyController: ReadableStreamDefaultController<Uint8Array> | undefined;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        bodyController = controller;
      },
    });
    const model = createScriptedModel([
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 15));
        return {
          kind: "not-covered",
          text: "That subject is not covered by this portfolio.",
          knowledgeIds: [],
          suggestionIds: ["suggestion:full-stack-hiring"],
        };
      },
    ]);
    let settled = false;
    const pending = createAskJakubRoute(model, { timeoutMs: 20 })(
      new Request("http://portfolio.test/api/ask-jakub", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        duplex: "half",
      } as RequestInit & { duplex: "half" }),
    );
    void pending.then(() => {
      settled = true;
    });

    try {
      await vi.advanceTimersByTimeAsync(15);
      bodyController?.enqueue(
        new TextEncoder().encode(JSON.stringify(validAskRequest)),
      );
      bodyController?.close();
      await vi.advanceTimersByTimeAsync(0);

      expect(model.inputs).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(5);

      expect(settled).toBe(true);
      const response = await pending;
      expect(response.status).toBe(504);
      expect((await eventsFrom(response)).at(-1)).toMatchObject({
        type: "answer.failed",
        problem: { code: "timeout", retryable: true },
      });
    } finally {
      if (!settled) await vi.advanceTimersByTimeAsync(15);
    }
  });

  it("normalizes request aborts and cancels the active body reader", async () => {
    const requestController = new AbortController();
    let bodyCancelled = false;
    const body = new ReadableStream<Uint8Array>({
      cancel() {
        bodyCancelled = true;
      },
    });
    const model = createScriptedModel([]);
    const pending = createAskJakubRoute(model)(
      new Request("http://portfolio.test/api/ask-jakub", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        duplex: "half",
        signal: requestController.signal,
      } as RequestInit & { duplex: "half" }),
    );

    requestController.abort(new Error("RAW_ABORT_REASON_SENTINEL"));
    const response = await pending;
    const responseText = await response.text();

    expect(response.status).toBe(503);
    expect(JSON.parse(responseText.trim())).toMatchObject({
      type: "answer.failed",
      problem: { code: "unavailable", retryable: true },
    });
    expect(responseText).not.toContain("RAW_ABORT_REASON_SENTINEL");
    expect(bodyCancelled).toBe(true);
    expect(model.inputs).toHaveLength(0);
  });
});
