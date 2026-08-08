import { afterEach, describe, expect, it, vi } from "vitest";
import { hobbies } from "@/data/education";
import { allRoles } from "@/data/experience";
import { personalProjects } from "@/data/personal";
import { studioProjects } from "@/data/projects";
import { showcase } from "@/data/showcase";
import { contactInfo, entityProfiles } from "@/data/site";
import { PUBLIC_DESKTOP_APP_COUNT } from "@/features/portfolio-navigation/app-catalog";
import { resolvePortfolioLocation } from "@/features/portfolio-navigation/locations";
import {
  findEvidence,
  findSuggestedQuestion,
  portfolioKnowledge,
  validatePortfolioKnowledge,
} from "./index";

describe("Portfolio Knowledge catalog", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is valid as shipped", () => {
    expect(validatePortfolioKnowledge()).toEqual([]);
  });

  it("covers every canonical public collection", () => {
    const usedEvidence = new Set(
      portfolioKnowledge.entries.flatMap((entry) => entry.evidence),
    );

    for (const role of allRoles) {
      expect(usedEvidence).toContain(`evidence:experience:${role.id}`);
    }
    for (const project of studioProjects) {
      expect(usedEvidence).toContain(`evidence:studio:${project.slug}`);
    }
    for (const project of personalProjects) {
      expect(usedEvidence).toContain(`evidence:personal-project:${project.id}`);
    }
    for (const site of showcase) {
      expect(usedEvidence).toContain(`evidence:showcase:${site.slug}:overview`);
      expect(usedEvidence).toContain(`evidence:showcase:${site.slug}:live`);
    }

    const entryIds = new Set(
      portfolioKnowledge.entries.map((entry) => entry.id),
    );
    for (const profile of entityProfiles) {
      expect(entryIds).toContain(
        `knowledge:contact:profile:${profile.label
          .toLowerCase()
          .replaceAll(" ", "-")}`,
      );
    }
  });

  it("derives every fallback href from the Portfolio Location resolver", () => {
    for (const evidence of portfolioKnowledge.evidence) {
      expect(resolvePortfolioLocation(evidence.location)?.href).toBe(
        evidence.href,
      );
    }
  });

  it("keeps direct contact values, phone, and environment sentinels out", async () => {
    const environmentSentinel = "PRIVATE_ENV_SENTINEL_92beaf";
    const phoneSentinel = "+48-SECRET-CONTACT-PHONE";
    vi.stubEnv("CONTACT_PHONE", phoneSentinel);
    vi.stubEnv("PRIVATE_PORTFOLIO_SENTINEL", environmentSentinel);
    vi.resetModules();
    const isolatedCatalog = (await import("./catalog")).portfolioKnowledge;
    const serialized = JSON.stringify(isolatedCatalog);

    expect(serialized).not.toContain(contactInfo.email);
    expect(serialized).not.toContain(contactInfo.emailAlt);
    expect(serialized).not.toContain(environmentSentinel);
    expect(serialized).not.toContain(phoneSentinel);
    expect(serialized).not.toContain("CONTACT_PHONE");
    expect(
      validatePortfolioKnowledge(isolatedCatalog, {
        forbiddenValues: [environmentSentinel, phoneSentinel],
      }),
    ).toEqual([]);
  });

  it("uses the App Catalog as the only Desktop App count source", () => {
    const countEntry = portfolioKnowledge.entries.find(
      (entry) => entry.id === "knowledge:portfolio:desktop-app-count",
    );
    expect(countEntry?.fact.pl).toContain(String(PUBLIC_DESKTOP_APP_COUNT));
    expect(countEntry?.fact.en).toContain(String(PUBLIC_DESKTOP_APP_COUNT));
  });

  it("describes Ask Jakub as a grounded guide with an owned destination", () => {
    const evidence = findEvidence("evidence:ask-jakub");
    const entry = portfolioKnowledge.entries.find(
      (candidate) => candidate.id === "knowledge:portfolio:ask-jakub",
    );

    expect(evidence).toMatchObject({
      location: { area: "ask-jakub" },
      href: "/#about",
    });
    expect(entry?.fact.en).toContain("grounded portfolio guide");
    expect(entry?.fact.pl).toContain("przewodnik po portfolio");
    expect(entry?.evidence).toContain("evidence:ask-jakub");
  });

  it("prioritizes the four questions visitors most need first", () => {
    expect(portfolioKnowledge.suggestions).toHaveLength(5);
    expect(
      portfolioKnowledge.suggestions.slice(0, 4).map((suggestion) => ({
        id: suggestion.id,
        pl: suggestion.question.pl,
        en: suggestion.question.en,
      })),
    ).toEqual([
      {
        id: "suggestion:current-work",
        pl: "Czym obecnie zajmuje się Jakub?",
        en: "What is Jakub currently working on?",
      },
      {
        id: "suggestion:venor",
        pl: "Czym jest Venor?",
        en: "What is Venor?",
      },
      {
        id: "suggestion:squizzu",
        pl: "Czym jest Squizzu?",
        en: "What is Squizzu?",
      },
      {
        id: "suggestion:ultra-studio",
        pl: "Co oferuje Ultra Studio?",
        en: "What does Ultra Studio offer?",
      },
    ]);
  });

  it("derives Jakub's public passions from canonical profile data", () => {
    const entry = portfolioKnowledge.entries.find(
      (candidate) => candidate.id === "knowledge:profile:passions",
    );

    for (const hobby of hobbies) {
      expect(entry?.fact.pl).toContain(hobby.title.pl);
      expect(entry?.fact.pl).toContain(hobby.text.pl);
      expect(entry?.fact.en).toContain(hobby.title.en);
      expect(entry?.fact.en).toContain(hobby.text.en);
    }
    expect(entry?.evidence).toEqual(["evidence:about"]);
  });

  it("fails closed for unknown generated IDs", () => {
    expect(findEvidence("evidence:missing")).toBeUndefined();
    expect(findEvidence({ id: "evidence:about" })).toBeUndefined();
    expect(findSuggestedQuestion("suggestion:missing")).toBeUndefined();
  });
});
