import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MotionConfig } from "framer-motion";

import Desktop from "@/components/desktop/Desktop";
import {
  DesktopProvider,
  type DesktopApi,
} from "@/components/desktop/DesktopContext";
import { AskJakubProvider } from "@/features/ask-jakub";
import type { AskProblemCode } from "@/features/ask-jakub";
import {
  AskJakubTestProvider,
  createScriptedAskTransport,
  providerDisabledAskTransport,
  type AskJakubTestProviderProps,
} from "@/features/ask-jakub/client/testing";
import {
  PortfolioNavigator,
  resolvePortfolioLocation,
} from "@/features/portfolio-navigation";
import { LangContext } from "@/lib/lang-store";
import type { Lang } from "@/lib/lang-store";
import { useWindowStore } from "@/lib/window-store";
import AskJakubApp from "./AskJakubApp";

const desktopApi: DesktopApi = {
  openApp: vi.fn(),
  openLocation: (location) => {
    const target = resolvePortfolioLocation(location);
    return target
      ? { opened: true, target }
      : { opened: false, reason: "invalid-location" };
  },
  selectionFor: () => undefined,
  switchToSimple: vi.fn(),
};

function renderProductionApp() {
  return render(
    <LangContext.Provider value={{ lang: "en", setLang: vi.fn() }}>
      <DesktopProvider value={desktopApi}>
        <AskJakubProvider navigator={PortfolioNavigator.desktop(vi.fn())}>
          <AskJakubApp />
        </AskJakubProvider>
      </DesktopProvider>
    </LangContext.Provider>,
  );
}

function renderScriptedApp(
  transport: AskJakubTestProviderProps["transport"],
  launch = vi.fn(),
  forceReducedMotion = false,
  language: Lang = "en",
  api: DesktopApi = desktopApi,
) {
  return render(
    <LangContext.Provider value={{ lang: language, setLang: vi.fn() }}>
      <DesktopProvider value={api}>
        <AskJakubTestProvider
          transport={transport}
          navigator={PortfolioNavigator.desktop(launch)}
        >
          <MotionConfig reducedMotion={forceReducedMotion ? "always" : "user"}>
            <AskJakubApp />
          </MotionConfig>
        </AskJakubTestProvider>
      </DesktopProvider>
    </LangContext.Provider>,
  );
}

function failedTransport(
  code: Extract<
    AskProblemCode,
    | "offline"
    | "unavailable"
    | "timeout"
    | "invalid-response"
    | "rate-limited"
    | "budget-disabled"
  >,
  retryAfterMs?: number,
) {
  return createScriptedAskTransport([
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
          code,
          message: "Adapter detail must not reach the view.",
          retryable: code !== "budget-disabled",
          ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
        },
      };
    },
  ]);
}

function failedScript(
  code: "offline" | "timeout",
): Parameters<typeof createScriptedAskTransport>[0][number] {
  return async function* (request) {
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
        message: "Hidden adapter detail",
        retryable: true,
      },
    };
  };
}

function completedTransport(
  kind: "answered" | "clarification" | "not-covered",
  text: string,
) {
  return createScriptedAskTransport([
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
        kind,
        text,
        evidenceIds: kind === "answered" ? ["evidence:experience:squizzu"] : [],
        suggestionIds: [],
      };
    },
  ]);
}

describe("Ask Jakub Desktop App", () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: [], focusedId: null, nextZ: 1 });
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens as a local portfolio guide without making a network request", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const view = renderProductionApp();

    expect(
      view.getByRole("heading", { name: "Ask Jakub" }),
    ).toBeInTheDocument();
    expect(view.getByText("Portfolio guide · not Jakub")).toBeInTheDocument();
    expect(
      view.getByText(/Answers use this portfolio and link back to the source/i),
    ).toBeInTheDocument();
    expect(
      view.getAllByRole("button", {
        name: /Which project|What is Jakub|Show me/i,
      }),
    ).toHaveLength(3);
    expect(
      view.getByRole("textbox", { name: "Question about Jakub's work" }),
    ).toHaveAccessibleDescription(
      "Ask about documented work, projects, skills, or approach.",
    );
    expect(view.getByRole("button", { name: "Ask" })).toBeDisabled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("is composed into the Desktop Mode lifetime above its window", () => {
    const view = render(
      <LangContext.Provider value={{ lang: "en", setLang: vi.fn() }}>
        <Desktop />
      </LangContext.Provider>,
    );

    fireEvent.click(view.getAllByRole("button", { name: /Ask Jakub/ })[0]);

    expect(view.getByRole("dialog", { name: "Ask Jakub" })).toBeInTheDocument();
    expect(
      view.getByRole("textbox", { name: "Question about Jakub's work" }),
    ).toBeInTheDocument();
  });

  it("submits with Enter, announces retrieval once, and lets the visitor cancel", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport = createScriptedAskTransport([
      async function* (request, { signal }) {
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
        await gate;
        if (signal.aborted) return;
      },
    ]);
    const view = renderScriptedApp(transport);
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });

    fireEvent.change(composer, {
      target: { value: "Which work best shows product thinking?" },
    });
    fireEvent.keyDown(composer, { key: "Enter", shiftKey: false });

    await waitFor(() =>
      expect(view.getByRole("status")).toHaveTextContent(
        "Searching the portfolio",
      ),
    );
    expect(view.getByRole("log", { name: "Conversation" })).toHaveTextContent(
      "Which work best shows product thinking?",
    );
    expect(composer).toHaveValue("");

    fireEvent.click(view.getByRole("button", { name: "Cancel answer" }));

    expect(view.getByText("Request cancelled.")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Retry" })).toBeEnabled();
    release?.();
  });

  it("shows composing before a grounded answer, then exposes owned evidence and copy", async () => {
    let compose: (() => void) | undefined;
    let complete: (() => void) | undefined;
    const composeGate = new Promise<void>((resolve) => {
      compose = resolve;
    });
    const completeGate = new Promise<void>((resolve) => {
      complete = resolve;
    });
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
        await composeGate;
        yield {
          version: 1,
          requestId: request.requestId,
          type: "phase.changed",
          phase: "composing",
        };
        await completeGate;
        yield {
          version: 1,
          requestId: request.requestId,
          type: "answer.completed",
          kind: "answered",
          text: "Squizzu combines product design with full-stack delivery.",
          evidenceIds: ["evidence:experience:squizzu"],
          suggestionIds: ["suggestion:squizzu-role"],
        };
      },
    ]);
    const launch = vi.fn();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      ...window.navigator,
      clipboard: { writeText },
    });
    const view = renderScriptedApp(transport, launch);
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: "Tell me about Squizzu" } });
    fireEvent.keyDown(composer, { key: "Enter" });

    await act(async () => compose?.());
    await waitFor(() =>
      expect(view.getByRole("status")).toHaveTextContent(
        "Composing a grounded answer",
      ),
    );
    await act(async () => complete?.());

    expect(await view.findByText("Grounded answer")).toBeInTheDocument();
    expect(
      view.getByText(
        "Squizzu combines product design with full-stack delivery.",
        { selector: "[data-ask-answer-screen-reader]" },
      ),
    ).toBeInTheDocument();
    const evidence = view.getByRole("link", {
      name: "Squizzu — experience",
    });
    expect(evidence).toHaveAttribute("href", "/#engineering");
    fireEvent.click(evidence);
    expect(launch).toHaveBeenCalledWith({
      appId: "experience",
      selection: { area: "experience", roleId: "squizzu" },
    });

    fireEvent.click(view.getByRole("button", { name: "Copy answer" }));
    expect(writeText).toHaveBeenCalledWith(
      "Squizzu combines product design with full-stack delivery.",
    );
    expect(
      view.getByRole("button", { name: "What is Jakub's role at Squizzu?" }),
    ).toBeInTheDocument();
  });

  it.each([
    [
      "offline",
      "You're offline",
      "You appear to be offline. Check your connection and try again.",
      true,
    ],
    [
      "unavailable",
      "Guide unavailable",
      "Ask Jakub is currently unavailable.",
      true,
    ],
    [
      "timeout",
      "Answer timed out",
      "The answer took too long. Please try again.",
      true,
    ],
    [
      "invalid-response",
      "Answer could not be verified",
      "The answer could not be verified. Please try again.",
      true,
    ],
    [
      "budget-disabled",
      "Guide paused",
      "The guide is temporarily offline.",
      false,
    ],
  ] as const)(
    "renders the %s state as localized recovery guidance",
    async (code, heading, message, retryable) => {
      const view = renderScriptedApp(failedTransport(code));
      const composer = view.getByRole("textbox", {
        name: "Question about Jakub's work",
      });
      fireEvent.change(composer, { target: { value: "Can you help?" } });
      fireEvent.keyDown(composer, { key: "Enter" });

      const alert = await view.findByRole("alert");
      expect(alert).toHaveTextContent(heading);
      expect(alert).toHaveTextContent(message);
      expect(
        view.queryByText("Adapter detail must not reach the view."),
      ).not.toBeInTheDocument();
      if (retryable) {
        expect(view.getByRole("button", { name: "Retry" })).toBeEnabled();
      } else {
        expect(
          view.queryByRole("button", { name: "Retry" }),
        ).not.toBeInTheDocument();
      }
    },
  );

  it("renders the trusted rate-limit cooldown without enabling an early retry", async () => {
    const transport = failedTransport("rate-limited", 2_000);
    const view = renderScriptedApp(transport);
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: "Can you help?" } });
    fireEvent.keyDown(composer, { key: "Enter" });

    const alert = await view.findByRole("alert");
    expect(alert).toHaveTextContent("Question limit reached");
    expect(alert).toHaveTextContent("Try again in 2 seconds.");
    expect(
      view.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
    expect(view.getByRole("button", { name: "Ask" })).toBeDisabled();

    fireEvent.change(composer, { target: { value: "Can I ask another?" } });
    fireEvent.keyDown(composer, { key: "Enter" });

    expect(
      view.getByText(
        "The question limit has been reached. Please try again later.",
        { selector: "[data-ask-composer-guidance]" },
      ),
    ).toBeInTheDocument();
    expect(alert).toHaveTextContent("Try again in 2 seconds.");
    expect(transport.requests).toHaveLength(1);
  });

  it("stops the trusted cooldown display when manual retry becomes available", async () => {
    vi.useFakeTimers();
    try {
      const view = renderScriptedApp(failedTransport("rate-limited", 1_000));
      const composer = view.getByRole("textbox", {
        name: "Question about Jakub's work",
      });
      fireEvent.change(composer, { target: { value: "Can you help?" } });
      fireEvent.keyDown(composer, { key: "Enter" });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(view.getByRole("alert")).toHaveTextContent(
        "Try again in 1 second",
      );
      expect(
        view.queryByRole("button", { name: "Retry" }),
      ).not.toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });

      expect(view.getByRole("button", { name: "Retry" })).toBeEnabled();
      expect(view.queryByText(/Try again in/)).not.toBeInTheDocument();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("counts and bounds the composer by Unicode code points", () => {
    const transport = createScriptedAskTransport([]);
    const view = renderScriptedApp(transport);
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });

    fireEvent.change(composer, { target: { value: "🙂".repeat(601) } });

    expect(composer).toHaveValue("🙂".repeat(600));
    expect(view.getByLabelText("Character count")).toHaveTextContent(
      "600 / 600",
    );
    expect(view.getByRole("button", { name: "Ask" })).toBeEnabled();
  });

  it("keeps Shift+Enter for a newline and uses plain Enter to submit", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport = createScriptedAskTransport([
      async function* () {
        await gate;
      },
    ]);
    const view = renderScriptedApp(transport);
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: "Line one" } });

    fireEvent.keyDown(composer, { key: "Enter", shiftKey: true });
    expect(transport.requests).toHaveLength(0);

    fireEvent.change(composer, { target: { value: "Line one\nLine two" } });
    fireEvent.keyDown(composer, { key: "Enter", shiftKey: false });
    await waitFor(() => expect(transport.requests).toHaveLength(1));
    expect(transport.requests[0]?.question).toBe("Line one\nLine two");
    release?.();
  });

  it.each([
    [
      "en",
      "Question about Jakub's work",
      "Enter a question about Jakub's portfolio.",
      "enter",
    ],
    [
      "pl",
      "Pytanie o pracę Jakuba",
      "Wpisz pytanie o portfolio Jakuba.",
      "submit",
    ],
  ] as const)(
    "shows localized inline guidance for empty %s composer submission",
    (language, label, message, action) => {
      const transport = createScriptedAskTransport([]);
      const view = renderScriptedApp(transport, vi.fn(), false, language);
      const composer = view.getByRole("textbox", { name: label });
      fireEvent.change(composer, { target: { value: "  \n " } });

      if (action === "enter") {
        fireEvent.keyDown(composer, { key: "Enter" });
      } else {
        fireEvent.submit(composer.closest("form")!);
      }

      expect(
        view.getByText(message, {
          selector: "[data-ask-composer-guidance]",
        }),
      ).toBeInTheDocument();
      expect(composer).toHaveAttribute("aria-invalid", "true");
      expect(transport.requests).toHaveLength(0);
      expect(view.queryByRole("log")).not.toBeInTheDocument();
    },
  );

  it("keeps the active request intact while explaining a busy submit inline", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const transport = createScriptedAskTransport([
      async function* (request, { signal }) {
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
        await gate;
        if (signal.aborted) return;
      },
    ]);
    const view = renderScriptedApp(transport);
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: "First question" } });
    fireEvent.keyDown(composer, { key: "Enter" });
    await view.findByRole("status");
    fireEvent.change(composer, { target: { value: "Second question" } });
    expect(view.getByRole("button", { name: "Ask" })).toBeDisabled();

    fireEvent.submit(composer.closest("form")!);

    expect(
      view.getByText("Wait for the current answer or cancel it first.", {
        selector: "[data-ask-composer-guidance]",
      }),
    ).toBeInTheDocument();
    expect(transport.requests).toHaveLength(1);
    expect(view.getByRole("button", { name: "Cancel answer" })).toBeEnabled();
    fireEvent.click(view.getByRole("button", { name: "Cancel answer" }));
    release?.();
  });

  it("keeps historical failures non-live when a newer turn fails", async () => {
    const transport = createScriptedAskTransport([
      failedScript("offline"),
      failedScript("timeout"),
    ]);
    const view = renderScriptedApp(transport);
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });

    fireEvent.change(composer, { target: { value: "First question" } });
    fireEvent.keyDown(composer, { key: "Enter" });
    expect(await view.findByRole("alert")).toHaveTextContent("You're offline");

    fireEvent.change(composer, { target: { value: "Second question" } });
    fireEvent.keyDown(composer, { key: "Enter" });
    await waitFor(() =>
      expect(view.getByRole("alert")).toHaveTextContent("Answer timed out"),
    );

    expect(view.getAllByRole("alert")).toHaveLength(1);
    expect(view.getByText("Previous answer unavailable.")).toBeInTheDocument();
  });

  it.each([
    ["answered", "Grounded answer"],
    ["clarification", "Clarification"],
    ["not-covered", "Not covered"],
  ] as const)("renders the %s answer kind explicitly", async (kind, label) => {
    const text = `Validated ${kind} response.`;
    const view = renderScriptedApp(
      completedTransport(kind, text),
      vi.fn(),
      true,
    );
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });

    fireEvent.change(composer, { target: { value: "What should I know?" } });
    fireEvent.keyDown(composer, { key: "Enter" });

    expect(await view.findByText(label)).toBeInTheDocument();
    expect(view.getByTestId("ask-answer-visual")).toHaveTextContent(text);
    if (kind !== "answered") {
      expect(view.queryByText("Portfolio evidence")).not.toBeInTheDocument();
    }
  });

  it("submits a curated suggestion and clears a finished conversation", async () => {
    const transport = completedTransport(
      "clarification",
      "Which part of the work would you like to explore?",
    );
    const view = renderScriptedApp(transport, vi.fn(), true);
    const suggestion = view.getByRole("button", {
      name: /Which project best demonstrates applied AI\?/,
    });

    fireEvent.click(suggestion);

    await waitFor(() => expect(transport.requests).toHaveLength(1));
    expect(transport.requests[0]?.question).toBe(
      "Which project best demonstrates applied AI?",
    );
    expect(await view.findByText("Clarification")).toBeInTheDocument();

    fireEvent.click(view.getByRole("button", { name: "Clear conversation" }));

    expect(
      view.queryByRole("log", { name: "Conversation" }),
    ).not.toBeInTheDocument();
    expect(view.getByText("Start with a question")).toBeInTheDocument();
  });

  it("retries the failed question without making the visitor retype it", async () => {
    const transport = createScriptedAskTransport([
      failedScript("offline"),
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
          text: "The retry completed with a grounded answer.",
          evidenceIds: ["evidence:experience:squizzu"],
          suggestionIds: [],
        };
      },
    ]);
    const view = renderScriptedApp(transport, vi.fn(), true);
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: "Retry this question" } });
    fireEvent.keyDown(composer, { key: "Enter" });
    await view.findByRole("alert");

    fireEvent.click(view.getByRole("button", { name: "Retry" }));

    expect(await view.findByText("Grounded answer")).toBeInTheDocument();
    expect(transport.requests.map((request) => request.question)).toEqual([
      "Retry this question",
      "Retry this question",
    ]);
  });

  it("keeps a real localized portfolio route available when the provider is disabled", async () => {
    const openLocation = vi.fn<DesktopApi["openLocation"]>((location) => {
      const target = resolvePortfolioLocation(location);
      return target
        ? { opened: true, target }
        : { opened: false, reason: "invalid-location" };
    });
    const view = renderScriptedApp(
      providerDisabledAskTransport,
      vi.fn(),
      false,
      "en",
      { ...desktopApi, openLocation },
    );
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: "Tell me about the work" } });
    fireEvent.keyDown(composer, { key: "Enter" });

    expect(await view.findByRole("alert")).toHaveTextContent(
      "Guide unavailable",
    );
    const experience = view.getByRole("link", { name: "View experience" });
    expect(experience).toHaveAttribute("href", "/#engineering");
    expect(view.getByRole("link", { name: "Contact Jakub" })).toHaveAttribute(
      "href",
      "/#contact",
    );

    fireEvent.click(experience);
    expect(openLocation).toHaveBeenCalledWith({ area: "experience" });
  });

  it("keeps the transcript as the sole scroll owner and pins the safe-area composer", () => {
    const view = renderScriptedApp(createScriptedAskTransport([]));
    const root = view
      .getByRole("heading", { name: "Ask Jakub" })
      .closest("section");
    const transcript = view.container.querySelector("[data-ask-transcript]");
    const composer = view.container.querySelector("[data-ask-composer]");

    expect(root).toHaveClass("flex", "h-full", "min-h-0", "overflow-hidden");
    expect(transcript).toHaveAttribute("data-scroll-owner", "transcript");
    expect(transcript).toHaveClass("min-h-0", "flex-1", "overflow-y-auto");
    expect(composer).toHaveClass("shrink-0");
    expect(composer?.className).toContain("safe-area-inset-bottom");
  });

  it("discloses the external model data flow before the first question", () => {
    const english = renderScriptedApp(createScriptedAskTransport([]));

    expect(
      english.getByText(
        "When AI answers are enabled, your question, completed chat history, and selected public portfolio facts are sent to Groq. This site does not save the conversation.",
      ),
    ).toBeInTheDocument();

    cleanup();
    const polish = renderScriptedApp(
      createScriptedAskTransport([]),
      vi.fn(),
      false,
      "pl",
    );
    expect(
      polish.getByText(
        "Gdy odpowiedzi AI są włączone, Twoje pytanie, ukończona historia rozmowy i wybrane publiczne fakty z portfolio są wysyłane do Groq. Ta strona nie zapisuje rozmowy.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the complete long-form Polish guidance and controls", () => {
    const view = renderScriptedApp(
      createScriptedAskTransport([]),
      vi.fn(),
      false,
      "pl",
    );

    expect(
      view.getByRole("heading", { name: "Zapytaj o Jakuba" }),
    ).toBeInTheDocument();
    expect(
      view.getByText("Przewodnik portfolio · nie Jakub"),
    ).toBeInTheDocument();
    expect(
      view.getByText(/jak łączę inżynierię z designem/i),
    ).toBeInTheDocument();
    expect(
      view.getByRole("textbox", { name: "Pytanie o pracę Jakuba" }),
    ).toHaveAccessibleDescription(
      "Zapytaj o udokumentowaną pracę, projekty, umiejętności lub podejście.",
    );
    expect(view.getByRole("button", { name: "Zapytaj" })).toBeDisabled();
  });

  it("reveals a validated answer visually while exposing one stable screen-reader copy", async () => {
    const answer =
      "This complete validated answer is revealed with restraint after the lifecycle finishes.";
    const view = renderScriptedApp(completedTransport("answered", answer));
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: "Tell me about Squizzu" } });
    fireEvent.keyDown(composer, { key: "Enter" });

    await view.findByText("Grounded answer");
    const visual = view.getByTestId("ask-answer-visual");
    const reservedLayout = view.getByTestId("ask-answer-layout");
    expect(visual).toHaveAttribute("aria-hidden", "true");
    expect(visual).toHaveClass("absolute");
    expect(visual.textContent).not.toBe(answer);
    expect(reservedLayout).toHaveAttribute("aria-hidden", "true");
    expect(reservedLayout).toHaveClass("invisible");
    expect(reservedLayout).toHaveTextContent(answer);
    expect(
      view.getByText(answer, { selector: "[data-ask-answer-screen-reader]" }),
    ).toBeInTheDocument();
    expect(view.getByRole("log", { name: "Conversation" })).toHaveAttribute(
      "aria-live",
      "off",
    );

    await waitFor(() => expect(visual).toHaveTextContent(answer), {
      timeout: 2_000,
    });
  });

  it("shows the full validated answer immediately under reduced motion", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    const answer = "Reduced motion receives the complete validated answer.";
    const view = renderScriptedApp(
      completedTransport("answered", answer),
      vi.fn(),
      true,
    );
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: "Tell me about Squizzu" } });
    fireEvent.keyDown(composer, { key: "Enter" });

    await view.findByText("Grounded answer");
    expect(view.getByTestId("ask-answer-visual")).toHaveTextContent(answer);
  });

  it("finishes an in-progress reveal immediately when reduced motion turns on", async () => {
    const answer =
      "A sufficiently long validated answer that remains visibly in progress before reduced motion changes.";
    const transport = completedTransport("answered", answer);
    const navigator = PortfolioNavigator.desktop(vi.fn());
    const setLang = vi.fn();
    const tree = (reducedMotion: "never" | "always") => (
      <LangContext.Provider value={{ lang: "en", setLang }}>
        <DesktopProvider value={desktopApi}>
          <AskJakubTestProvider transport={transport} navigator={navigator}>
            <MotionConfig reducedMotion={reducedMotion}>
              <AskJakubApp />
            </MotionConfig>
          </AskJakubTestProvider>
        </DesktopProvider>
      </LangContext.Provider>
    );
    const view = render(tree("never"));
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: "Tell me about the work" } });
    fireEvent.keyDown(composer, { key: "Enter" });
    await view.findByText("Grounded answer");
    const visual = view.getByTestId("ask-answer-visual");
    expect(visual.textContent).not.toBe(answer);

    view.rerender(tree("always"));

    expect(visual).toHaveTextContent(answer);
  });

  it("announces completion once without making the transcript or progressive text live", async () => {
    const answer = "One stable completed answer for assistive technology.";
    const view = renderScriptedApp(
      completedTransport("answered", answer),
      vi.fn(),
      true,
    );
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: "Tell me about the work" } });
    fireEvent.keyDown(composer, { key: "Enter" });

    await view.findByText("Grounded answer");

    expect(view.getAllByRole("status")).toHaveLength(1);
    expect(view.getByRole("status")).toHaveTextContent("Answer ready");
    expect(view.getByRole("log", { name: "Conversation" })).toHaveAttribute(
      "aria-live",
      "off",
    );
    expect(view.getByTestId("ask-answer-visual")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("keeps copy available without an unhandled rejection when clipboard access fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("Permission denied"));
    vi.stubGlobal("navigator", {
      ...window.navigator,
      clipboard: { writeText },
    });
    const view = renderScriptedApp(
      completedTransport("answered", "A copyable grounded answer."),
      vi.fn(),
      true,
    );
    const composer = view.getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: "Tell me about the work" } });
    fireEvent.keyDown(composer, { key: "Enter" });
    await view.findByText("Grounded answer");

    fireEvent.click(view.getByRole("button", { name: "Copy answer" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledOnce());
    expect(
      view.getByRole("button", { name: "Copy answer" }),
    ).toBeInTheDocument();
    expect(view.queryByText("Copied")).not.toBeInTheDocument();
  });

  it.each([
    [true, 660, 1],
    [false, 120, 0],
  ] as const)(
    "auto-scrolls a completed answer only when near the transcript end: %s",
    async (_nearEnd, initialScrollTop, expectedCalls) => {
      let complete: (() => void) | undefined;
      const gate = new Promise<void>((resolve) => {
        complete = resolve;
      });
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
          await gate;
          yield {
            version: 1,
            requestId: request.requestId,
            type: "answer.completed",
            kind: "answered",
            text: "A complete answer with owned evidence.",
            evidenceIds: ["evidence:experience:squizzu"],
            suggestionIds: [],
          };
        },
      ]);
      const view = renderScriptedApp(transport);
      const composer = view.getByRole("textbox", {
        name: "Question about Jakub's work",
      });
      fireEvent.change(composer, { target: { value: "Tell me more" } });
      fireEvent.keyDown(composer, { key: "Enter" });
      await view.findByRole("status");

      const transcript = view.container.querySelector<HTMLElement>(
        "[data-ask-transcript]",
      )!;
      let scrollTop: number = initialScrollTop;
      Object.defineProperties(transcript, {
        scrollHeight: { configurable: true, get: () => 1_000 },
        clientHeight: { configurable: true, get: () => 300 },
        scrollTop: {
          configurable: true,
          get: () => scrollTop,
          set: (value: number) => {
            scrollTop = value;
          },
        },
      });
      const scrollTo = vi.fn(({ top }: { top: number }) => {
        scrollTop = top;
      });
      transcript.scrollTo = scrollTo as unknown as typeof transcript.scrollTo;
      fireEvent.scroll(transcript);

      await act(async () => complete?.());
      await view.findByText("Grounded answer");
      await waitFor(() =>
        expect(scrollTo).toHaveBeenCalledTimes(expectedCalls),
      );
    },
  );
});
