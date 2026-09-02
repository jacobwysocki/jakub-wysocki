import {
  getRedirectUrl,
  getRewrittenUrl,
  isRewrite,
  unstable_doesMiddlewareMatch,
} from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it } from "vitest";

import { caseStudies } from "@/data/case-studies";
import { config, proxy } from "@/proxy";

const ORIGIN = "https://jakub-wysocki.com";
const originalPrintly = caseStudies.printly;

function request(pathname: string) {
  return new NextRequest(new URL(pathname, ORIGIN));
}

afterEach(() => {
  if (originalPrintly) caseStudies.printly = originalPrintly;
  else delete caseStudies.printly;
});

describe("work route proxy", () => {
  it("matches only one-segment case-study routes", () => {
    expect(
      unstable_doesMiddlewareMatch({ config, url: `${ORIGIN}/work/squizzu` }),
    ).toBe(true);
    expect(
      unstable_doesMiddlewareMatch({ config, url: `${ORIGIN}/work` }),
    ).toBe(false);
    expect(
      unstable_doesMiddlewareMatch({
        config,
        url: `${ORIGIN}/work/squizzu/opengraph-image`,
      }),
    ).toBe(false);
  });

  it("passes a published canonical slug through unchanged", () => {
    const response = proxy(request("/work/squizzu"));

    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(isRewrite(response)).toBe(false);
  });

  it("rewrites unknown and unpublished slugs to the global 404 route", () => {
    delete caseStudies.printly;

    for (const pathname of ["/work/missing", "/work/printly"]) {
      const response = proxy(request(pathname));

      expect(isRewrite(response)).toBe(true);
      expect(getRewrittenUrl(response)).toBe(`${ORIGIN}/__portfolio-not-found`);
    }
  });

  it("redirects the data alias to its canonical case URL", () => {
    const response = proxy(request("/work/ultrastudio-site"));

    expect(response.status).toBe(308);
    expect(getRedirectUrl(response)).toBe(`${ORIGIN}/work/ultra-studio`);
  });
});
