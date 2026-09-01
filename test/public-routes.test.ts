import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { PROJECT_IDS, findCaseStudy } from "@/data/case-studies";
import { FACTS_UPDATED, SITE_URL, person } from "@/data/site";

describe("public discovery routes", () => {
  it("allows crawling everything except the API and advertises the sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/api/"] },
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });

  // /api/phone serves the phone number as JSON, which is the whole reason it
  // is a route and not static output. Nothing links to it, so the rule is
  // precaution — but a regression here would quietly undo that decision.
  it("keeps the API routes out of the crawl", () => {
    const { rules } = robots();

    expect(Array.isArray(rules) ? rules[0].disallow : rules.disallow).toContain(
      "/api/",
    );
  });

  // The route is static, so `new Date()` here would freeze build time into
  // every entry and claim all three pages changed on every deploy.
  it("stamps lastmod with the maintained fact date, not build time", () => {
    for (const entry of sitemap()) {
      expect(entry.lastModified).toBe(FACTS_UPDATED);
    }
  });

  it("lists the canonical portfolio, profiles, and published case studies", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    const publishedCaseUrls = PROJECT_IDS.filter((projectId) =>
      findCaseStudy(projectId),
    ).map((projectId) => `${SITE_URL}/work/${projectId}`);

    expect(urls).toEqual([
      SITE_URL,
      `${SITE_URL}${person.entityHome.en}`,
      `${SITE_URL}${person.entityHome.pl}`,
      // Indeks case studies poprzedza pojedyncze realizacje.
      `${SITE_URL}/work`,
      ...publishedCaseUrls,
    ]);
    expect(new Set(urls).size).toBe(entries.length);
    expect(
      entries
        .slice(1, 3)
        .every((entry) => entry.alternates?.languages?.["x-default"]),
    ).toBe(true);
    expect(
      entries.slice(3).every((entry) => entry.alternates === undefined),
    ).toBe(true);
  });
});
