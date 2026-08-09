import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, within } from "@testing-library/react";
import type { Lang } from "@/lib/lang";
import { LangContext } from "@/lib/lang-store";
import Hero from "./Hero";

function renderHero(lang: Lang = "pl") {
  return render(
    <LangContext.Provider value={{ lang, setLang: vi.fn() }}>
      <Hero />
    </LangContext.Provider>,
  );
}

describe("Simple Mode Hero", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string): MediaQueryList => ({
        matches:
          query === "(prefers-reduced-motion: reduce)" ||
          query === "(pointer: coarse)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("puts both portfolio actions before supporting proof in the visitor reading order", () => {
    const view = renderHero();
    const hero = view.getByRole("region", { name: "Intro" });
    const primaryAction = within(hero).getByRole("link", {
      name: "Zobacz projekty",
    });
    const secondaryAction = within(hero).getByRole("link", {
      name: "Napisz do mnie",
    });
    const facts = within(hero).getByRole("list", { name: "W skrócie" });
    const disciplines = within(hero).getByRole("list", {
      name: "Czym się zajmuję",
    });

    expect(
      primaryAction.compareDocumentPosition(facts) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      secondaryAction.compareDocumentPosition(facts) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      facts.compareDocumentPosition(disciplines) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("exposes concise proof values without losing their factual labels", () => {
    const view = renderHero();
    const facts = view.getByRole("list", { name: "W skrócie" });

    expect(within(facts).getByText("5 lat").tagName).toBe("STRONG");
    expect(within(facts).getByText("doświadczenia")).toBeInTheDocument();
    expect(within(facts).getByText("PL · UK · MX").tagName).toBe("STRONG");
    expect(within(facts).getByText("40k+").tagName).toBe("STRONG");
    expect(
      within(facts).getByText("użytkowników moich aplikacji"),
    ).toBeInTheDocument();
  });

  it("keeps the compact proof factual in English", () => {
    const view = renderHero("en");
    const facts = view.getByRole("list", { name: "At a glance" });

    expect(within(facts).getByText("5 years").tagName).toBe("STRONG");
    expect(within(facts).getByText("of experience")).toBeInTheDocument();
    expect(within(facts).getByText("PL · UK · MX").tagName).toBe("STRONG");
    expect(within(facts).getByText("40k+").tagName).toBe("STRONG");
    expect(within(facts).getByText("users of my apps")).toBeInTheDocument();
  });
});
