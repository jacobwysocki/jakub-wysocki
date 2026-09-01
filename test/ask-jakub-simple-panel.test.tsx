import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AskJakubSimplePanel from "@/components/AskJakubSimplePanel";
import { LangContext } from "@/lib/lang-store";

const routerPush = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

vi.mock("@/data/case-studies", () => {
  const projectIds = [
    "squizzu",
    "ultra-studio",
    "venor",
    "alumed",
    "printly",
    "drone-path",
  ] as const;
  const aliases: Record<string, (typeof projectIds)[number]> = {
    "ultrastudio-site": "ultra-studio",
  };
  const caseStudies = Object.fromEntries(
    projectIds.map((projectId) => [
      projectId,
      {
        slug: projectId,
        client: projectId,
        gradient: "linear-gradient(#000, #fff)",
      },
    ]),
  );
  const parseProjectId = (value: string) =>
    projectIds.includes(value as (typeof projectIds)[number])
      ? (value as (typeof projectIds)[number])
      : (aliases[value] ?? null);

  return {
    PROJECT_IDS: projectIds,
    PROJECT_ID_ALIASES: aliases,
    caseStudies,
    parseProjectId,
    findCaseStudy: (value: string) => {
      const projectId = parseProjectId(value);
      return projectId ? caseStudies[projectId] : null;
    },
  };
});

function askResponse(evidenceId: string, init?: RequestInit): Response {
  if (typeof init?.body !== "string") {
    throw new Error("Expected a JSON Ask Jakub request body.");
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
      text: "Here is the requested portfolio evidence.",
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

function renderPanel(onClose = vi.fn()) {
  render(
    <LangContext.Provider value={{ lang: "en", setLang: vi.fn() }}>
      <AskJakubSimplePanel id="ask-jakub-simple-test" open onClose={onClose} />
    </LangContext.Provider>,
  );
  return onClose;
}

async function askForEvidence(evidenceId: string) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      askResponse(evidenceId, init),
    ),
  );

  fireEvent.change(
    screen.getByRole("textbox", { name: "Question about Jakub's work" }),
    { target: { value: "Show me the evidence" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Ask" }));

  await screen.findByText("Here is the requested portfolio evidence.");
}

describe("AskJakubSimplePanel evidence navigation", () => {
  beforeEach(() => {
    routerPush.mockReset();
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
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        callback(0);
        return 1;
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    document.getElementById("about")?.remove();
  });

  it("uses client route navigation for a published /work evidence href", async () => {
    const onClose = renderPanel();
    await askForEvidence("evidence:studio:printly");

    const evidence = screen.getByRole("link", {
      name: /Printly — studio project/,
    });
    expect(evidence).toHaveAttribute("href", "/work/printly");

    fireEvent.click(evidence);

    await waitFor(() =>
      expect(routerPush).toHaveBeenCalledWith("/work/printly"),
    );
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("preserves same-page anchor scrolling for legacy evidence hrefs", async () => {
    const destination = document.createElement("section");
    destination.id = "about";
    destination.scrollIntoView = vi.fn();
    document.body.append(destination);
    const pushState = vi.spyOn(window.history, "pushState");
    const onClose = renderPanel();
    await askForEvidence("evidence:about");

    const evidence = screen.getByRole("link", { name: "About Jakub" });
    expect(evidence).toHaveAttribute("href", "/#about");

    fireEvent.click(evidence);

    await waitFor(() =>
      expect(pushState).toHaveBeenCalledWith(null, "", "/#about"),
    );
    expect(destination).toHaveFocus();
    expect(routerPush).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
