import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AskJakubProvider, useAskJakubSession } from "@/features/ask-jakub";
import {
  AskJakubTestProvider,
  AskTransportFailure,
  createScriptedAskTransport,
  providerDisabledAskTransport,
  type AskTransportScript,
} from "./testing";
import { LangContext } from "@/lib/lang-store";
import type { Lang } from "@/lib/lang";
import { PortfolioNavigator } from "@/features/portfolio-navigation";

function SessionProbe() {
  const session = useAskJakubSession();

  return (
    <output data-testid="session">
      {JSON.stringify({
        language: session.language,
        phase: session.phase,
        transcript: session.transcript,
        problem: session.problem,
        canSubmit: session.canSubmit,
        canCancel: session.canCancel,
        canRetry: session.canRetry,
      })}
    </output>
  );
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("Ask Jakub session Interface", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("creates a ready Polish session locally without contacting the route", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(
      <AskJakubProvider>
        <SessionProbe />
      </AskJakubProvider>,
    );

    expect(JSON.parse(screen.getByTestId("session").textContent ?? "")).toEqual(
      {
        language: "pl",
        phase: "ready",
        transcript: [],
        problem: null,
        canSubmit: true,
        canCancel: false,
        canRetry: false,
      },
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("keeps one usable committed public session in Strict Mode without fetching on mount", async () => {
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const sent = JSON.parse(String(init?.body)) as { requestId: string };
        const events = [
          {
            version: 1,
            requestId: sent.requestId,
            type: "request.accepted",
          },
          {
            version: 1,
            requestId: sent.requestId,
            type: "answer.completed",
            kind: "not-covered",
            text: "Portfolio nie zawiera tej informacji.",
            evidenceIds: [],
            suggestionIds: [],
          },
        ];
        return new Response(
          `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
          {
            status: 200,
            headers: { "content-type": "application/x-ndjson" },
          },
        );
      },
    );
    vi.stubGlobal("fetch", fetcher);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StrictMode>
        <AskJakubProvider>{children}</AskJakubProvider>
      </StrictMode>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    expect(fetcher).not.toHaveBeenCalled();
    act(() => {
      result.current.submit("Czego nie ma w portfolio?");
    });
    await waitFor(() => expect(result.current.phase).toBe("ready"));

    expect(fetcher).toHaveBeenCalledOnce();
    expect(result.current.transcript[1]).toMatchObject({
      text: "Portfolio nie zawiera tej informacji.",
      delivery: "complete",
      answerKind: "not-covered",
    });
  });

  it.each([
    {
      input: "  \n ",
      code: "empty-question",
      message: "Wpisz pytanie o portfolio Jakuba.",
    },
    {
      input: "🧠".repeat(601),
      code: "question-too-long",
      message: "Pytanie może mieć maksymalnie 600 znaków.",
    },
  ] as const)(
    "rejects $code locally without changing the transcript",
    ({ input, code, message }) => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AskJakubProvider>{children}</AskJakubProvider>
      );
      const { result } = renderHook(() => useAskJakubSession(), { wrapper });

      let submission: ReturnType<typeof result.current.submit> | undefined;
      act(() => {
        submission = result.current.submit(input);
      });

      expect(submission).toEqual({
        accepted: false,
        problem: { code, message, retryable: false },
      });
      expect(result.current.problem).toEqual({
        code,
        message,
        retryable: false,
      });
      expect(result.current.transcript).toEqual([]);
      expect(result.current.canSubmit).toBe(true);
    },
  );

  it("accepts one trimmed question synchronously and rejects a second active request", async () => {
    const transport = createScriptedAskTransport([
      async function* (_request, { signal }) {
        await new Promise<void>((resolve) => {
          signal.addEventListener("abort", () => resolve(), { once: true });
        });
      },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={transport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result, unmount } = renderHook(() => useAskJakubSession(), {
      wrapper,
    });

    let first: ReturnType<typeof result.current.submit> | undefined;
    let second: ReturnType<typeof result.current.submit> | undefined;
    act(() => {
      first = result.current.submit("  Jak łączysz React i design?  ");
      second = result.current.submit("Drugie pytanie");
    });

    expect(first).toEqual({ accepted: true });
    expect(second).toEqual({
      accepted: false,
      problem: {
        code: "busy",
        message: "Najpierw poczekaj na odpowiedź albo anuluj pytanie.",
        retryable: false,
      },
    });
    expect(result.current.phase).toBe("retrieving");
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.canCancel).toBe(true);
    expect(result.current.transcript).toMatchObject([
      {
        role: "portfolio-visitor",
        text: "Jak łączysz React i design?",
        delivery: "complete",
        evidence: [],
      },
      {
        role: "ask-jakub",
        text: "",
        delivery: "waiting",
        evidence: [],
      },
    ]);

    await waitFor(() => expect(transport.requests).toHaveLength(1));
    expect(transport.requests[0]).toMatchObject({
      version: 1,
      language: "pl",
      question: "Jak łączysz React i design?",
      history: [],
    });

    unmount();
  });

  it("commits a validated answered event with localized owned evidence", async () => {
    const transport = createScriptedAskTransport([
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        yield {
          version: 1,
          requestId: request.requestId,
          type: "phase.changed",
          phase: "retrieving",
        };
        yield {
          version: 1,
          requestId: request.requestId,
          type: "phase.changed",
          phase: "composing",
        };
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "answered",
          text: "Squizzu łączy rozwój produktu, React i zastosowania AI.",
          evidenceIds: ["evidence:experience:squizzu"],
          suggestionIds: ["suggestion:react-design"],
        };
      },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={transport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    act(() => {
      expect(result.current.submit("Co pokazuje Squizzu?")).toEqual({
        accepted: true,
      });
    });

    await waitFor(() => expect(result.current.phase).toBe("ready"));
    expect(result.current.problem).toBeNull();
    expect(result.current.canSubmit).toBe(true);
    expect(result.current.canCancel).toBe(false);
    expect(result.current.transcript[1]).toEqual({
      id: expect.any(String),
      role: "ask-jakub",
      text: "Squizzu łączy rozwój produktu, React i zastosowania AI.",
      delivery: "complete",
      answerKind: "answered",
      evidence: [
        {
          id: "evidence:experience:squizzu",
          label: "Squizzu — doświadczenie",
          location: { area: "experience", roleId: "squizzu" },
          href: "/#engineering",
        },
      ],
    });
    expect(result.current.suggestions.map(({ id }) => id)).toEqual([
      "suggestion:react-design",
    ]);
  });

  it("cancels idempotently, retries without a duplicate question, and ignores the late answer", async () => {
    const staleAnswer = deferred();
    const retriedAnswer = deferred();
    const transport = createScriptedAskTransport([
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        await staleAnswer.promise;
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "answered",
          text: "STALE ANSWER MUST BE IGNORED",
          evidenceIds: ["evidence:about"],
          suggestionIds: [],
        };
      },
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        await retriedAnswer.promise;
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "answered",
          text: "Świeża, zweryfikowana odpowiedź.",
          evidenceIds: ["evidence:about"],
          suggestionIds: [],
        };
      },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={transport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    act(() => {
      result.current.submit("Kim jest Jakub?");
    });
    await waitFor(() => expect(transport.requests).toHaveLength(1));
    const visitorTurnId = result.current.transcript[0]?.id;

    act(() => {
      result.current.cancel();
      result.current.cancel();
    });

    expect(result.current.phase).toBe("ready");
    expect(result.current.canCancel).toBe(false);
    expect(result.current.canRetry).toBe(true);
    expect(result.current.transcript).toHaveLength(2);
    expect(result.current.transcript[0]).toMatchObject({
      id: visitorTurnId,
      role: "portfolio-visitor",
      text: "Kim jest Jakub?",
      delivery: "complete",
    });
    expect(result.current.transcript[1]).toMatchObject({
      role: "ask-jakub",
      text: "",
      delivery: "cancelled",
      evidence: [],
    });

    act(() => {
      result.current.retry();
    });
    await waitFor(() => expect(transport.requests).toHaveLength(2));
    expect(result.current.transcript).toHaveLength(2);
    expect(result.current.transcript[0]?.id).toBe(visitorTurnId);
    expect(result.current.transcript[1]).toMatchObject({
      role: "ask-jakub",
      delivery: "waiting",
    });

    await act(async () => {
      staleAnswer.resolve();
      await staleAnswer.promise;
    });
    expect(JSON.stringify(result.current.transcript)).not.toContain(
      "STALE ANSWER",
    );

    await act(async () => {
      retriedAnswer.resolve();
      await retriedAnswer.promise;
    });
    await waitFor(() =>
      expect(result.current.transcript[1]?.text).toBe(
        "Świeża, zweryfikowana odpowiedź.",
      ),
    );
    expect(result.current.transcript).toHaveLength(2);
  });

  it.each([
    { stage: "before acceptance", phases: [] as const, expected: "retrieving" },
    {
      stage: "during retrieval",
      phases: ["retrieving"] as const,
      expected: "retrieving",
    },
    {
      stage: "during composition",
      phases: ["retrieving", "composing"] as const,
      expected: "composing",
    },
  ] as const)("cancels safely $stage", async ({ phases, expected }) => {
    const release = deferred();
    const transport = createScriptedAskTransport([
      async function* (request) {
        if (phases.length === 0) {
          await release.promise;
          yield {
            version: 1,
            requestId: request.requestId,
            type: "request.accepted",
          };
          return;
        }
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        for (const phase of phases) {
          yield {
            version: 1,
            requestId: request.requestId,
            type: "phase.changed",
            phase,
          };
        }
        await release.promise;
      },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={transport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    await act(async () => {
      result.current.submit("Pytanie do anulowania");
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.phase).toBe(expected);
    act(() => result.current.cancel());
    expect(result.current.phase).toBe("ready");
    expect(result.current.canRetry).toBe(true);
    expect(result.current.transcript[1]).toMatchObject({
      text: "",
      delivery: "cancelled",
      answerKind: null,
      evidence: [],
    });

    release.resolve();
  });

  it("clears active work into a fresh local session and rejects its late answer", async () => {
    const lateAnswer = deferred();
    const transport = createScriptedAskTransport([
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        await lateAnswer.promise;
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "answered",
          text: "CLEARED ANSWER MUST BE IGNORED",
          evidenceIds: ["evidence:about"],
          suggestionIds: [],
        };
      },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={transport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });
    const firstSessionId = result.current.sessionId;

    act(() => {
      result.current.submit("Opowiedz o doświadczeniu.");
    });
    await waitFor(() => expect(transport.requests).toHaveLength(1));
    act(() => {
      result.current.clear();
    });

    expect(result.current.sessionId).not.toBe(firstSessionId);
    expect(result.current.phase).toBe("ready");
    expect(result.current.transcript).toEqual([]);
    expect(result.current.problem).toBeNull();
    expect(result.current.canSubmit).toBe(true);
    expect(result.current.canCancel).toBe(false);
    expect(result.current.canRetry).toBe(false);
    expect(result.current.suggestions).toHaveLength(5);

    await act(async () => {
      lateAnswer.resolve();
      await lateAnswer.promise;
    });
    expect(result.current.transcript).toEqual([]);
  });

  it("cancels on language change and starts a fresh localized session", async () => {
    const lateAnswer = deferred();
    const transport = createScriptedAskTransport([
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        await lateAnswer.promise;
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "answered",
          text: "POLISH LATE ANSWER MUST BE IGNORED",
          evidenceIds: ["evidence:about"],
          suggestionIds: [],
        };
      },
    ]);
    let language: Lang = "pl";
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LangContext.Provider
        value={{ lang: language, setLang: () => undefined }}
      >
        <AskJakubTestProvider transport={transport}>
          {children}
        </AskJakubTestProvider>
      </LangContext.Provider>
    );
    const { result, rerender } = renderHook(() => useAskJakubSession(), {
      wrapper,
    });
    const polishSessionId = result.current.sessionId;

    act(() => {
      result.current.submit("Kim jest Jakub?");
    });
    await waitFor(() => expect(transport.requests).toHaveLength(1));
    language = "en";
    rerender();

    expect(result.current.language).toBe("en");
    expect(result.current.sessionId).not.toBe(polishSessionId);
    expect(result.current.transcript).toEqual([]);
    expect(result.current.problem).toBeNull();
    expect(result.current.suggestions[0]?.question.en).toBe(
      "Which project best demonstrates applied AI?",
    );

    await act(async () => {
      lateAnswer.resolve();
      await lateAnswer.promise;
    });
    expect(result.current.transcript).toEqual([]);
    expect(transport.requests).toHaveLength(1);
  });

  it("sends completed history oldest-first and accepts clarification and not-covered answers", async () => {
    const transport = createScriptedAskTransport([
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "answered",
          text: "Pierwsza odpowiedź.",
          evidenceIds: ["evidence:about"],
          suggestionIds: [],
        };
      },
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "clarification",
          text: "Czy pytasz o projekt czy rolę zawodową?",
          evidenceIds: [],
          suggestionIds: [],
        };
      },
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "not-covered",
          text: "Portfolio nie zawiera tej informacji.",
          evidenceIds: [],
          suggestionIds: [],
        };
      },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={transport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    act(() => {
      result.current.submit("Pierwsze pytanie");
    });
    await waitFor(() =>
      expect(result.current.transcript[1]?.text).toBe("Pierwsza odpowiedź."),
    );

    act(() => {
      result.current.submit("Drugie pytanie");
    });
    await waitFor(() =>
      expect(result.current.transcript[3]?.text).toBe(
        "Czy pytasz o projekt czy rolę zawodową?",
      ),
    );
    expect(transport.requests[1]?.history).toEqual([
      { role: "portfolio-visitor", text: "Pierwsze pytanie" },
      { role: "ask-jakub", text: "Pierwsza odpowiedź." },
    ]);
    expect(result.current.transcript[3]?.answerKind).toBe("clarification");

    act(() => {
      result.current.submit("Trzecie pytanie");
    });
    await waitFor(() =>
      expect(result.current.transcript[5]?.text).toBe(
        "Portfolio nie zawiera tej informacji.",
      ),
    );
    expect(transport.requests[2]?.history).toEqual([
      { role: "portfolio-visitor", text: "Pierwsze pytanie" },
      { role: "ask-jakub", text: "Pierwsza odpowiedź." },
      { role: "portfolio-visitor", text: "Drugie pytanie" },
      {
        role: "ask-jakub",
        text: "Czy pytasz o projekt czy rolę zawodową?",
      },
    ]);
    expect(result.current.transcript[5]?.answerKind).toBe("not-covered");
  });

  it.each([
    {
      code: "offline",
      message: "Brak połączenia. Sprawdź internet i spróbuj ponownie.",
      retryable: true,
      fromTransport: true,
    },
    {
      code: "rate-limited",
      message: "Limit pytań został osiągnięty. Spróbuj ponownie później.",
      retryable: true,
      retryAfterMs: 12_000,
      canRetryImmediately: false,
    },
    {
      code: "timeout",
      message: "Odpowiedź trwała zbyt długo. Spróbuj ponownie.",
      retryable: true,
    },
    {
      code: "budget-disabled",
      message:
        "Przewodnik jest tymczasowo offline. Portfolio nadal jest dostępne.",
      retryable: false,
    },
    {
      code: "unavailable",
      message:
        "Ask Jakub jest teraz niedostępny. Zamiast tego przejrzyj sugerowane pytania o portfolio.",
      retryable: true,
    },
    {
      code: "invalid-response",
      message: "Nie udało się zweryfikować odpowiedzi. Spróbuj ponownie.",
      retryable: true,
    },
  ] as const)(
    "normalizes $code into localized state without throwing through the Interface",
    async ({
      code,
      message,
      retryable,
      retryAfterMs,
      fromTransport = false,
      canRetryImmediately = retryable,
    }) => {
      const transport = createScriptedAskTransport([
        async function* (request) {
          if (fromTransport) throw new AskTransportFailure(code);
          yield {
            version: 1,
            requestId: request.requestId,
            type: "request.accepted",
          };
          yield {
            version: 1,
            requestId: request.requestId,
            type: "answer.failed",
            problem: {
              code,
              message: "INTERNAL OR UNTRUSTED MESSAGE MUST NOT CROSS THE SEAM",
              retryable: !retryable,
              ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
            },
          };
        },
      ]);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AskJakubTestProvider transport={transport}>
          {children}
        </AskJakubTestProvider>
      );
      const { result } = renderHook(() => useAskJakubSession(), { wrapper });

      act(() => {
        expect(() => result.current.submit("Pytanie testowe")).not.toThrow();
      });

      await waitFor(() => expect(result.current.phase).toBe("failed"));
      expect(result.current.problem).toEqual({
        code,
        message,
        retryable,
        ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
      });
      expect(result.current.transcript).toMatchObject([
        { role: "portfolio-visitor", delivery: "complete" },
        {
          role: "ask-jakub",
          text: "",
          delivery: "failed",
          evidence: [],
        },
      ]);
      expect(result.current.canCancel).toBe(false);
      expect(result.current.canRetry).toBe(canRetryImmediately);
      expect(JSON.stringify(result.current)).not.toContain(
        "INTERNAL OR UNTRUSTED",
      );
    },
  );

  it("excludes an orphaned cancelled question from a later fresh request history", async () => {
    const holdCancelledRequest = deferred();
    const transport = createScriptedAskTransport([
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        await holdCancelledRequest.promise;
      },
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "not-covered",
          text: "Nowa odpowiedź.",
          evidenceIds: [],
          suggestionIds: [],
        };
      },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={transport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    act(() => {
      result.current.submit("Anulowane pytanie");
    });
    await waitFor(() => expect(transport.requests).toHaveLength(1));
    act(() => {
      result.current.cancel();
      result.current.submit("Nowe pytanie");
    });
    await waitFor(() => expect(transport.requests).toHaveLength(2));

    expect(transport.requests[1]?.history).toEqual([]);
    holdCancelledRequest.resolve();
  });

  it.each([
    {
      name: "end-of-stream without a terminal event",
      script: async function* () {},
    },
    {
      name: "a phase before request acceptance",
      script: async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "phase.changed",
          phase: "composing",
        } as const;
      },
    },
    {
      name: "a mismatched request ID mixed into an otherwise valid stream",
      script: async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        } as const;
        yield {
          version: 1,
          requestId: `${request.requestId}-stale`,
          type: "phase.changed",
          phase: "retrieving",
        } as const;
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "not-covered",
          text: "This must not be accepted after the mismatched event.",
          evidenceIds: [],
          suggestionIds: [],
        } as const;
      },
    },
    {
      name: "an invalid lifecycle phase",
      script: async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        } as const;
        yield {
          version: 1,
          requestId: request.requestId,
          type: "phase.changed",
          phase: "leaking-provider-tokens",
        } as never;
      },
    },
    {
      name: "an answered result containing any unowned evidence",
      script: async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        } as const;
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "answered",
          text: "Unverifiable answer",
          evidenceIds: ["evidence:about", "evidence:not-owned"],
          suggestionIds: [],
        } as const;
      },
    },
    {
      name: "a result containing any unowned suggestion",
      script: async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        } as const;
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "answered",
          text: "Answer with an invalid suggestion",
          evidenceIds: ["evidence:about"],
          suggestionIds: ["suggestion:react-design", "suggestion:not-owned"],
        } as const;
      },
    },
  ] satisfies readonly { name: string; script: AskTransportScript }[])(
    "fails closed for $name",
    async ({ script }) => {
      const transport = createScriptedAskTransport([script]);
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AskJakubTestProvider transport={transport}>
          {children}
        </AskJakubTestProvider>
      );
      const { result } = renderHook(() => useAskJakubSession(), { wrapper });

      act(() => {
        result.current.submit("Pytanie z uszkodzonym protokołem");
      });

      await waitFor(() => expect(result.current.phase).toBe("failed"));
      expect(result.current.problem).toMatchObject({
        code: "invalid-response",
        retryable: true,
      });
      expect(result.current.canCancel).toBe(false);
      expect(result.current.canRetry).toBe(true);
    },
  );

  it("re-resolves Evidence IDs through the owned Portfolio Navigator and ignores caller destinations", () => {
    const launches: unknown[] = [];
    const navigator = PortfolioNavigator.desktop((payload) => {
      launches.push(payload);
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubProvider navigator={navigator}>{children}</AskJakubProvider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    act(() => {
      result.current.followEvidence({
        id: "evidence:contact",
        label: "MODEL-AUTHORED LABEL",
        location: { area: "about" },
        href: "/#malicious",
      });
      result.current.followEvidence({
        id: "evidence:not-owned",
        label: "Unknown",
        location: { area: "about" },
        href: "/#about",
      });
    });

    expect(launches).toEqual([
      {
        appId: "contact",
        selection: { area: "contact" },
      },
    ]);
  });

  it("offers a deterministic provider-disabled session without network access", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={providerDisabledAskTransport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    expect(result.current.suggestions).toHaveLength(5);
    act(() => {
      result.current.submit("Czy przewodnik działa?");
    });

    await waitFor(() => expect(result.current.phase).toBe("failed"));
    expect(result.current.problem).toMatchObject({
      code: "unavailable",
      retryable: true,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("validates ownership before deduplicating and bounding a terminal answer", async () => {
    const transport = createScriptedAskTransport([
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "answered",
          text: "Pierwsza zweryfikowana odpowiedź.",
          evidenceIds: [
            "evidence:about",
            "evidence:about",
            "evidence:contact",
            "evidence:experience:squizzu",
            "evidence:education:degree",
          ],
          suggestionIds: [
            "suggestion:applied-ai",
            "suggestion:applied-ai",
            "suggestion:squizzu-role",
            "suggestion:react-design",
            "suggestion:engineering-design",
          ],
        };
      },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={transport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    act(() => {
      result.current.submit("Pokaż dowody");
    });
    await waitFor(() => expect(result.current.phase).toBe("ready"));

    expect(result.current.transcript[1]).toMatchObject({
      text: "Pierwsza zweryfikowana odpowiedź.",
      delivery: "complete",
      answerKind: "answered",
    });
    expect(result.current.transcript[1]?.evidence.map(({ id }) => id)).toEqual([
      "evidence:about",
      "evidence:contact",
      "evidence:experience:squizzu",
    ]);
    expect(result.current.suggestions.map(({ id }) => id)).toEqual([
      "suggestion:applied-ai",
      "suggestion:squizzu-role",
      "suggestion:react-design",
    ]);
  });

  it("rejects a trailing event without committing any terminal output", async () => {
    let observedSignal: AbortSignal | undefined;
    let generatorClosedAfterAbort = false;
    const transport = createScriptedAskTransport([
      async function* (request, { signal }) {
        observedSignal = signal;
        try {
          yield {
            version: 1,
            requestId: request.requestId,
            type: "request.accepted",
          };
          yield {
            version: 1,
            requestId: request.requestId,
            type: "answer.completed",
            kind: "answered",
            text: "TERMINAL TEXT MUST REMAIN UNCOMMITTED",
            evidenceIds: ["evidence:about"],
            suggestionIds: [],
          };
          yield {
            version: 1,
            requestId: request.requestId,
            type: "phase.changed",
            phase: "composing",
          };
        } finally {
          generatorClosedAfterAbort = signal.aborted;
        }
      },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={transport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    act(() => {
      result.current.submit("Uszkodzony strumień");
    });
    await waitFor(() => expect(result.current.phase).toBe("failed"));

    expect(result.current.problem).toMatchObject({
      code: "invalid-response",
      retryable: true,
    });
    expect(result.current.transcript[1]).toMatchObject({
      text: "",
      delivery: "failed",
      answerKind: null,
      evidence: [],
    });
    expect(JSON.stringify(result.current.transcript)).not.toContain(
      "TERMINAL TEXT",
    );
    expect(observedSignal?.aborted).toBe(true);
    expect(generatorClosedAfterAbort).toBe(true);
  });

  it("allows at most one manual retry after an invalid response", async () => {
    const invalidResponse: AskTransportScript = async function* (request) {
      yield {
        version: 1,
        requestId: request.requestId,
        type: "request.accepted",
      };
      yield {
        version: 1,
        requestId: request.requestId,
        type: "answer.failed",
        problem: {
          code: "invalid-response",
          message: "The route normalized invalid output.",
          retryable: true,
        },
      };
    };
    const transport = createScriptedAskTransport([
      invalidResponse,
      invalidResponse,
      invalidResponse,
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={transport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    act(() => {
      result.current.submit("Pytanie z błędną odpowiedzią");
    });
    await waitFor(() => expect(result.current.phase).toBe("failed"));
    expect(result.current.canRetry).toBe(true);

    act(() => {
      result.current.retry();
    });
    await waitFor(() => expect(transport.requests).toHaveLength(2));
    await waitFor(() => expect(result.current.phase).toBe("failed"));
    expect(result.current.canRetry).toBe(false);
    expect(result.current.transcript).toHaveLength(2);

    act(() => {
      result.current.retry();
    });
    expect(transport.requests).toHaveLength(2);
  });

  it("enables rate-limit retry only after the trusted delay and never retries automatically", async () => {
    vi.useFakeTimers();
    const transport = createScriptedAskTransport([
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.failed",
          problem: {
            code: "rate-limited",
            message: "Wait before retrying.",
            retryable: true,
            retryAfterMs: 2_000,
          },
        };
      },
      async function* (request) {
        yield {
          version: 1,
          requestId: request.requestId,
          type: "request.accepted",
        };
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "not-covered",
          text: "Manual retry completed.",
          evidenceIds: [],
          suggestionIds: [],
        };
      },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AskJakubTestProvider transport={transport}>
        {children}
      </AskJakubTestProvider>
    );
    const { result, unmount } = renderHook(() => useAskJakubSession(), {
      wrapper,
    });

    await act(async () => {
      result.current.submit("Pytanie limitowane");
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.phase).toBe("failed");
    expect(result.current.canRetry).toBe(false);
    expect(result.current.canSubmit).toBe(false);
    expect(vi.getTimerCount()).toBe(1);

    let blockedFreshSubmit:
      ReturnType<typeof result.current.submit> | undefined;
    act(() => {
      result.current.retry();
      blockedFreshSubmit = result.current.submit("Próba obejścia limitu");
      vi.advanceTimersByTime(1_999);
    });
    expect(blockedFreshSubmit).toMatchObject({
      accepted: false,
      problem: { code: "rate-limited" },
    });
    expect(transport.requests).toHaveLength(1);
    expect(result.current.canRetry).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.canRetry).toBe(true);
    expect(result.current.canSubmit).toBe(true);
    expect(transport.requests).toHaveLength(1);

    await act(async () => {
      result.current.retry();
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(transport.requests).toHaveLength(2);
    expect(result.current.transcript).toHaveLength(2);
    expect(result.current.transcript[1]?.text).toBe("Manual retry completed.");

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });

  it("cancels pending retry timers on clear, language reset, and provider disposal", async () => {
    vi.useFakeTimers();
    const rateLimited: AskTransportScript = async function* (request) {
      yield {
        version: 1,
        requestId: request.requestId,
        type: "request.accepted",
      };
      yield {
        version: 1,
        requestId: request.requestId,
        type: "answer.failed",
        problem: {
          code: "rate-limited",
          message: "Wait.",
          retryable: true,
          retryAfterMs: 5_000,
        },
      };
    };
    const transport = createScriptedAskTransport([
      rateLimited,
      rateLimited,
      rateLimited,
    ]);
    let language: Lang = "pl";
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LangContext.Provider
        value={{ lang: language, setLang: () => undefined }}
      >
        <AskJakubTestProvider transport={transport}>
          {children}
        </AskJakubTestProvider>
      </LangContext.Provider>
    );
    const { result, rerender, unmount } = renderHook(
      () => useAskJakubSession(),
      { wrapper },
    );

    await act(async () => {
      result.current.submit("Pierwsze pytanie");
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(vi.getTimerCount()).toBe(1);
    act(() => result.current.clear());
    expect(vi.getTimerCount()).toBe(0);

    await act(async () => {
      result.current.submit("Drugie pytanie");
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(vi.getTimerCount()).toBe(1);
    language = "en";
    rerender();
    expect(result.current.language).toBe("en");
    expect(result.current.transcript).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);

    await act(async () => {
      result.current.submit("Third question");
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("localizes operational failures for an English session", async () => {
    const transport = createScriptedAskTransport([
      async function* () {
        throw new AskTransportFailure("offline");
      },
    ]);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <LangContext.Provider value={{ lang: "en", setLang: () => undefined }}>
        <AskJakubTestProvider transport={transport}>
          {children}
        </AskJakubTestProvider>
      </LangContext.Provider>
    );
    const { result } = renderHook(() => useAskJakubSession(), { wrapper });

    act(() => {
      result.current.submit("What should I review?");
    });
    await waitFor(() => expect(result.current.phase).toBe("failed"));
    expect(result.current.problem).toEqual({
      code: "offline",
      message: "You appear to be offline. Check your connection and try again.",
      retryable: true,
    });
  });
});
