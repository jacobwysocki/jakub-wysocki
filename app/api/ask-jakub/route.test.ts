import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { validAskRequest } from "@/features/ask-jakub/server/__fixtures__/requests";
import { ModelRateLimitedError } from "@/features/ask-jakub/server/model-failures";
import { createAskJakubRoute } from "@/features/ask-jakub/server/http-route";
import { createScriptedModel } from "@/features/ask-jakub/server/scripted-model-adapter";

async function eventsFrom(response: Response) {
  return (await response.text())
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line) as unknown);
}

async function postForEnvironment(environment: {
  provider?: string;
  apiKey?: string;
}) {
  vi.stubEnv("ASK_JAKUB_PROVIDER", environment.provider ?? "disabled");
  vi.stubEnv("GROQ_API_KEY", environment.apiKey ?? "");
  vi.resetModules();
  return (await import("./route")).POST;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("POST /api/ask-jakub", () => {
  it("rejects unsupported content before accepting a request", async () => {
    const post = await postForEnvironment({});
    const response = await post(
      new Request("http://portfolio.test/api/ask-jakub", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "not-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain(
      "application/x-ndjson",
    );
    expect(await response.text()).toBe(
      `${JSON.stringify({
        version: 1,
        requestId: "invalid-request",
        type: "answer.failed",
        problem: {
          code: "invalid-response",
          message: "Invalid Ask Jakub request.",
          retryable: false,
        },
      })}\n`,
    );
  });

  it("exposes a useful provider-disabled lifecycle without an external call", async () => {
    const post = await postForEnvironment({});
    const response = await post(
      new Request("http://portfolio.test/api/ask-jakub", {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify(validAskRequest),
      }),
    );

    expect(response.status).toBe(503);
    expect(await eventsFrom(response)).toEqual([
      {
        version: 1,
        requestId: validAskRequest.requestId,
        type: "request.accepted",
      },
      {
        version: 1,
        requestId: validAskRequest.requestId,
        type: "phase.changed",
        phase: "retrieving",
      },
      {
        version: 1,
        requestId: validAskRequest.requestId,
        type: "phase.changed",
        phase: "composing",
      },
      {
        version: 1,
        requestId: validAskRequest.requestId,
        type: "answer.failed",
        problem: {
          code: "unavailable",
          message:
            "Ask Jakub is currently unavailable. Explore the suggested portfolio questions instead.",
          retryable: true,
        },
      },
    ]);
  });

  it("uses Groq only when the server provider switch and key are configured", async () => {
    const providerResult = {
      kind: "answered",
      text: "Use the Contact view for Jakub's public contact options.",
      knowledgeIds: ["knowledge:contact:email:primary"],
      suggestionIds: ["suggestion:full-stack-hiring"],
    };
    const fetchProvider = vi.fn(async () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify(providerResult) } }],
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        ),
      ),
    );
    vi.stubGlobal("fetch", fetchProvider);
    const configuredPost = await postForEnvironment({
      provider: "groq",
      apiKey: "test-key-not-a-secret",
    });

    const response = await configuredPost(
      new Request("http://portfolio.test/api/ask-jakub", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...validAskRequest,
          question: "How can I contact Jakub by email?",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect((await eventsFrom(response)).at(-1)).toMatchObject({
      type: "answer.completed",
      evidenceIds: ["evidence:contact"],
    });
    expect(fetchProvider).toHaveBeenCalledOnce();
  });

  it("rejects an oversized body before JSON parsing or provider invocation", async () => {
    const model = createScriptedModel([]);
    const post = createAskJakubRoute(model);
    const body = JSON.stringify({
      ...validAskRequest,
      padding: "x".repeat(32_768),
    });

    const response = await post(
      new Request("http://portfolio.test/api/ask-jakub", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      }),
    );

    expect(new TextEncoder().encode(body).byteLength).toBeGreaterThan(32_768);
    expect(response.status).toBe(413);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await eventsFrom(response)).toEqual([
      {
        version: 1,
        requestId: "invalid-request",
        type: "answer.failed",
        problem: {
          code: "invalid-response",
          message: "Ask Jakub request body is too large.",
          retryable: false,
        },
      },
    ]);
    expect(model.inputs).toHaveLength(0);
  });

  it("replaces an oversized serialized answer instead of relaying model text", async () => {
    const oversizedText = `RAW_RESPONSE_BOUND_SENTINEL ${"🧠".repeat(2_000)}`;
    const model = createScriptedModel([
      {
        kind: "answered",
        text: oversizedText,
        knowledgeIds: ["knowledge:contact:email:primary"],
        suggestionIds: [],
      },
    ]);
    const post = createAskJakubRoute(model);
    const response = await post(
      new Request("http://portfolio.test/api/ask-jakub", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...validAskRequest,
          question: "How can I contact Jakub by email?",
        }),
      }),
    );
    const responseText = await response.text();

    expect(response.status).toBe(503);
    expect(
      new TextEncoder().encode(responseText).byteLength,
    ).toBeLessThanOrEqual(8_192);
    expect(JSON.parse(responseText.trim().split("\n").at(-1)!)).toMatchObject({
      type: "answer.failed",
      problem: { code: "invalid-response", retryable: true },
    });
    expect(responseText).not.toContain("RAW_RESPONSE_BOUND_SENTINEL");
  });

  it("returns the validated success lifecycle through the owned protocol", async () => {
    const model = createScriptedModel([
      {
        kind: "answered",
        text: "Use the Contact view for Jakub's public contact options.",
        knowledgeIds: ["knowledge:contact:email:primary"],
        suggestionIds: ["suggestion:full-stack-hiring"],
      },
    ]);
    const response = await createAskJakubRoute(model)(
      new Request("http://portfolio.test/api/ask-jakub", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...validAskRequest,
          question: "How can I contact Jakub by email?",
        }),
      }),
    );
    const events = await eventsFrom(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(events.map((event) => (event as { type: string }).type)).toEqual([
      "request.accepted",
      "phase.changed",
      "phase.changed",
      "answer.completed",
    ]);
    expect(events.at(-1)).toMatchObject({
      requestId: validAskRequest.requestId,
      type: "answer.completed",
      evidenceIds: ["evidence:contact"],
    });
  });

  it("maps trusted rate-limit metadata to 429 and Retry-After", async () => {
    const model = createScriptedModel([new ModelRateLimitedError(2_500)]);
    const response = await createAskJakubRoute(model)(
      new Request("http://portfolio.test/api/ask-jakub", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validAskRequest),
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("3");
    expect((await eventsFrom(response)).at(-1)).toMatchObject({
      type: "answer.failed",
      problem: {
        code: "rate-limited",
        retryAfterMs: 2_500,
      },
    });
  });

  it("maps the bounded server deadline to 504", async () => {
    const model = createScriptedModel([
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 40));
        return {
          kind: "not-covered",
          text: "A result after the route deadline must be ignored.",
          knowledgeIds: [],
          suggestionIds: [],
        };
      },
    ]);
    const response = await createAskJakubRoute(model, { timeoutMs: 10 })(
      new Request("http://portfolio.test/api/ask-jakub", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validAskRequest),
      }),
    );

    expect(response.status).toBe(504);
    expect((await eventsFrom(response)).at(-1)).toMatchObject({
      type: "answer.failed",
      problem: { code: "timeout", retryable: true },
    });
  });
});
