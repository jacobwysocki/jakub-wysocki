import { describe, expect, it } from "vitest";

import { showcase } from "@/data/showcase";
import {
  AppCatalog,
  PUBLIC_DESKTOP_APP_COUNT,
  parseAppId,
} from "@/features/portfolio-navigation/app-catalog";

describe("App Catalog Interface", () => {
  it("has unique typed identity and complete semantic metadata", () => {
    const apps = AppCatalog.all();

    expect(new Set(apps.map((app) => app.id)).size).toBe(apps.length);
    for (const app of apps) {
      expect(app.title.pl).not.toBe("");
      expect(app.title.en).not.toBe("");
      expect(app.size.w).toBeGreaterThan(0);
      expect(app.size.h).toBeGreaterThan(0);
      expect(typeof app.scroll).toBe("boolean");
    }
  });

  it("derives every showcase app from the canonical showcase collection", () => {
    const expected = showcase.map((site) => `site:${site.slug}`);
    const actual = AppCatalog.all()
      .map((app) => app.id)
      .filter((id) => id.startsWith("site:"));

    expect(actual).toEqual(expected);
    for (const id of expected) expect(parseAppId(id)).toBe(id);
  });

  it("fails closed for unknown and malformed app identity", () => {
    expect(parseAppId("about")).toBe("about");
    expect(parseAppId("ask-jakub")).toBe("ask-jakub");
    expect(parseAppId("site:squizzu")).toBe("site:squizzu");
    expect(parseAppId("site:missing")).toBeUndefined();
    expect(parseAppId("missing")).toBeUndefined();
    expect(parseAppId(null)).toBeUndefined();
    expect(AppCatalog.find("site:missing")).toBeUndefined();
  });

  it("owns ordered placement for every desktop and mobile surface", () => {
    expect(AppCatalog.on("mobileDock").map((app) => app.id)).toEqual([
      "ask-jakub",
      "about",
      "experience",
      "studio",
      "contact",
    ]);
    expect(AppCatalog.on("desktopDock").map((app) => app.id)).toEqual(
      AppCatalog.on("desktopIcon").map((app) => app.id),
    );
    expect(AppCatalog.on("mobileGrid").map((app) => app.id)).toEqual(
      AppCatalog.on("desktopIcon").map((app) => app.id),
    );
    expect(AppCatalog.on("desktopIcon")).not.toContainEqual(
      expect.objectContaining({ id: "info" }),
    );
    for (const surface of [
      "desktopIcon",
      "desktopDock",
      "mobileGrid",
      "mobileDock",
    ] as const) {
      const positions = AppCatalog.on(surface).map(
        (app) => app.placement[surface],
      );
      expect(new Set(positions).size).toBe(positions.length);
    }
  });

  it("preserves which apps own their full-height scrolling layout", () => {
    expect(
      AppCatalog.all()
        .filter((app) => !app.scroll)
        .map((app) => app.id),
    ).toEqual([
      "ask-jakub",
      "studio",
      ...showcase.map((site) => `site:${site.slug}`),
      "experience",
    ]);
  });

  it("derives the public count while excluding hidden system apps", () => {
    const visible = AppCatalog.all().filter((app) => app.visitorVisible);

    expect(PUBLIC_DESKTOP_APP_COUNT).toBe(visible.length);
    expect(PUBLIC_DESKTOP_APP_COUNT).toBe(9);
    expect(visible.map((app) => app.id)).not.toContain("info");
  });
});
