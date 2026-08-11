import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Desktop from "@/components/desktop/Desktop";
import {
  ASK_JAKUB_WIDGET_RIGHT,
  DESKTOP_LAYOUT,
} from "@/components/desktop/desktop-layout";
import { LangContext } from "@/lib/lang-store";
import { useWindowStore } from "@/lib/window-store";

const QUESTION = "What did Jakub build at Squizzu?";
const ANSWER =
  "At Squizzu, Jakub combines product design with full-stack delivery.";
const ORIGINAL_INNER_WIDTH = window.innerWidth;

function successfulAskResponse(init?: RequestInit): Response {
  if (typeof init?.body !== "string") {
    throw new Error("Expected the Ask Jakub request to have a JSON body.");
  }

  const request = JSON.parse(init.body) as { requestId: string };
  const events = [
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
      text: ANSWER,
      evidenceIds: ["evidence:experience:squizzu"],
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
}

function unavailableAskResponse(init?: RequestInit): Response {
  if (typeof init?.body !== "string") {
    throw new Error("Expected the Ask Jakub request to have a JSON body.");
  }

  const request = JSON.parse(init.body) as { requestId: string };
  const events = [
    {
      version: 1,
      requestId: request.requestId,
      type: "request.accepted",
    },
    {
      version: 1,
      requestId: request.requestId,
      type: "answer.failed",
      problem: {
        code: "unavailable",
        message: "Provider unavailable.",
        retryable: true,
      },
    },
  ];

  return new Response(
    `${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
    {
      status: 503,
      headers: { "content-type": "application/x-ndjson" },
    },
  );
}

function installSuccessfulAskRoute() {
  const fetchSpy = vi.fn(
    async (_input: RequestInfo | URL, init?: RequestInit) =>
      successfulAskResponse(init),
  );
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

function installResponsiveMatchMedia(initialMobile: boolean) {
  let mobile = initialMobile;
  const queries = new Map<
    string,
    {
      media: MediaQueryList;
      listeners: Set<(event: MediaQueryListEvent) => void>;
    }
  >();

  const matchMedia = vi.fn((query: string): MediaQueryList => {
    const existing = queries.get(query);
    if (existing) return existing.media;

    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const media = {
      get matches() {
        return query === "(max-width: 767px)" ? mobile : false;
      },
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(
        (type: string, listener: (event: MediaQueryListEvent) => void) => {
          if (type === "change") listeners.add(listener);
        },
      ),
      removeEventListener: vi.fn(
        (type: string, listener: (event: MediaQueryListEvent) => void) => {
          if (type === "change") listeners.delete(listener);
        },
      ),
      dispatchEvent: vi.fn(() => true),
    } as MediaQueryList;
    queries.set(query, { media, listeners });
    return media;
  });
  vi.stubGlobal("matchMedia", matchMedia);

  return (nextMobile: boolean) => {
    mobile = nextMobile;
    const record = queries.get("(max-width: 767px)");
    if (!record) return;
    const event = {
      matches: mobile,
      media: record.media.media,
    } as MediaQueryListEvent;
    for (const listener of record.listeners) listener(event);
  };
}

function renderInEnglish(node: React.ReactNode) {
  return render(
    <LangContext.Provider value={{ lang: "en", setLang: vi.fn() }}>
      {node}
    </LangContext.Provider>,
  );
}

async function askQuestion(dialog: HTMLElement) {
  const composer = within(dialog).getByRole("textbox", {
    name: "Question about Jakub's work",
  });
  fireEvent.change(composer, { target: { value: QUESTION } });
  fireEvent.keyDown(composer, { key: "Enter" });

  await waitFor(() =>
    expect(
      within(dialog).getByRole("log", { name: "Conversation" }),
    ).toHaveTextContent(ANSWER),
  );
}

describe("Ask Jakub Desktop Mode lifecycle", () => {
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
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: ORIGINAL_INNER_WIDTH,
    });
  });

  it("offers a compact desktop chat without starting a model request", () => {
    const fetchSpy = installSuccessfulAskRoute();
    const view = renderInEnglish(<Desktop />);

    const widget = view.getByRole("complementary", {
      name: "Ask Jakub quick chat",
    });

    expect(widget).toHaveStyle({
      bottom: `${DESKTOP_LAYOUT.edgeInset}px`,
      right: `${ASK_JAKUB_WIDGET_RIGHT}px`,
      width: `${DESKTOP_LAYOUT.askJakubWidget.width}px`,
    });
    const composer = within(widget).getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    const disclosure = document.getElementById("ask-jakub-widget-disclosure");
    expect(composer).toBeInTheDocument();
    expect(disclosure).toHaveTextContent(
      "Your question goes to a third-party model provider; this conversation is not stored.",
    );
    expect(composer.getAttribute("aria-describedby")?.split(" ")).toContain(
      disclosure?.id,
    );
    expect(
      within(widget).getByRole("button", { name: "Open full chat" }),
    ).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("yields to the full App and returns focus when its window closes", async () => {
    installSuccessfulAskRoute();
    const view = renderInEnglish(<Desktop />);
    const widget = view.getByRole("complementary", {
      name: "Ask Jakub quick chat",
    });
    const openFullChat = within(widget).getByRole("button", {
      name: "Open full chat",
    });

    openFullChat.focus();
    fireEvent.click(openFullChat);
    const dialog = await view.findByRole("dialog", { name: "Ask Jakub" });

    expect(
      view.queryByRole("complementary", { name: "Ask Jakub quick chat" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close window" }),
    );

    const returnedWidget = await view.findByRole("complementary", {
      name: "Ask Jakub quick chat",
    });
    await waitFor(() =>
      expect(
        within(returnedWidget).getByRole("button", {
          name: "Open full chat",
        }),
      ).toHaveFocus(),
    );
  });

  it("shares a widget answer with the full Ask Jakub Desktop App", async () => {
    const fetchSpy = installSuccessfulAskRoute();
    const view = renderInEnglish(<Desktop />);
    const widget = view.getByRole("complementary", {
      name: "Ask Jakub quick chat",
    });
    const composer = within(widget).getByRole("textbox", {
      name: "Question about Jakub's work",
    });

    fireEvent.change(composer, { target: { value: QUESTION } });
    fireEvent.click(within(widget).getByRole("button", { name: "Ask" }));

    await waitFor(() => expect(widget).toHaveTextContent(ANSWER));
    const latestAnswer = within(widget).getByText(ANSWER);
    expect(latestAnswer).not.toHaveClass("line-clamp-3");
    expect(latestAnswer).toHaveClass("overflow-y-auto");
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fireEvent.click(
      within(widget).getByRole("button", { name: "Open full chat" }),
    );
    const dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    expect(
      within(dialog).getByRole("log", { name: "Conversation" }),
    ).toHaveTextContent(ANSWER);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("recovers a failed widget turn without duplicating the question", async () => {
    const fetchSpy = vi
      .fn()
      .mockImplementationOnce(
        async (_input: RequestInfo | URL, init?: RequestInit) =>
          unavailableAskResponse(init),
      )
      .mockImplementation(
        async (_input: RequestInfo | URL, init?: RequestInit) =>
          successfulAskResponse(init),
      );
    vi.stubGlobal("fetch", fetchSpy);
    const view = renderInEnglish(<Desktop />);
    const widget = view.getByRole("complementary", {
      name: "Ask Jakub quick chat",
    });

    fireEvent.change(
      within(widget).getByRole("textbox", {
        name: "Question about Jakub's work",
      }),
      { target: { value: QUESTION } },
    );
    fireEvent.click(within(widget).getByRole("button", { name: "Ask" }));

    await waitFor(() =>
      expect(widget).toHaveTextContent(
        "Ask Jakub is currently unavailable. Explore the suggested portfolio questions instead.",
      ),
    );
    fireEvent.click(within(widget).getByRole("button", { name: "Retry" }));

    await waitFor(() => expect(widget).toHaveTextContent(ANSWER));
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    fireEvent.click(
      within(widget).getByRole("button", { name: "Open full chat" }),
    );
    const transcript = within(
      await view.findByRole("dialog", { name: "Ask Jakub" }),
    ).getByRole("log", { name: "Conversation" });
    expect(within(transcript).getAllByText(QUESTION)).toHaveLength(1);
  });

  it("cancels an active question from the widget", async () => {
    let requestSignal: AbortSignal | undefined;
    const fetchSpy = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          requestSignal = init?.signal ?? undefined;
          requestSignal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          );
        }),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const view = renderInEnglish(<Desktop />);
    const widget = view.getByRole("complementary", {
      name: "Ask Jakub quick chat",
    });

    fireEvent.change(
      within(widget).getByRole("textbox", {
        name: "Question about Jakub's work",
      }),
      { target: { value: QUESTION } },
    );
    fireEvent.click(within(widget).getByRole("button", { name: "Ask" }));

    const cancel = await within(widget).findByRole("button", {
      name: "Cancel answer",
    });
    fireEvent.click(cancel);

    expect(requestSignal).toBeDefined();
    expect(requestSignal?.aborted).toBe(true);
    expect(widget).toHaveTextContent("Request cancelled.");
    expect(
      within(widget).getByRole("button", { name: "Retry" }),
    ).toBeInTheDocument();
  });

  it("retains a completed conversation after minimise, restore, close, and reopen", async () => {
    const fetchSpy = installSuccessfulAskRoute();
    const view = renderInEnglish(<Desktop />);

    expect(fetchSpy).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole("button", { name: "Ask Jakub" }));

    let dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    expect(fetchSpy).not.toHaveBeenCalled();
    await askQuestion(dialog);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/ask-jakub",
      expect.objectContaining({ method: "POST" }),
    );

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Minimise window" }),
    );
    expect(dialog).toHaveAttribute("aria-hidden", "true");

    fireEvent.click(view.getByRole("button", { name: "Ask Jakub (open)" }));
    await waitFor(() => expect(dialog).not.toHaveAttribute("aria-hidden"));
    expect(
      within(dialog).getByRole("log", { name: "Conversation" }),
    ).toHaveTextContent(ANSWER);

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Close window" }),
    );
    await waitFor(() =>
      expect(
        view.queryByRole("dialog", { name: "Ask Jakub" }),
      ).not.toBeInTheDocument(),
    );

    fireEvent.click(view.getByRole("button", { name: "Ask Jakub" }));
    dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    expect(
      within(dialog).getByRole("log", { name: "Conversation" }),
    ).toHaveTextContent(ANSWER);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("returns from owned evidence to the retained conversation at 390px", async () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    installResponsiveMatchMedia(true);
    const fetchSpy = installSuccessfulAskRoute();
    const view = renderInEnglish(<Desktop />);

    expect(fetchSpy).not.toHaveBeenCalled();
    fireEvent.click(
      view.getAllByRole("button", { name: "Open: Ask Jakub" })[0],
    );

    let dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    expect(fetchSpy).not.toHaveBeenCalled();
    await askQuestion(dialog);

    const evidence = within(dialog).getByRole("link", {
      name: "Squizzu — experience",
    });
    expect(evidence).toHaveAttribute("href", "/#engineering");
    fireEvent.click(evidence);

    const destination = await view.findByRole("dialog", {
      name: "Experience",
    });
    await waitFor(() => expect(destination).toHaveFocus());
    fireEvent.click(within(destination).getByRole("button", { name: "Back" }));

    dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    await waitFor(() => expect(dialog).toHaveFocus());
    expect(
      within(dialog).getByRole("log", { name: "Conversation" }),
    ).toHaveTextContent(ANSWER);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("retains the session across desktop and mobile breakpoint transitions", async () => {
    const setMobile = installResponsiveMatchMedia(false);
    const fetchSpy = installSuccessfulAskRoute();
    const view = renderInEnglish(<Desktop />);
    fireEvent.click(view.getByRole("button", { name: "Ask Jakub" }));
    let dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    await askQuestion(dialog);

    act(() => setMobile(true));
    fireEvent.click(
      (await view.findAllByRole("button", { name: "Open: Ask Jakub" }))[0],
    );
    dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    expect(
      within(dialog).getByRole("log", { name: "Conversation" }),
    ).toHaveTextContent(ANSWER);

    fireEvent.click(
      within(dialog).getByRole("link", { name: "Squizzu — experience" }),
    );
    const destination = await view.findByRole("dialog", {
      name: "Experience",
    });
    fireEvent.click(within(destination).getByRole("button", { name: "Back" }));
    dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    expect(
      within(dialog).getByRole("log", { name: "Conversation" }),
    ).toHaveTextContent(ANSWER);

    act(() => setMobile(false));
    dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    expect(
      within(dialog).getByRole("log", { name: "Conversation" }),
    ).toHaveTextContent(ANSWER);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("starts a fresh session after Desktop Mode fully unmounts", async () => {
    const fetchSpy = installSuccessfulAskRoute();
    const first = renderInEnglish(<Desktop />);
    fireEvent.click(first.getByRole("button", { name: "Ask Jakub" }));
    await askQuestion(await first.findByRole("dialog", { name: "Ask Jakub" }));
    first.unmount();
    useWindowStore.setState({ windows: [], focusedId: null, nextZ: 1 });

    const second = renderInEnglish(<Desktop />);
    fireEvent.click(second.getByRole("button", { name: "Ask Jakub" }));
    const freshDialog = await second.findByRole("dialog", {
      name: "Ask Jakub",
    });

    expect(
      within(freshDialog).queryByRole("log", { name: "Conversation" }),
    ).not.toBeInTheDocument();
    expect(
      within(freshDialog).getByText("Start with a question"),
    ).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("starts a fresh localized session when the portfolio language changes", async () => {
    const fetchSpy = installSuccessfulAskRoute();
    const setLang = vi.fn();
    const view = render(
      <LangContext.Provider value={{ lang: "en", setLang }}>
        <Desktop />
      </LangContext.Provider>,
    );
    fireEvent.click(view.getByRole("button", { name: "Ask Jakub" }));
    await askQuestion(await view.findByRole("dialog", { name: "Ask Jakub" }));

    view.rerender(
      <LangContext.Provider value={{ lang: "pl", setLang }}>
        <Desktop />
      </LangContext.Provider>,
    );

    const localizedDialog = await view.findByRole("dialog", {
      name: "Zapytaj o Jakuba",
    });
    expect(
      within(localizedDialog).queryByRole("log", { name: "Rozmowa" }),
    ).not.toBeInTheDocument();
    expect(
      within(localizedDialog).getByRole("textbox", {
        name: "Pytanie o pracę Jakuba",
      }),
    ).toBeInTheDocument();
    expect(
      within(localizedDialog).getByText("Możesz zacząć tutaj"),
    ).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
