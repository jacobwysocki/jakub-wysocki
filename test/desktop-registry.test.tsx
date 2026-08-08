import { describe, expect, it } from "vitest";

import { AppCatalog, type AppId } from "@/features/portfolio-navigation";
import {
  APPS,
  findApp,
  getApp,
  getAppsFor,
} from "@/components/desktop/registry";

describe("client App Catalog Adapter", () => {
  it("provides one visual/content adapter for every semantic app", () => {
    expect(APPS.map((app) => app.id)).toEqual(
      AppCatalog.all().map((app) => app.id),
    );
    for (const app of APPS) {
      expect(app.tile.bg).not.toBe("");
      expect(app.tile.glyph).toBeDefined();
      expect(app.Content).toBeTypeOf("function");
    }
  });

  it("uses semantic catalog placement instead of local membership lists", () => {
    for (const surface of [
      "desktopIcon",
      "desktopDock",
      "mobileGrid",
      "mobileDock",
    ] as const) {
      expect(getAppsFor(surface).map((app) => app.id)).toEqual(
        AppCatalog.on(surface).map((app) => app.id),
      );
    }
  });

  it("never substitutes another visual app for an unknown id", () => {
    expect(findApp("site:missing")).toBeUndefined();
    expect(() => getApp("site:missing" as AppId)).toThrow(
      "Unknown Desktop App",
    );
  });
});
