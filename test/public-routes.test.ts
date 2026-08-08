import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { SITE_URL, person } from "@/data/site";

describe("public discovery routes", () => {
  it("allows crawling and advertises the canonical sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });

  it("lists the canonical portfolio and both localized profile pages", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual([
      SITE_URL,
      `${SITE_URL}${person.entityHome.en}`,
      `${SITE_URL}${person.entityHome.pl}`,
    ]);
    expect(new Set(urls).size).toBe(entries.length);
    expect(
      entries
        .slice(1)
        .every((entry) => entry.alternates?.languages?.["x-default"]),
    ).toBe(true);
  });
});
