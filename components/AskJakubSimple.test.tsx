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

function renderInEnglish() {
  return render(
    <LangContext.Provider value={{ lang: "en", setLang: vi.fn() }}>
      <AskJakubSimple />
    </LangContext.Provider>,
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
    vi.unstubAllGlobals();
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

  it("uses the CSS-only 900px split for the pill and keeps the inline entry", () => {
    const view = renderInEnglish();
    const pill = view.container.querySelector<HTMLElement>(
      '[data-ask-jakub-trigger="pill"]',
    );
    const inline = view.container.querySelector<HTMLElement>(
      '[data-ask-jakub-trigger="inline"]',
    );

    expect(pill).toHaveClass("max-[899px]:hidden");
    expect(inline).not.toHaveClass("max-[899px]:hidden");
    expect(view.container).toContainElement(
      view.container.querySelector("[data-ask-jakub-inline-entry]"),
    );
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
