import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DesktopProvider,
  type DesktopApi,
} from "@/components/desktop/DesktopContext";
import EducationApp from "@/components/desktop/apps/EducationApp";
import ExperienceApp from "@/components/desktop/apps/ExperienceApp";
import SiteApp from "@/components/desktop/apps/SiteApp";
import StudioApp from "@/components/desktop/apps/StudioApp";
import { showcase } from "@/data/showcase";
import type { PortfolioLocation } from "@/features/portfolio-navigation";
import { LangContext } from "@/lib/lang-store";

function renderApp(
  content: React.ReactNode,
  selection: PortfolioLocation | undefined,
  overrides: Partial<DesktopApi> = {},
) {
  const api: DesktopApi = {
    openApp: () => {},
    openLocation: () => ({ opened: false, reason: "invalid-location" }),
    selectionFor: () => selection,
    switchToSimple: () => {},
    ...overrides,
  };

  return (
    <LangContext.Provider value={{ lang: "en", setLang: () => {} }}>
      <DesktopProvider value={api}>{content}</DesktopProvider>
    </LangContext.Provider>
  );
}

describe("semantic Desktop App selections", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
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
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens an experience role and updates the mounted app for a later role", async () => {
    const view = render(
      renderApp(<ExperienceApp />, {
        area: "experience",
        roleId: "mandata",
      }),
    );

    await waitFor(() =>
      expect(view.getByRole("heading", { name: "Mandata" })).toBeVisible(),
    );

    fireEvent.click(view.getByRole("button", { name: /Squizzu/ }));
    await waitFor(() =>
      expect(view.getByRole("heading", { name: "Squizzu" })).toBeVisible(),
    );
    view.rerender(
      renderApp(<ExperienceApp />, {
        area: "experience",
        roleId: "mandata",
      }),
    );
    await waitFor(() =>
      expect(view.getByRole("heading", { name: "Mandata" })).toBeVisible(),
    );

    view.rerender(
      renderApp(<ExperienceApp />, {
        area: "experience",
        roleId: "bunzl",
      }),
    );

    await waitFor(() =>
      expect(view.getByRole("heading", { name: "Bunzl plc" })).toBeVisible(),
    );

    view.rerender(
      renderApp(<ExperienceApp />, {
        area: "studio",
        projectSlug: "printly",
      }),
    );
    expect(view.getByRole("heading", { name: "Bunzl plc" })).toBeVisible();
  });

  it("opens the Ultra Studio case through its canonical project location", async () => {
    const openLocation = vi.fn<DesktopApi["openLocation"]>(() => ({
      opened: false,
      reason: "invalid-location",
    }));
    const view = render(
      renderApp(
        <ExperienceApp />,
        { area: "experience", roleId: "ultrastudio" },
        { openLocation },
      ),
    );

    await waitFor(() =>
      expect(view.getByRole("heading", { name: "Ultra Studio" })).toBeVisible(),
    );
    const studioButtons = view.getAllByRole("button", {
      name: "Ultra Studio",
    });
    fireEvent.click(studioButtons.at(-1)!);

    expect(openLocation).toHaveBeenCalledWith({
      area: "project",
      projectId: "ultra-studio",
    });
  });

  it("opens a studio project and updates the mounted app for a later project", async () => {
    const view = render(
      renderApp(<StudioApp />, {
        area: "studio",
        projectSlug: "printly",
      }),
    );

    await waitFor(() =>
      expect(view.getByRole("heading", { name: "Printly" })).toBeVisible(),
    );

    fireEvent.click(view.getByRole("button", { name: "Alumed" }));
    await waitFor(() =>
      expect(view.getByRole("heading", { name: "Alumed" })).toBeVisible(),
    );
    view.rerender(
      renderApp(<StudioApp />, {
        area: "studio",
        projectSlug: "printly",
      }),
    );
    await waitFor(() =>
      expect(view.getByRole("heading", { name: "Printly" })).toBeVisible(),
    );

    view.rerender(
      renderApp(<StudioApp />, {
        area: "studio",
        projectSlug: "squizzu",
      }),
    );

    await waitFor(() =>
      expect(view.getByRole("heading", { name: "Squizzu" })).toBeVisible(),
    );

    view.rerender(
      renderApp(<StudioApp />, {
        area: "experience",
        roleId: "mandata",
      }),
    );
    expect(view.getByRole("heading", { name: "Squizzu" })).toBeVisible();
  });

  it.each([
    ["degree", "BSc (Hons) Computer Science"],
    [
      "dissertation",
      /Implementation of Path Optimization Algorithm for the Optimal Number/,
    ],
    ["bootcamp", "Bootcamp"],
    ["certifications", "Certifications"],
    ["languages", "Languages"],
  ] as const)(
    "focuses the exact education %s section",
    async (itemId, name) => {
      const view = render(
        renderApp(<EducationApp />, { area: "education", itemId }),
      );

      await waitFor(() =>
        expect(view.getByRole("region", { name })).toHaveFocus(),
      );
    },
  );

  it("opens Drone Simulation through its canonical project location", () => {
    const openLocation = vi.fn<DesktopApi["openLocation"]>(() => ({
      opened: false,
      reason: "invalid-location",
    }));
    const view = render(
      renderApp(<EducationApp />, undefined, { openLocation }),
    );

    fireEvent.click(view.getByRole("button", { name: /simulation/i }));

    expect(openLocation).toHaveBeenCalledWith({
      area: "project",
      projectId: "drone-path",
    });
  });

  it("updates an open education app, repeats the same intent, and ignores mismatches", async () => {
    const view = render(
      renderApp(<EducationApp />, {
        area: "education",
        itemId: "certifications",
      }),
    );
    const certifications = view.getByRole("region", {
      name: "Certifications",
    });
    const repositoryLink = view.getByRole("link", { name: "GitHub" });
    await waitFor(() => expect(certifications).toHaveFocus());

    repositoryLink.focus();
    view.rerender(
      renderApp(<EducationApp />, {
        area: "education",
        itemId: "certifications",
      }),
    );
    await waitFor(() => expect(certifications).toHaveFocus());

    view.rerender(
      renderApp(<EducationApp />, {
        area: "education",
        itemId: "languages",
      }),
    );
    await waitFor(() =>
      expect(view.getByRole("region", { name: "Languages" })).toHaveFocus(),
    );

    repositoryLink.focus();
    view.rerender(
      renderApp(<EducationApp />, {
        area: "experience",
        roleId: "mandata",
      }),
    );
    expect(repositoryLink).toHaveFocus();
  });

  it.each([
    ["squizzu", "Squizzu"],
    ["drone-path", "Drone Simulation"],
  ] as const)(
    "maps the %s overview location to its case tab",
    async (slug, name) => {
      const site = showcase.find((candidate) => candidate.slug === slug);
      if (!site) throw new Error(`Missing ${name} showcase fixture`);

      const view = render(
        renderApp(<SiteApp site={site} />, {
          area: "showcase",
          slug,
          view: "overview",
        }),
      );

      await waitFor(() =>
        expect(
          view.getByRole("button", { name: "Case study" }),
        ).toHaveAttribute("aria-pressed", "true"),
      );
      expect(
        view.queryByRole("button", { name: "Overview" }),
      ).not.toBeInTheDocument();
      expect(view.getByRole("heading", { name })).toBeVisible();
    },
  );

  it("renders only the merged case presentation for a showcase sheet", () => {
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
    const squizzu = showcase.find((site) => site.slug === "squizzu");
    if (!squizzu) throw new Error("Missing Squizzu showcase fixture");

    const view = render(
      renderApp(<SiteApp site={squizzu} />, {
        area: "showcase",
        slug: "squizzu",
        view: "live",
      }),
    );

    expect(view.getByRole("heading", { name: "Squizzu" })).toBeVisible();
    expect(
      view.queryByRole("button", { name: "Live preview" }),
    ).not.toBeInTheDocument();
    expect(
      view.queryByRole("heading", { name: "What is it" }),
    ).not.toBeInTheDocument();
  });

  it("keeps Overview and Live for a showcase site without a case", () => {
    const source = showcase.find((site) => site.slug === "squizzu");
    if (!source) throw new Error("Missing Squizzu showcase fixture");
    const site = {
      ...source,
      slug: "unpublished-showcase",
      name: "Unpublished Showcase",
    };

    const view = render(renderApp(<SiteApp site={site} />, undefined));

    expect(view.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      view.getAllByRole("button", { name: "Live preview" })[0],
    ).toBeVisible();
    expect(
      view.queryByRole("button", { name: "Case study" }),
    ).not.toBeInTheDocument();
    expect(
      view.getByRole("heading", { name: "Unpublished Showcase" }),
    ).toBeVisible();
  });

  it("opens a showcase live view and updates the mounted app without accepting another slug", async () => {
    const squizzu = showcase.find((site) => site.slug === "squizzu");
    if (!squizzu) throw new Error("Missing Squizzu showcase fixture");

    const view = render(
      renderApp(<SiteApp site={squizzu} />, {
        area: "showcase",
        slug: "squizzu",
        view: "live",
      }),
    );

    await waitFor(() =>
      expect(
        view.getAllByRole("button", { name: "Live preview" })[0],
      ).toHaveAttribute("aria-pressed", "true"),
    );

    fireEvent.click(view.getByRole("button", { name: "Case study" }));
    expect(view.getByRole("button", { name: "Case study" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    view.rerender(
      renderApp(<SiteApp site={squizzu} />, {
        area: "showcase",
        slug: "squizzu",
        view: "live",
      }),
    );
    await waitFor(() =>
      expect(
        view.getAllByRole("button", { name: "Live preview" })[0],
      ).toHaveAttribute("aria-pressed", "true"),
    );

    view.rerender(
      renderApp(<SiteApp site={squizzu} />, {
        area: "showcase",
        slug: "squizzu",
        view: "overview",
      }),
    );

    await waitFor(() =>
      expect(view.getByRole("heading", { name: "Squizzu" })).toBeVisible(),
    );
    expect(view.getByRole("button", { name: "Case study" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    view.rerender(
      renderApp(<SiteApp site={squizzu} />, {
        area: "showcase",
        slug: "drone-path",
        view: "live",
      }),
    );
    expect(view.getByRole("button", { name: "Case study" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(view.getByRole("heading", { name: "Squizzu" })).toBeVisible();
  });
});
