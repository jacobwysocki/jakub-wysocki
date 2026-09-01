import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LangContext } from "@/lib/lang-store";
import AskJakubSimple from "./AskJakubSimple";

const routerPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

const QUESTION = "Which work best shows product thinking?";
const ANSWER = "The portfolio points to a documented product example.";
const MOBILE_QUERY = "(max-width: 899px)";
const ORIGINAL_INNER_WIDTH = window.innerWidth;

function setViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query === MOBILE_QUERY ? width < 900 : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

function renderInEnglish() {
  if (typeof window.matchMedia !== "function") setViewport(900);
  return render(
    <div data-simple-root>
      <LangContext.Provider value={{ lang: "en", setLang: vi.fn() }}>
        <AskJakubSimple />
      </LangContext.Provider>
    </div>,
  );
}

function renderInEnglishWithTargets(...targetIds: string[]) {
  if (typeof window.matchMedia !== "function") setViewport(900);
  return render(
    <div data-simple-root>
      {targetIds.map((targetId) => (
        <section
          key={targetId}
          id={targetId}
          tabIndex={-1}
          aria-label={`${targetId} target`}
        />
      ))}
      <LangContext.Provider value={{ lang: "en", setLang: vi.fn() }}>
        <AskJakubSimple />
      </LangContext.Provider>
    </div>,
  );
}

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
      type: "answer.completed",
      kind: "not-covered",
      text: ANSWER,
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
}

function groundedAskResponse(
  init?: RequestInit,
  evidenceId = "evidence:experience:squizzu",
): Response {
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
      type: "answer.completed",
      kind: "answered",
      text: ANSWER,
      evidenceIds: [evidenceId],
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

describe("Ask Jakub in Simple view", () => {
  afterEach(() => {
    cleanup();
    document.body.removeAttribute("style");
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: ORIGINAL_INNER_WIDTH,
    });
    routerPush.mockReset();
  });

  it("server-renders one text trigger but no panel payload", () => {
    const html = renderToStaticMarkup(
      <LangContext.Provider value={{ lang: "en", setLang: vi.fn() }}>
        <AskJakubSimple />
      </LangContext.Provider>,
    );
    const document = new DOMParser().parseFromString(html, "text/html");

    // Jedno wejście na każdej szerokości. Wkładka między sekcjami odpadła,
    // więc pigułka nie może się już chować pod breakpointem.
    const triggers = document.querySelectorAll("[data-ask-jakub-trigger]");
    expect(triggers).toHaveLength(1);
    expect(triggers[0].getAttribute("data-ask-jakub-trigger")).toBe("pill");
    expect(triggers[0].className).not.toContain("899");
    expect(document.body.textContent).toContain("Ask about my work");
    expect(document.querySelector("[data-ask-jakub-simple-panel]")).toBeNull();
    expect(document.body.textContent).not.toContain(
      "Answers use this portfolio and link back to the source.",
    );
  });

  it("enforces mobile modality and restores the exact scroll position", async () => {
    setViewport(390);
    vi.spyOn(window, "scrollY", "get").mockReturnValue(427);
    const scrollTo = vi.fn();
    vi.stubGlobal("scrollTo", scrollTo);
    const view = renderInEnglish();
    fireEvent.click(
      view.getAllByRole("button", { name: "Ask about my work" })[0],
    );

    const dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(document.querySelector("[data-ask-jakub-backdrop]")).not.toBeNull();
    expect(document.body.style.position).toBe("fixed");
    expect(document.body.style.top).toBe("-427px");
    expect(view.container.firstElementChild).toHaveAttribute("inert");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(
        view.queryByRole("dialog", { name: "Ask Jakub" }),
      ).not.toBeInTheDocument(),
    );
    expect(document.body.style.position).toBe("");
    expect(document.body.style.top).toBe("");
    expect(view.container.firstElementChild).not.toHaveAttribute("inert");
    expect(scrollTo).toHaveBeenLastCalledWith(0, 427);
  });

  it("keeps the 900px side panel non-modal", async () => {
    setViewport(900);
    const view = renderInEnglish();
    fireEvent.click(
      view.getAllByRole("button", { name: "Ask about my work" })[0],
    );

    const dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    expect(dialog).not.toHaveAttribute("aria-modal");
    expect(document.querySelector("[data-ask-jakub-backdrop]")).toBeNull();
    expect(document.body.style.position).not.toBe("fixed");
  });

  it.each([390, 768])(
    "keeps the complete mobile interaction chain working at %ipx",
    async (width) => {
      setViewport(width);
      vi.spyOn(window, "scrollY", "get").mockReturnValue(427);
      const scrollTo = vi.fn();
      vi.stubGlobal("scrollTo", scrollTo);
      const fetchSpy = vi.fn(
        async (_input: RequestInfo | URL, init?: RequestInit) =>
          groundedAskResponse(init),
      );
      vi.stubGlobal("fetch", fetchSpy);
      const view = renderInEnglish();
      const trigger = view.getByRole("button", { name: "Ask about my work" });

      expect(view.container.firstElementChild).not.toHaveAttribute("inert");
      fireEvent.click(trigger);

      let dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
      expect(document.body.style.position).toBe("fixed");
      expect(view.container.firstElementChild).toHaveAttribute("inert");

      const suggestions = within(dialog).getByRole("region", {
        name: "Start with a question",
      });
      fireEvent.click(within(suggestions).getAllByRole("button")[0]);
      await waitFor(() =>
        expect(
          within(dialog).getByRole("log", { name: "Conversation" }),
        ).toHaveTextContent(ANSWER),
      );
      expect(fetchSpy).toHaveBeenCalledOnce();

      fireEvent.click(
        within(dialog).getByRole("button", { name: "Clear conversation" }),
      );
      dialog = view.getByRole("dialog", { name: "Ask Jakub" });
      const composer = within(dialog).getByRole("textbox", {
        name: "Question about Jakub's work",
      });
      fireEvent.change(composer, { target: { value: QUESTION } });
      expect(composer).toHaveValue(QUESTION);
      fireEvent.keyDown(composer, { key: "Enter" });

      await waitFor(() =>
        expect(
          within(dialog).getByRole("log", { name: "Conversation" }),
        ).toHaveTextContent(ANSWER),
      );
      expect(fetchSpy).toHaveBeenCalledTimes(2);

      fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
      await waitFor(() =>
        expect(
          view.queryByRole("dialog", { name: "Ask Jakub" }),
        ).not.toBeInTheDocument(),
      );
      expect(document.body.style.position).toBe("");
      expect(view.container.firstElementChild).not.toHaveAttribute("inert");
      expect(scrollTo).toHaveBeenLastCalledWith(0, 427);
    },
  );

  it.each([390, 768, 900])(
    "closes the panel before scrolling and focusing owned evidence at %ipx",
    async (width) => {
      setViewport(width);
      vi.spyOn(window, "scrollY", "get").mockReturnValue(427);
      const scrollTo = vi.fn();
      vi.stubGlobal("scrollTo", scrollTo);
      const fetchSpy = vi.fn(
        async (_input: RequestInfo | URL, init?: RequestInit) =>
          groundedAskResponse(init),
      );
      vi.stubGlobal("fetch", fetchSpy);
      const view = renderInEnglishWithTargets("engineering");
      const target = view.getByRole("region", {
        name: "engineering target",
      });
      const scrollIntoView = vi.fn();
      target.scrollIntoView = scrollIntoView;

      fireEvent.click(view.getByRole("button", { name: "Ask about my work" }));
      const dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
      const composer = within(dialog).getByRole("textbox", {
        name: "Question about Jakub's work",
      });
      fireEvent.change(composer, { target: { value: QUESTION } });
      fireEvent.keyDown(composer, { key: "Enter" });

      const evidence = await within(dialog).findByRole("link", {
        name: "Squizzu — experience",
      });
      fireEvent.click(evidence);

      await waitFor(() =>
        expect(
          view.queryByRole("dialog", { name: "Ask Jakub" }),
        ).not.toBeInTheDocument(),
      );
      await waitFor(() =>
        expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" }),
      );
      expect(document.body.style.position).toBe("");
      expect(view.container.firstElementChild).not.toHaveAttribute("inert");
      expect(target).toHaveFocus();
      if (width < 900) {
        expect(scrollTo).toHaveBeenLastCalledWith(0, 427);
        expect(scrollTo.mock.invocationCallOrder[0]).toBeLessThan(
          scrollIntoView.mock.invocationCallOrder[0],
        );
      }
    },
  );

  it.each([390, 768])(
    "uses the same mobile navigation path for failure-state portfolio links at %ipx",
    async (width) => {
      setViewport(width);
      vi.spyOn(window, "scrollY", "get").mockReturnValue(427);
      const scrollTo = vi.fn();
      vi.stubGlobal("scrollTo", scrollTo);
      const fetchSpy = vi.fn(
        async (_input: RequestInfo | URL, init?: RequestInit) =>
          unavailableAskResponse(init),
      );
      vi.stubGlobal("fetch", fetchSpy);
      const view = renderInEnglishWithTargets("engineering");
      const target = view.getByRole("region", {
        name: "engineering target",
      });
      const scrollIntoView = vi.fn();
      target.scrollIntoView = scrollIntoView;

      fireEvent.click(view.getByRole("button", { name: "Ask about my work" }));
      const dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
      const composer = within(dialog).getByRole("textbox", {
        name: "Question about Jakub's work",
      });
      fireEvent.change(composer, { target: { value: QUESTION } });
      fireEvent.keyDown(composer, { key: "Enter" });
      fireEvent.click(
        await within(dialog).findByRole("link", { name: "View experience" }),
      );

      await waitFor(() =>
        expect(
          view.queryByRole("dialog", { name: "Ask Jakub" }),
        ).not.toBeInTheDocument(),
      );
      await waitFor(() => expect(scrollIntoView).toHaveBeenCalledOnce());
      expect(document.body.style.position).toBe("");
      expect(target).toHaveFocus();
      expect(scrollTo.mock.invocationCallOrder[0]).toBeLessThan(
        scrollIntoView.mock.invocationCallOrder[0],
      );
    },
  );

  it("announces an unavailable Simple-view destination instead of jumping to the wrong section", async () => {
    setViewport(900);
    const fetchSpy = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        groundedAskResponse(init, "evidence:ask-jakub"),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const view = renderInEnglishWithTargets("about");
    const about = view.getByRole("region", { name: "about target" });
    const scrollIntoView = vi.fn();
    about.scrollIntoView = scrollIntoView;

    fireEvent.click(view.getByRole("button", { name: "Ask about my work" }));
    const dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    const composer = within(dialog).getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: QUESTION } });
    fireEvent.keyDown(composer, { key: "Enter" });
    fireEvent.click(
      await within(dialog).findByRole("link", {
        name: "Ask Jakub — portfolio guide",
      }),
    );

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("alert")).toHaveTextContent(
      "This source has no destination in Simple view.",
    );
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("moves focus into the panel, closes on Escape, and returns focus", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const view = renderInEnglish();
    const trigger = view.getByRole("button", { name: "Ask about my work" });

    trigger.focus();
    fireEvent.click(trigger);

    const dialog = await view.findByRole("dialog", { name: "Ask Jakub" });
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Close" }),
      ).toHaveFocus(),
    );
    expect(within(dialog).getByText("AI portfolio guide")).toBeInTheDocument();
    const composer = within(dialog).getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    const disclosure = document.getElementById(
      "ask-jakub-simple-panel-disclosure",
    );
    expect(disclosure).toHaveTextContent(
      "Your question goes to a third-party model provider; this conversation is not stored.",
    );
    expect(composer.getAttribute("aria-describedby")?.split(" ")).toContain(
      disclosure?.id,
    );
    expect(fetchSpy).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(
        view.queryByRole("dialog", { name: "Ask Jakub" }),
      ).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });

  it("keeps one session across close and reopen", async () => {
    const fetchSpy = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        successfulAskResponse(init),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const view = renderInEnglish();
    const trigger = view.getByRole("button", { name: "Ask about my work" });

    fireEvent.click(trigger);
    const firstDialog = await view.findByRole("dialog", {
      name: "Ask Jakub",
    });
    const composer = within(firstDialog).getByRole("textbox", {
      name: "Question about Jakub's work",
    });
    fireEvent.change(composer, { target: { value: QUESTION } });
    fireEvent.keyDown(composer, { key: "Enter" });

    await waitFor(() =>
      expect(
        within(firstDialog).getByRole("log", { name: "Conversation" }),
      ).toHaveTextContent(ANSWER),
    );
    expect(fetchSpy).toHaveBeenCalledOnce();

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() =>
      expect(
        view.queryByRole("dialog", { name: "Ask Jakub" }),
      ).not.toBeInTheDocument(),
    );
    fireEvent.click(trigger);

    const reopenedDialog = await view.findByRole("dialog", {
      name: "Ask Jakub",
    });
    expect(
      within(reopenedDialog).getByRole("log", { name: "Conversation" }),
    ).toHaveTextContent(ANSWER);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
