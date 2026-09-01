import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import CaseStudyBody from "@/components/case-study/CaseStudyBody";
import LangProvider from "@/components/LangProvider";
import type { UxCaseStudy } from "@/data/case-studies";

/** Język przypięty jawnie: bez tego test wisi na domyślnym języku jsdom. */
function renderEn(study: UxCaseStudy) {
  return render(
    <LangProvider initialLang="en">
      <CaseStudyBody study={study} />
    </LangProvider>,
  );
}

/**
 * Figura wyniku ma kontrakt uczciwości: sformatowana wartość docelowa musi
 * istnieć w DOM jako stabilny tekst niezależnie od animacji, droga from →
 * wartość nie może gubić punktu startu, a porządek dt → dd jest wymogiem
 * listy definicji. Testy przypinają dokładnie te zachowania.
 */

const baseStudy: UxCaseStudy = {
  slug: "squizzu",
  client: "Testcase",
  tag: { pl: "Test", en: "Test" },
  role: { pl: "Rola", en: "Role" },
  gradient: "linear-gradient(150deg, #000 0%, #333 100%)",
  cover: null,
  problem: { pl: "Problem.", en: "Problem." },
  decisions: [
    {
      decision: { pl: "Decyzja.", en: "Decision." },
      rationale: { pl: "Powód.", en: "Reason." },
    },
  ],
  solution: { summary: { pl: "Rozwiązanie.", en: "Solution." }, media: [] },
};

function withMetrics(metrics: NonNullable<UxCaseStudy["outcome"]>["metrics"]) {
  return { ...baseStudy, outcome: { metrics } };
}

describe("case study outcome figures", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps the formatted target as stable accessible text", () => {
    const { container } = renderEn(
      withMetrics([
        {
          from: "0",
          value: "1,000+",
          label: { pl: "użytkowników", en: "users" },
        },
      ]),
    );

    // Warstwa dostępna: pełna, sformatowana wartość z separatorem tysięcy
    // żyje w tekście sr-only niezależnie od stanu animacji licznika,
    // razem ze słownym łącznikiem drogi.
    const srTexts = Array.from(container.querySelectorAll(".sr-only")).map(
      (el) => el.textContent,
    );
    expect(srTexts).toContain("1,000+");
    expect(srTexts).toContain("to");
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("users")).toBeInTheDocument();
  });

  it("keeps the journey for a digitless from → value pair", () => {
    renderEn(
      withMetrics([
        { from: "beta", value: "live", label: { pl: "status", en: "status" } },
      ]),
    );

    expect(screen.getByText("beta")).toBeInTheDocument();
    expect(screen.getByText("live")).toBeInTheDocument();
  });

  it("renders a plain figure without the journey when from is absent", () => {
    renderEn(
      withMetrics([{ value: "75%", label: { pl: "celność", en: "accuracy" } }]),
    );

    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.queryByText("to")).not.toBeInTheDocument();
  });

  it("orders definition terms before definitions inside the metrics list", () => {
    const { container } = renderEn(
      withMetrics([
        {
          from: "0",
          value: "1,000+",
          label: { pl: "użytkowników", en: "users" },
        },
      ]),
    );

    const group = container.querySelector("dl > div");
    expect(group).not.toBeNull();
    const children = Array.from(group!.children).map((el) => el.tagName);
    expect(children.indexOf("DT")).toBeLessThan(children.indexOf("DD"));
  });
});
