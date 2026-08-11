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
import { portfolioKnowledge } from "./catalog";

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

  it("retrieves database evidence for a Polish inflected question", () => {
    const actual = retrieveKnowledge("Bazodanowymi kompetencjami?", "pl", {
      limit: 6,
    }).map((match) => match.entry.id);

    expect(actual).toContain(
      "knowledge:role:mandata:highlight:database-migration",
    );
  });

  it.each([
    {
      question: "Jakie pasje ma Jakbub?",
      lang: "pl" as const,
      expected: ["knowledge:profile:passions"],
    },
    {
      question: "What are Jakub's passions?",
      lang: "en" as const,
      expected: ["knowledge:profile:passions"],
    },
    {
      question: "Czym obecnie zajmuje się Jakub?",
      lang: "pl" as const,
      expected: ["knowledge:profile:current-work"],
    },
    {
      question: "What is Jakub currently working on?",
      lang: "en" as const,
      expected: ["knowledge:profile:current-work"],
    },
    {
      question: "Czym jest Venor?",
      lang: "pl" as const,
      expected: ["knowledge:personal-project:venor:summary"],
    },
    {
      question: "What is Venor?",
      lang: "en" as const,
      expected: ["knowledge:personal-project:venor:summary"],
    },
    {
      question: "Czym jest Squizzu?",
      lang: "pl" as const,
      expected: ["knowledge:showcase:squizzu:what"],
    },
    {
      question: "What is Squizzu?",
      lang: "en" as const,
      expected: ["knowledge:showcase:squizzu:what"],
    },
    {
      question: "Co oferuje Ultra Studio?",
      lang: "pl" as const,
      expected: ["knowledge:role:ultrastudio:summary"],
    },
    {
      question: "What does Ultra Studio offer?",
      lang: "en" as const,
      expected: ["knowledge:role:ultrastudio:summary"],
    },
  ])("retrieves owned facts for: $question", ({ question, lang, expected }) => {
    const actual = retrieveKnowledge(question, lang, { limit: 6 }).map(
      (match) => match.entry.id,
    );

    for (const knowledgeId of expected) {
      expect(actual).toContain(knowledgeId);
    }
  });

  it.each(["pl", "en"] as const)(
    "retrieves mapped facts for every %s Suggested Question",
    (lang) => {
      const misses = portfolioKnowledge.suggestions.flatMap((suggestion) => {
        const retrieved = retrieveKnowledge(suggestion.question[lang], lang, {
          limit: RETRIEVAL_FIXTURE_LIMIT,
        }).map((match) => match.entry.id);
        const actual = new Set(retrieved);
        return suggestion.knowledge.some((id) => actual.has(id))
          ? []
          : [`${suggestion.id}: ${retrieved.join(", ")}`];
      });

      expect(misses).toEqual([]);
    },
  );

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
