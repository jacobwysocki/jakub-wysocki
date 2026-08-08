import { describe, expect, it } from "vitest";
import {
  RETRIEVAL_FIXTURE_LIMIT,
  RETRIEVAL_RECALL_TARGET,
  retrievalFixtures,
} from "./__fixtures__/retrieval";
import {
  expandSearchAliases,
  normalizeSearchText,
  retrieveKnowledge,
} from "./retrieval";

describe("Portfolio Knowledge retrieval", () => {
  it("normalizes casing, punctuation, and Polish diacritics", () => {
    expect(normalizeSearchText("  ŁÓDŹ, Kraków — DRONÓW! ")).toBe(
      "lodz krakow dronow",
    );
  });

  it("expands curated bilingual aliases and topics", () => {
    const query = expandSearchAliases(
      "Szukam full-stack i sztucznej inteligencji",
    );

    expect(query.tokens).toContain("frontend");
    expect(query.tokens).toContain("backend");
    expect(query.tokens).toContain("gpt");
    expect(query.topics).toContain("hiring");
    expect(query.topics).toContain("ai");
  });

  it("is deterministic, bounded, and fails empty input closed", () => {
    const first = retrieveKnowledge("React product design", "en", {
      limit: 3,
    });
    const second = retrieveKnowledge("React product design", "en", {
      limit: 3,
    });

    expect(first).toEqual(second);
    expect(first).toHaveLength(3);
    expect(retrieveKnowledge("   ", "pl")).toEqual([]);
    expect(retrieveKnowledge("React", "en", { limit: 100 })).toHaveLength(10);
  });

  it(`meets the ${(RETRIEVAL_RECALL_TARGET * 100).toFixed(0)}% bilingual recall contract`, () => {
    const misses: string[] = [];

    for (const fixture of retrievalFixtures) {
      const actual = retrieveKnowledge(fixture.question, fixture.lang, {
        limit: RETRIEVAL_FIXTURE_LIMIT,
      }).map((match) => match.entry.id);
      if (!fixture.expectedAny.some((id) => actual.includes(id))) {
        misses.push(`${fixture.name}: ${actual.join(", ")}`);
      }
    }

    const recall =
      (retrievalFixtures.length - misses.length) / retrievalFixtures.length;
    expect(misses.length, misses.join("\n")).toBeLessThanOrEqual(
      Math.floor(retrievalFixtures.length * (1 - RETRIEVAL_RECALL_TARGET)),
    );
    expect(recall).toBeGreaterThanOrEqual(RETRIEVAL_RECALL_TARGET);
  });
});
