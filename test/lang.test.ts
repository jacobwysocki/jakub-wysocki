import { describe, expect, it } from "vitest";

import { isWordSuffix, normalizeLang } from "@/lib/lang";

describe("normalizeLang", () => {
  it.each(["pl", "PL", "pl-PL", " pl-pl "])("selects Polish for %s", (tag) => {
    expect(normalizeLang(tag)).toBe("pl");
  });

  it.each([undefined, null, "", "en", "en-GB", "es", "x-pl"])(
    "uses English as the safe fallback for %s",
    (tag) => {
      expect(normalizeLang(tag)).toBe("en");
    },
  );
});

describe("isWordSuffix", () => {
  it("distinguishes localized words from abbreviated metrics", () => {
    expect(isWordSuffix("years")).toBe(true);
    expect(isWordSuffix(" lat ")).toBe(true);
    expect(isWordSuffix("h")).toBe(false);
    expect(isWordSuffix("k+")).toBe(false);
    expect(isWordSuffix("+")).toBe(false);
  });
});
