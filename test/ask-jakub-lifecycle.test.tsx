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
