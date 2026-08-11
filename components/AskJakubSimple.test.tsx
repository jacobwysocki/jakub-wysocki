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
  });

  it("server-renders both text triggers but no panel payload", () => {
    const html = renderToStaticMarkup(
      <LangContext.Provider value={{ lang: "en", setLang: vi.fn() }}>
        <AskJakubSimple />
      </LangContext.Provider>,
    );
    const document = new DOMParser().parseFromString(html, "text/html");

    expect(
      document.querySelectorAll('[data-ask-jakub-trigger="inline"]'),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll('[data-ask-jakub-trigger="pill"]'),
    ).toHaveLength(1);
    expect(document.body.textContent).toContain(
      "Looking for something specific?",
    );
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

  it("moves focus into the panel, closes on Escape, and returns focus", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const view = renderInEnglish();
    const inline = view.getAllByRole("button", {
      name: "Ask about my work",
    })[0];

    inline.focus();
    fireEvent.click(inline);

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
    expect(inline).toHaveFocus();
  });

  it("keeps one session when the inline trigger hands off to the pill", async () => {
    const fetchSpy = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        successfulAskResponse(init),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const view = renderInEnglish();
    const [inline, pill] = view.getAllByRole("button", {
      name: "Ask about my work",
    });

    fireEvent.click(inline);
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
    fireEvent.click(pill);

    const reopenedDialog = await view.findByRole("dialog", {
      name: "Ask Jakub",
    });
    expect(
      within(reopenedDialog).getByRole("log", { name: "Conversation" }),
    ).toHaveTextContent(ANSWER);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
