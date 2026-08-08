import { describe, expect, it } from "vitest";

import { SITE_URL, person } from "@/data/site";
import { ID, profilePageGraph, siteGraph } from "@/lib/schema";

describe("structured data", () => {
  it("uses stable, canonical identifiers", () => {
    expect(ID.person).toBe(`${SITE_URL}/#person`);
    expect(ID.website).toBe(`${SITE_URL}/#website`);
    expect(ID.profilePage).toBe(
      `${SITE_URL}${person.entityHome.en}#profilepage`,
    );
  });

  it("publishes one person node from the site graph", () => {
    const graph = siteGraph()["@graph"];
    const people = graph.filter((node) => node["@type"] === "Person");

    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({
      "@id": ID.person,
      name: person.fullName,
      sameAs: expect.arrayContaining([expect.stringMatching(/^https:\/\//)]),
    });
  });

  it.each([
    ["en", "en-GB"],
    ["pl", "pl-PL"],
  ] as const)(
    "links the %s profile page to the shared person",
    (lang, locale) => {
      const [profile] = profilePageGraph(lang)["@graph"];

      expect(profile).toMatchObject({
        "@type": "ProfilePage",
        inLanguage: locale,
        mainEntity: { "@id": ID.person },
      });
    },
  );
});
