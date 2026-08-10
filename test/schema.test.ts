import { describe, expect, it } from "vitest";

import { education } from "@/data/education";
import { FACTS_UPDATED, SITE_URL, person } from "@/data/site";
import { ID, profilePageGraph, siteGraph } from "@/lib/schema";

/**
 * Filtrowanie po `@type` nie zawęża unii węzłów grafu, a testy poniżej
 * sprawdzają obecność i treść pól, nie ich statyczne typy — stąd worek pól.
 */
function graphNode(type: string): Record<string, unknown> {
  const node = siteGraph()["@graph"].find((n) => n["@type"] === type);
  if (!node) throw new Error(`brak węzła ${type} w grafie`);
  return node as unknown as Record<string, unknown>;
}

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

  // Certyfikaty to jedyne fakty o tej osobie wystawione przez kogoś z zewnątrz.
  // Lista jest wyprowadzona z data/education.ts, więc test pilnuje nie treści,
  // tylko tego, że wyprowadzenie nie zniknie przy kolejnym refaktorze.
  it("carries every certification from the education data", () => {
    const credentials = graphNode("Person").hasCredential as {
      credentialCategory: string;
      name: string;
    }[];
    const certificates = credentials.filter(
      (c) => c.credentialCategory === "certificate",
    );

    expect(credentials.some((c) => c.credentialCategory === "degree")).toBe(
      true,
    );
    expect(certificates.map((c) => c.name)).toEqual(
      education.certifications.map((c) => c.name),
    );
    expect(certificates.every((c) => "recognizedBy" in c)).toBe(true);
  });

  // Węzeł witryny musi mówić, że jest O TEJ osobie. Samo `publisher` znaczy
  // tylko tyle, że osoba ją wydaje — tak samo wyglądałby firmowy blog.
  it("points the website node at the person", () => {
    expect(graphNode("WebSite")).toMatchObject({
      "@id": ID.website,
      about: { "@id": ID.person },
      publisher: { "@id": ID.person },
      copyrightHolder: { "@id": ID.person },
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
        // Referencja do jedynego węzła obrazka, nie powtórzony URL.
        primaryImageOfPage: { "@id": ID.portrait },
        // Utrzymywana ręcznie — `new Date()` twierdziłby po każdym deployu,
        // że fakty o osobie się zmieniły.
        dateModified: FACTS_UPDATED,
      });
    },
  );

  it("describes the portrait as one addressable image node", () => {
    expect(graphNode("Person").image).toMatchObject({
      "@type": "ImageObject",
      "@id": ID.portrait,
      url: `${SITE_URL}${person.portrait}`,
      contentUrl: `${SITE_URL}${person.portrait}`,
      width: person.portraitSize.width,
      height: person.portraitSize.height,
    });
  });
});
