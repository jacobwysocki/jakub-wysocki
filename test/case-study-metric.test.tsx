import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

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

    // Warstwa wizualna: poza viewportem (obserwator nigdy nie zgłasza
    // wejścia) licznik ma pokazywać prawdziwą wartość, nie zero z resetu.
    const visual = container.querySelector(".tabular-nums");
    expect(visual?.textContent).toBe("1,000+");
  });

  it("renders a decimal value statically instead of corrupting it", () => {
    renderEn(
      withMetrics([
        { from: "0", value: "12.5%", label: { pl: "wzrost", en: "growth" } },
      ]),
    );

    expect(screen.getByText("12.5%")).toBeInTheDocument();
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

  it("formats the figure per language, Polish included", () => {
    const { container } = render(
      <LangProvider initialLang="pl">
        <CaseStudyBody
          study={withMetrics([
            {
              from: "0",
              value: "1,000+",
              label: { pl: "użytkowników", en: "users" },
            },
          ])}
        />
      </LangProvider>,
    );

    const srTexts = Array.from(container.querySelectorAll(".sr-only")).map(
      (el) => el.textContent,
    );
    // pl-PL nie grupuje tysiąca przecinkiem; łącznik drogi po polsku.
    expect(srTexts).toContain("1000+");
    expect(srTexts).toContain("do");
    expect(screen.getByText("użytkowników")).toBeInTheDocument();
  });

  it("renders the journey inside window chrome as well", () => {
    const { container } = render(
      <LangProvider initialLang="en">
        <CaseStudyBody
          chrome="window"
          study={withMetrics([
            {
              from: "0",
              value: "1,000+",
              label: { pl: "użytkowników", en: "users" },
            },
          ])}
        />
      </LangProvider>,
    );

    const srTexts = Array.from(container.querySelectorAll(".sr-only")).map(
      (el) => el.textContent,
    );
    expect(srTexts).toContain("1,000+");
    // Karta drogi nie może wymuszać stałej szerokości w wąskim sheecie.
    const card = container.querySelector('[data-testid="metric-figure"]');
    expect(card?.className).toContain("min-w-0");
  });

  it("observes the nearest scroller, not the viewport, inside window chrome", () => {
    // rootMargin działa tylko na roocie obserwatora, nie na przodkach
    // przycinających: w oknie pulpitu licznik musi obserwować scroller
    // okna, inaczej start-przed-kadrem nie działa i widać reset do zera.
    const roots: (Element | null)[] = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(_cb: unknown, options?: IntersectionObserverInit) {
          roots.push((options?.root as Element | null) ?? null);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );

    render(
      <LangProvider initialLang="en">
        <div data-testid="window-scroller" style={{ overflowY: "auto" }}>
          <CaseStudyBody
            study={withMetrics([
              { from: "0", value: "1,000+", label: { pl: "u", en: "users" } },
            ])}
          />
        </div>
      </LangProvider>,
    );

    const scroller = screen.getByTestId("window-scroller");
    expect(roots).toContain(scroller);
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

    const group = container.querySelector('[data-testid="metric-figure"]');
    expect(group).not.toBeNull();
    const children = Array.from(group!.children).map((el) => el.tagName);
    expect(children.indexOf("DT")).toBeGreaterThanOrEqual(0);
    expect(children.indexOf("DT")).toBeLessThan(children.indexOf("DD"));
  });
});
