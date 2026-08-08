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
) {
  const api: DesktopApi = {
    openApp: () => {},
    openLocation: () => ({ opened: false, reason: "invalid-location" }),
    selectionFor: () => selection,
    switchToSimple: () => {},
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

  it("opens a showcase view and updates the mounted app without accepting another slug", async () => {
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

    fireEvent.click(view.getByRole("button", { name: "Overview" }));
    expect(view.getByRole("button", { name: "Overview" })).toHaveAttribute(
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
    expect(view.getByRole("button", { name: "Overview" })).toHaveAttribute(
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
    expect(view.getByRole("button", { name: "Overview" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(view.getByRole("heading", { name: "Squizzu" })).toBeVisible();
  });
});
