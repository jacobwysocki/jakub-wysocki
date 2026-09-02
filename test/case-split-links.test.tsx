import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// LangProvider odświeża metadane routerem; jsdom nie ma App Routera.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import CaseSplit from "@/components/CaseSplit";
import Timeline from "@/components/Timeline";
import LangProvider from "@/components/LangProvider";
import { squizzuCase, caseBridge, type FeaturedCase } from "@/data/cases";
import { ui } from "@/data/ui";

/**
 * Drzwi do realizacji już raz zniknęły po cichu: link renderował się tylko
 * w gałęzi bez podglądu produktu, więc Squizzu (z podglądem) nie miał wejścia
 * do case'a ze strony głównej. Te testy przypinają komplet kombinacji CTA
 * w obu wariantach oraz trzecie drzwi przy symulacji drona.
 */

const CASE_LABEL = ui.actions.viewCaseStudy.en;

function noPreviewCase(): FeaturedCase {
  return {
    ...squizzuCase,
    preview: undefined,
    link: "https://example.com/live",
    linkLabel: { pl: "Zobacz przykład", en: "Visit example.com" },
  };
}

function renderSplit(project: FeaturedCase, caseHref?: string) {
  return render(
    <LangProvider initialLang="en">
      <CaseSplit project={project} lead={caseBridge.line} caseHref={caseHref} />
    </LangProvider>,
  );
}

beforeEach(() => {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  // VenorPipeline w Timeline mierzy się ResizeObserverem, którego jsdom nie ma.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  // pointer: coarse → wariant stacked; test kombinacji CTA nie zależy od
  // pinningu, a okno produktu bez osadzenia renderuje się deterministycznie.
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: true,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CaseSplit case-study doors", () => {
  it("links the full case study even when the product window is present", () => {
    renderSplit(squizzuCase, "/work/squizzu");

    const caseLink = screen.getByRole("link", { name: CASE_LABEL });
    expect(caseLink).toHaveAttribute("href", "/work/squizzu");
    // Okno produktu ma własną pigułkę adresu, więc zewnętrzny link
    // nie może się tu dublować.
    expect(
      screen.queryByRole("link", { name: /Visit squizzu\.com/i }),
    ).not.toBeInTheDocument();
  });

  it("shows both doors for a case without a product window", () => {
    renderSplit(noPreviewCase(), "/work/squizzu");

    expect(screen.getByRole("link", { name: CASE_LABEL })).toHaveAttribute(
      "href",
      "/work/squizzu",
    );
    const external = screen.getByRole("link", {
      name: /Visit example\.com/i,
    });
    expect(external).toHaveAttribute("href", "https://example.com/live");
    expect(external).toHaveAttribute("target", "_blank");
  });

  it("keeps only the external door when no case href is provided", () => {
    renderSplit(noPreviewCase(), undefined);

    expect(
      screen.queryByRole("link", { name: CASE_LABEL }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Visit example\.com/i }),
    ).toBeInTheDocument();
  });
});

describe("Timeline dissertation doors", () => {
  it("links the drone case study beside the simulation and repo pills", () => {
    render(
      <LangProvider initialLang="en">
        <Timeline />
      </LangProvider>,
    );

    // Oś czasu ma dwoje takich drzwi: dysertacja i stopka Venor.
    const doors = screen
      .getAllByRole("link", { name: CASE_LABEL })
      .map((link) => link.getAttribute("href"));
    expect(doors).toContain("/work/drone-path");
    expect(doors).toContain("/work/venor");
  });
});
