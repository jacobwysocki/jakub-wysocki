import { describe, expect, it } from "vitest";

import {
  AppCatalog,
  resolvePortfolioLocation,
} from "@/features/portfolio-navigation";
import { searchSpotlight } from "./search";

describe("Spotlight discovery", () => {
  it("finds the same owned React experience with and without Polish diacritics", () => {
    const withDiacritics = searchSpotlight("doświadczenie React", "pl");
    const withoutDiacritics = searchSpotlight("doswiadczenie React", "pl");

    const squizzuExperience = {
      area: "experience",
      roleId: "squizzu",
    } as const;

    expect(withDiacritics.map((result) => result.location)).toContainEqual(
      squizzuExperience,
    );
    expect(withoutDiacritics).toEqual(withDiacritics);
  });

  it("derives curated empty-query destinations from the App Catalog", () => {
    const results = searchSpotlight("", "en", { limit: 4 });

    expect(results).toHaveLength(4);
    expect(results[0]).toMatchObject({
      title: "Ask Jakub",
      kind: "app",
      location: { area: "ask-jakub" },
    });
    expect(
      results.every(
        (result) => resolvePortfolioLocation(result.location) !== undefined,
      ),
    ).toBe(true);
  });

  it("searches localized App Catalog titles before knowledge matches", () => {
    expect(searchSpotlight("education", "en")[0]).toMatchObject({
      title: "Education",
      kind: "app",
      location: { area: "education" },
    });
  });

  it("finds Ask Jakub through the shared catalogs", () => {
    expect(searchSpotlight("Ask Jakub", "en")[0]).toMatchObject({
      title: "Ask Jakub",
      kind: "app",
      location: { area: "ask-jakub" },
    });
    expect(
      searchSpotlight("portfolio guide", "en").some(
        (result) => result.location.area === "ask-jakub",
      ),
    ).toBe(true);
  });

  it("returns an exact semantic destination only once while keeping the app first", () => {
    const results = searchSpotlight("contact", "en");
    const contactResults = results.filter(
      (result) => result.location.area === "contact",
    );

    expect(contactResults).toHaveLength(1);
    expect(contactResults[0]).toMatchObject({
      kind: "app",
      location: { area: "contact" },
    });
  });

  it("does not turn punctuation-only input into an app match", () => {
    expect(searchSpotlight("???", "en")).toEqual([]);
  });

  it.each([
    ["Mandata", "en", { area: "experience", roleId: "mandata" }],
    [
      "certyfikaty Azure",
      "pl",
      {
        area: "education",
        itemId: "certifications",
      },
    ],
    ["Printly", "en", { area: "studio", projectSlug: "printly" }],
    ["napisz", "pl", { area: "contact" }],
  ] as const)(
    "resolves %s through Portfolio Knowledge to its semantic destination",
    (query, lang, location) => {
      expect(
        searchSpotlight(query, lang).map((result) => result.location),
      ).toContainEqual(location);
    },
  );

  it("searches technology aliases through Portfolio Knowledge", () => {
    expect(
      searchSpotlight("dotnet", "en").some(
        (result) => result.location.area === "experience",
      ),
    ).toBe(true);
  });

  it("keeps every visitor-visible Desktop App backed by a semantic destination", () => {
    const visibleApps = AppCatalog.all().filter((app) => app.visitorVisible);
    const emptyResults = searchSpotlight("", "en", { limit: 12 });

    expect(emptyResults.map((result) => result.id).sort()).toEqual(
      visibleApps.map((app) => `app:${app.id}`).sort(),
    );
    for (const app of visibleApps) {
      expect(
        searchSpotlight(app.title.en, "en").some(
          (result) => result.id === `app:${app.id}`,
        ),
      ).toBe(true);
    }
  });
});
