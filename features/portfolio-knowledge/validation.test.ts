import { describe, expect, it } from "vitest";
import { PUBLIC_DESKTOP_APP_COUNT } from "@/features/portfolio-navigation/app-catalog";
import type { PortfolioKnowledgeCatalog } from "./contract";
import { portfolioKnowledge } from "./catalog";
import {
  nominatedConsistencyClaims,
  validatePortfolioKnowledge,
} from "./validation";

const issueCodes = (catalog: PortfolioKnowledgeCatalog) =>
  validatePortfolioKnowledge(catalog).map((issue) => issue.code);

describe("Portfolio Knowledge validation failures", () => {
  it("rejects duplicate IDs", () => {
    const catalog = {
      ...portfolioKnowledge,
      entries: [...portfolioKnowledge.entries, portfolioKnowledge.entries[0]],
    } as PortfolioKnowledgeCatalog;

    expect(issueCodes(catalog)).toContain("duplicate-id");
  });

  it("rejects a missing language", () => {
    const first = portfolioKnowledge.entries[0];
    const catalog: PortfolioKnowledgeCatalog = {
      ...portfolioKnowledge,
      entries: [
        { ...first, fact: { ...first.fact, en: "" } },
        ...portfolioKnowledge.entries.slice(1),
      ],
    };

    expect(issueCodes(catalog)).toContain("missing-language");
  });

  it("rejects stale evidence references", () => {
    const first = portfolioKnowledge.entries[0];
    const catalog: PortfolioKnowledgeCatalog = {
      ...portfolioKnowledge,
      entries: [
        { ...first, evidence: ["evidence:removed"] },
        ...portfolioKnowledge.entries.slice(1),
      ],
    };

    expect(issueCodes(catalog)).toContain("stale-evidence");
  });

  it("rejects an unscoped or orphaned Suggested Question", () => {
    const first = portfolioKnowledge.suggestions[0];
    const catalog: PortfolioKnowledgeCatalog = {
      ...portfolioKnowledge,
      suggestions: [
        {
          ...first,
          topics: [],
          knowledge: ["knowledge:removed"],
        },
        ...portfolioKnowledge.suggestions.slice(1),
      ],
    };

    expect(issueCodes(catalog)).toContain("missing-topics");
    expect(issueCodes(catalog)).toContain("orphan-suggestion");
  });

  it("rejects unknown Portfolio Locations", () => {
    const first = portfolioKnowledge.evidence[0];
    const catalog = {
      ...portfolioKnowledge,
      evidence: [
        {
          ...first,
          location: { area: "experience", roleId: "removed-role" },
        },
        ...portfolioKnowledge.evidence.slice(1),
      ],
    } as PortfolioKnowledgeCatalog;

    expect(issueCodes(catalog)).toContain("invalid-location");
  });

  it("rejects stale handwritten fallback destinations", () => {
    const first = portfolioKnowledge.evidence[0];
    const catalog: PortfolioKnowledgeCatalog = {
      ...portfolioKnowledge,
      evidence: [
        { ...first, href: "/#contact" },
        ...portfolioKnowledge.evidence.slice(1),
      ],
    };

    expect(issueCodes(catalog)).toContain("stale-href");
  });

  it("rejects volatile count drift", () => {
    const issues = validatePortfolioKnowledge(portfolioKnowledge, {
      volatileCounts: [
        {
          id: "volatile:test-app-count",
          sourceCount: PUBLIC_DESKTOP_APP_COUNT,
          copy: {
            pl: `${PUBLIC_DESKTOP_APP_COUNT - 1} wbudowanych aplikacji`,
            en: `${PUBLIC_DESKTOP_APP_COUNT - 1} built-in apps`,
          },
        },
      ],
    });

    expect(issues.map((issue) => issue.code)).toContain("volatile-count");
  });

  it("rejects a mirror that contradicts its nominated canonical source", () => {
    const issues = validatePortfolioKnowledge(portfolioKnowledge, {
      consistencyClaims: [
        {
          id: "claim:test-current-role",
          canonicalSource: "data/experience.ts",
          mirrorSource: "data/showcase.ts",
          canonical: {
            pl: "Co-Founder & Full-Stack Engineer",
            en: "Co-Founder & Full-Stack Engineer",
          },
          mirror: {
            pl: "Wyłącznie projektant",
            en: "Designer only",
          },
          comparison: "contains",
        },
      ],
    });

    expect(issues.map((issue) => issue.code)).toContain("contradictory-fact");
  });

  it("nominates every duplicated narrative source family", () => {
    expect(nominatedConsistencyClaims.map((claim) => claim.id)).toEqual([
      "claim:squizzu-current-role",
      "claim:drone-academic-research",
      "claim:studio-case-narrative",
    ]);
  });

  it("rejects research mirrors that omit canonical algorithm terms", () => {
    const issues = validatePortfolioKnowledge(portfolioKnowledge, {
      consistencyClaims: [
        {
          id: "claim:test-drone-research",
          canonicalSource: "data/education.ts",
          mirrorSource: "data/showcase.ts",
          canonicalTerms: ["K-Means", "Cooperative A*"],
          mirror: {
            pl: "Ogólny projekt bez nazw algorytmów.",
            en: "A generic project without named algorithms.",
          },
          comparison: "contains-all-terms",
        },
      ],
    });

    expect(issues.map((issue) => issue.code)).toContain("contradictory-fact");
  });

  it("detects a hidden environment or contact sentinel", () => {
    const sentinel = "PRIVATE_CONTACT_SENTINEL_3f044e";
    const first = portfolioKnowledge.entries[0];
    const catalog: PortfolioKnowledgeCatalog = {
      ...portfolioKnowledge,
      entries: [
        { ...first, fact: { ...first.fact, en: sentinel } },
        ...portfolioKnowledge.entries.slice(1),
      ],
    };
    const issues = validatePortfolioKnowledge(catalog, {
      forbiddenValues: [sentinel],
    });

    expect(issues.map((issue) => issue.code)).toContain("forbidden-value");
  });
});
