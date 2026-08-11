import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import MobileDesktop from "@/components/desktop/MobileDesktop";
import { AskJakubProvider } from "@/features/ask-jakub";

const ASK_QUESTION = "Który projekt najlepiej pokazuje myślenie produktowe?";
const ASK_ANSWER = "Portfolio wskazuje udokumentowany przykład produktowy.";

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
      text: ASK_ANSWER,
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

describe("Pocket OS app sheets", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("removes the desktop background from the accessibility tree while open", async () => {
    const view = render(<MobileDesktop wallpaperId="moon" />);
    const launcher = view.getAllByRole("button", {
      name: "Otwórz: O mnie",
    })[0];

    fireEvent.click(launcher);

    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveFocus(),
    );
    const background = view.container.querySelector(
      "[data-mobile-desktop-background]",
    );
    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveAttribute("inert");
    expect(
      view.queryByRole("button", { name: "Otwórz: O mnie" }),
    ).not.toBeInTheDocument();
  });

  it("returns focus to the exact launcher after the close button", async () => {
    const view = render(<MobileDesktop wallpaperId="moon" />);
    const launcher = view.getAllByRole("button", {
      name: "Otwórz: O mnie",
    })[0];
    fireEvent.click(launcher);
    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveFocus(),
    );

    fireEvent.click(view.getByRole("button", { name: "Zamknij" }));

    await waitFor(() => expect(launcher).toHaveFocus());
  });

  it.each([
    ["Escape", "escape"],
    ["the backdrop", "backdrop"],
  ])("returns focus to the exact launcher after %s", async (_, closePath) => {
    const view = render(<MobileDesktop wallpaperId="moon" />);
    const launcher = view.getAllByRole("button", {
      name: "Otwórz: O mnie",
    })[0];
    fireEvent.click(launcher);
    const dialog = await view.findByRole("dialog", { name: "O mnie" });
    await waitFor(() => expect(dialog).toHaveFocus());

    if (closePath === "escape") {
      fireEvent.keyDown(dialog, { key: "Escape" });
    } else {
      fireEvent.click(dialog.parentElement!);
    }

    await waitFor(() => expect(launcher).toHaveFocus());
  });

  it("traps forward and reverse Tab focus inside the active sheet", async () => {
    const view = render(<MobileDesktop wallpaperId="moon" />);
    fireEvent.click(
      view.getAllByRole("button", { name: "Otwórz: Edukacja" })[0],
    );
    const dialog = await view.findByRole("dialog", { name: "Edukacja" });
    await waitFor(() => expect(dialog).toHaveFocus());
    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
      ),
    );
    const first = focusable[0];
    const last = focusable.at(-1)!;

    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(first).toHaveFocus();

    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });
    expect(last).toHaveFocus();
  });

  it("keeps focus in a nested app stack and restores the root launcher", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    const view = render(<MobileDesktop wallpaperId="moon" />);
    const launcher = view.getAllByRole("button", {
      name: "Otwórz: Edukacja",
    })[0];
    fireEvent.click(launcher);
    await view.findByRole("dialog", { name: "Edukacja" });

    fireEvent.click(view.getByRole("button", { name: "Uruchom symulację" }));
    const nestedDialog = await view.findByRole("dialog", {
      name: "Drone Simulation",
    });
    await waitFor(() => expect(nestedDialog).toHaveFocus());

    fireEvent.click(view.getByRole("button", { name: "Wróć" }));
    const parentDialog = await view.findByRole("dialog", {
      name: "Edukacja",
    });
    await waitFor(() => expect(parentDialog).toHaveFocus());

    fireEvent.click(view.getByRole("button", { name: "Zamknij" }));
    await waitFor(() => expect(launcher).toHaveFocus());
  });

  it("lets a full-height Desktop App own scrolling inside its sheet", () => {
    const view = render(<MobileDesktop wallpaperId="moon" />);
    fireEvent.click(
      view.getAllByRole("button", { name: "Otwórz: Ultra Studio" })[0],
    );

    const dialog = view.getByRole("dialog", { name: "Ultra Studio" });
    expect(dialog.querySelector("[data-lenis-prevent]")).toHaveClass(
      "overflow-hidden",
    );
  });

  it("opens Ask Jakub from Pocket OS and retains its shared session", async () => {
    const fetchSpy = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        successfulAskResponse(init),
    );
    vi.stubGlobal("fetch", fetchSpy);
    const view = render(
      <AskJakubProvider>
        <MobileDesktop wallpaperId="moon" />
      </AskJakubProvider>,
    );
    const launcher = view.getAllByRole("button", {
      name: "Otwórz: Zapytaj o Jakuba",
    })[0];

    fireEvent.click(launcher);
    const firstSheet = await view.findByRole("dialog", {
      name: "Zapytaj o Jakuba",
    });
    const composer = within(firstSheet).getByRole("textbox", {
      name: "Pytanie o pracę Jakuba",
    });
    fireEvent.change(composer, { target: { value: ASK_QUESTION } });
    fireEvent.keyDown(composer, { key: "Enter" });

    await waitFor(() =>
      expect(
        within(firstSheet).getByRole("log", { name: "Rozmowa" }),
      ).toHaveTextContent(ASK_ANSWER),
    );
    expect(fetchSpy).toHaveBeenCalledOnce();

    fireEvent.click(
      within(firstSheet).getByRole("button", { name: "Zamknij" }),
    );
    await waitFor(() => expect(launcher).toHaveFocus());
    fireEvent.click(launcher);

    const reopenedSheet = await view.findByRole("dialog", {
      name: "Zapytaj o Jakuba",
    });
    expect(
      within(reopenedSheet).getByRole("log", { name: "Rozmowa" }),
    ).toHaveTextContent(ASK_ANSWER);
    expect(fetchSpy).toHaveBeenCalledOnce();
  });
});
