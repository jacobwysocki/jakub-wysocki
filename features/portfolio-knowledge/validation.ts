import { allRoles } from "@/data/experience";
import { education } from "@/data/education";
import { ultraCase } from "@/data/cases";
import { interactiveOs, personalProjects } from "@/data/personal";
import { featuredProject, studioProjects } from "@/data/projects";
import { showcase } from "@/data/showcase";
import { contactInfo, entityProfiles } from "@/data/site";
import { PUBLIC_DESKTOP_APP_COUNT } from "@/features/portfolio-navigation/app-catalog";
import { resolvePortfolioLocation } from "@/features/portfolio-navigation/locations";
import type { L10n } from "@/lib/lang";
import { portfolioKnowledge } from "./catalog";
import type { EvidenceId, PortfolioKnowledgeCatalog } from "./contract";
import { canonicalKnowledgeSources } from "./sources";

export type KnowledgeValidationCode =
  | "duplicate-id"
  | "invalid-id"
  | "missing-language"
  | "missing-topics"
  | "missing-evidence"
  | "stale-evidence"
  | "invalid-location"
  | "stale-href"
  | "orphan-suggestion"
  | "missing-coverage"
  | "contradictory-fact"
  | "volatile-count"
  | "forbidden-value";

export type KnowledgeValidationIssue = Readonly<{
  code: KnowledgeValidationCode;
  path: string;
  message: string;
}>;

export type VolatileCountClaim = Readonly<{
  id: `volatile:${string}`;
  sourceCount: number;
  copy: L10n;
}>;

type NominatedTextConsistencyClaim = Readonly<{
  id: `claim:${string}`;
  canonicalSource: string;
  mirrorSource: string;
  canonical: L10n;
  mirror: L10n;
  comparison: "equal" | "contains";
}>;

type NominatedTermConsistencyClaim = Readonly<{
  id: `claim:${string}`;
  canonicalSource: string;
  mirrorSource: string;
  /** Canonical domain terms that every localized mirror must retain. */
  canonicalTerms: readonly string[];
  mirror: L10n;
  comparison: "contains-all-terms";
}>;

export type NominatedConsistencyClaim =
  NominatedTextConsistencyClaim | NominatedTermConsistencyClaim;

const desktopCountKnowledge = portfolioKnowledge.entries.find(
  (entry) => entry.id === "knowledge:portfolio:desktop-app-count",
);

if (!desktopCountKnowledge) {
  throw new Error("Missing canonical Desktop App count Knowledge Entry");
}

export const volatileCountClaims: readonly VolatileCountClaim[] = [
  {
    id: "volatile:interactive-os-apps",
    sourceCount: PUBLIC_DESKTOP_APP_COUNT,
    copy: interactiveOs.highlights[2],
  },
  {
    id: "volatile:portfolio-knowledge-apps",
    sourceCount: PUBLIC_DESKTOP_APP_COUNT,
    copy: desktopCountKnowledge.fact,
  },
];

const squizzuRole = allRoles.find((role) => role.id === "squizzu");
const squizzuShowcase = showcase.find((site) => site.slug === "squizzu");
const droneShowcase = showcase.find((site) => site.slug === "drone-path");
if (!squizzuRole || !squizzuShowcase || !droneShowcase) {
  throw new Error(
    "Missing nominated sources required for consistency validation",
  );
}

export const nominatedConsistencyClaims: readonly NominatedConsistencyClaim[] =
  [
    {
      id: "claim:squizzu-current-role",
      canonicalSource:
        canonicalKnowledgeSources.duplicatedClaims.squizzuCurrentRole.canonical,
      mirrorSource:
        canonicalKnowledgeSources.duplicatedClaims.squizzuCurrentRole
          .mirrors[0],
      canonical: squizzuRole.role,
      mirror: squizzuShowcase.overview.role,
      comparison: "contains",
    },
    {
      id: "claim:drone-academic-research",
      canonicalSource:
        canonicalKnowledgeSources.duplicatedClaims.droneAcademicResearch
          .canonical,
      mirrorSource:
        canonicalKnowledgeSources.duplicatedClaims.droneAcademicResearch
          .mirrors[0],
      canonicalTerms: education.dissertation.algorithms,
      mirror: droneShowcase.overview.how,
      comparison: "contains-all-terms",
    },
    {
      id: "claim:studio-case-narrative",
      canonicalSource:
        canonicalKnowledgeSources.duplicatedClaims.studioCaseNarratives
          .canonical,
      mirrorSource:
        canonicalKnowledgeSources.duplicatedClaims.studioCaseNarratives
          .mirrors[0],
      canonical: featuredProject.steps[0].text,
      mirror: ultraCase.steps[0].text,
      comparison: "equal",
    },
  ];

export type KnowledgeValidationOptions = Readonly<{
  volatileCounts?: readonly VolatileCountClaim[];
  consistencyClaims?: readonly NominatedConsistencyClaim[];
  forbiddenValues?: readonly string[];
}>;

const nonEmpty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

function validateL10n(
  value: L10n,
  path: string,
  issues: KnowledgeValidationIssue[],
) {
  for (const lang of ["pl", "en"] as const) {
    if (!nonEmpty(value[lang])) {
      issues.push({
        code: "missing-language",
        path: `${path}.${lang}`,
        message: `Missing ${lang.toUpperCase()} content`,
      });
    }
  }
}

function findDuplicateIds(
  values: readonly Readonly<{ id: string }>[],
  path: string,
  issues: KnowledgeValidationIssue[],
) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value.id)) {
      issues.push({
        code: "duplicate-id",
        path: `${path}.${value.id}`,
        message: `Duplicate ID: ${value.id}`,
      });
    }
    seen.add(value.id);
  }
}

function requiredEvidenceIds(): readonly EvidenceId[] {
  return [
    "evidence:about",
    ...allRoles.map((role) => `evidence:experience:${role.id}` as const),
    "evidence:education:degree",
    "evidence:education:dissertation",
    "evidence:education:bootcamp",
    "evidence:education:certifications",
    "evidence:education:languages",
    ...studioProjects.map(
      (project) => `evidence:studio:${project.slug}` as const,
    ),
    ...personalProjects.map(
      (project) => `evidence:personal-project:${project.id}` as const,
    ),
    ...showcase.flatMap((site) => [
      `evidence:showcase:${site.slug}:overview` as const,
      `evidence:showcase:${site.slug}:live` as const,
    ]),
    "evidence:contact",
    "evidence:portfolio-info",
  ];
}

function requiredContactEntryIds(): readonly string[] {
  return [
    "knowledge:contact:email:primary",
    "knowledge:contact:email:studio",
    "knowledge:contact:location",
    ...entityProfiles.map(
      (profile) =>
        `knowledge:contact:profile:${profile.label
          .toLowerCase()
          .replaceAll(" ", "-")}`,
    ),
  ];
}

function validateCoverage(
  catalog: PortfolioKnowledgeCatalog,
  issues: KnowledgeValidationIssue[],
) {
  const evidenceUsed = new Set(
    catalog.entries.flatMap((entry) => entry.evidence),
  );
  for (const evidenceId of requiredEvidenceIds()) {
    if (!evidenceUsed.has(evidenceId)) {
      issues.push({
        code: "missing-coverage",
        path: `evidence.${evidenceId}`,
        message: `No Knowledge Entry covers ${evidenceId}`,
      });
    }
  }

  const entryIds = new Set(catalog.entries.map((entry) => entry.id));
  for (const entryId of requiredContactEntryIds()) {
    if (!entryIds.has(entryId as `knowledge:${string}`)) {
      issues.push({
        code: "missing-coverage",
        path: `entries.${entryId}`,
        message: `Missing public contact or identity surface: ${entryId}`,
      });
    }
  }
}

function validateVolatileCounts(
  claims: readonly VolatileCountClaim[],
  issues: KnowledgeValidationIssue[],
) {
  for (const claim of claims) {
    for (const lang of ["pl", "en"] as const) {
      const numericClaims = claim.copy[lang].match(/\d+/g)?.map(Number) ?? [];
      if (!numericClaims.includes(claim.sourceCount)) {
        issues.push({
          code: "volatile-count",
          path: `${claim.id}.${lang}`,
          message: `Copy does not contain source count ${claim.sourceCount}`,
        });
      }
    }
  }
}

const normalizeClaim = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

function validateConsistencyClaims(
  claims: readonly NominatedConsistencyClaim[],
  issues: KnowledgeValidationIssue[],
) {
  for (const claim of claims) {
    for (const lang of ["pl", "en"] as const) {
      const mirror = normalizeClaim(claim.mirror[lang]);
      const consistent =
        claim.comparison === "contains-all-terms"
          ? claim.canonicalTerms.length > 0 &&
            claim.canonicalTerms.every((term) => {
              const canonicalTerm = normalizeClaim(term);
              return Boolean(canonicalTerm) && mirror.includes(canonicalTerm);
            })
          : (() => {
              const canonical = normalizeClaim(claim.canonical[lang]);
              return (
                Boolean(canonical) &&
                (claim.comparison === "equal"
                  ? mirror === canonical
                  : mirror.includes(canonical))
              );
            })();
      if (!mirror || !consistent) {
        issues.push({
          code: "contradictory-fact",
          path: `${claim.id}.${lang}`,
          message: `${claim.mirrorSource} contradicts canonical ${claim.canonicalSource}`,
        });
      }
    }
  }
}

/** Validate the complete knowledge/evidence graph before it reaches retrieval. */
export function validatePortfolioKnowledge(
  catalog: PortfolioKnowledgeCatalog = portfolioKnowledge,
  options: KnowledgeValidationOptions = {},
): readonly KnowledgeValidationIssue[] {
  const issues: KnowledgeValidationIssue[] = [];
  const evidenceById = new Map(catalog.evidence.map((link) => [link.id, link]));
  const entryById = new Map(catalog.entries.map((entry) => [entry.id, entry]));

  findDuplicateIds(catalog.entries, "entries", issues);
  findDuplicateIds(catalog.evidence, "evidence", issues);
  findDuplicateIds(catalog.suggestions, "suggestions", issues);

  for (const entry of catalog.entries) {
    if (!entry.id.startsWith("knowledge:")) {
      issues.push({
        code: "invalid-id",
        path: `entries.${entry.id}`,
        message: "Knowledge ID must start with knowledge:",
      });
    }
    validateL10n(entry.fact, `entries.${entry.id}.fact`, issues);
    for (const lang of ["pl", "en"] as const) {
      if (
        entry.keywords[lang].length === 0 ||
        entry.keywords[lang].some((keyword) => !nonEmpty(keyword))
      ) {
        issues.push({
          code: "missing-language",
          path: `entries.${entry.id}.keywords.${lang}`,
          message: `Missing usable ${lang.toUpperCase()} retrieval keywords`,
        });
      }
    }
    if (entry.topics.length === 0) {
      issues.push({
        code: "missing-topics",
        path: `entries.${entry.id}.topics`,
        message: "Knowledge Entry must have at least one topic",
      });
    }
    if (entry.evidence.length === 0) {
      issues.push({
        code: "missing-evidence",
        path: `entries.${entry.id}.evidence`,
        message: "Knowledge Entry must have at least one Evidence Link",
      });
    }
    for (const evidenceId of entry.evidence) {
      if (!evidenceById.has(evidenceId)) {
        issues.push({
          code: "stale-evidence",
          path: `entries.${entry.id}.evidence.${evidenceId}`,
          message: `Unknown Evidence ID: ${evidenceId}`,
        });
      }
    }
  }

  for (const evidence of catalog.evidence) {
    if (!evidence.id.startsWith("evidence:")) {
      issues.push({
        code: "invalid-id",
        path: `evidence.${evidence.id}`,
        message: "Evidence ID must start with evidence:",
      });
    }
    validateL10n(evidence.label, `evidence.${evidence.id}.label`, issues);
    const resolved = resolvePortfolioLocation(evidence.location);
    if (!resolved) {
      issues.push({
        code: "invalid-location",
        path: `evidence.${evidence.id}.location`,
        message: "Evidence has an unknown or malformed Portfolio Location",
      });
    } else if (resolved.href !== evidence.href) {
      issues.push({
        code: "stale-href",
        path: `evidence.${evidence.id}.href`,
        message: `Expected ${resolved.href}, received ${evidence.href}`,
      });
    }
  }

  for (const suggestion of catalog.suggestions) {
    if (!suggestion.id.startsWith("suggestion:")) {
      issues.push({
        code: "invalid-id",
        path: `suggestions.${suggestion.id}`,
        message: "Suggestion ID must start with suggestion:",
      });
    }
    validateL10n(
      suggestion.question,
      `suggestions.${suggestion.id}.question`,
      issues,
    );
    if (suggestion.topics.length === 0) {
      issues.push({
        code: "missing-topics",
        path: `suggestions.${suggestion.id}.topics`,
        message: "Suggested Question must have at least one topic",
      });
    }
    if (
      suggestion.knowledge.length === 0 ||
      suggestion.knowledge.some((id) => !entryById.has(id))
    ) {
      issues.push({
        code: "orphan-suggestion",
        path: `suggestions.${suggestion.id}.knowledge`,
        message:
          "Suggested Question must map only to existing Knowledge Entries",
      });
    }
  }

  validateCoverage(catalog, issues);
  validateVolatileCounts(options.volatileCounts ?? volatileCountClaims, issues);
  validateConsistencyClaims(
    options.consistencyClaims ?? nominatedConsistencyClaims,
    issues,
  );

  const serializedCatalog = JSON.stringify(catalog);
  const forbiddenValues = [
    contactInfo.email,
    contactInfo.emailAlt,
    ...(options.forbiddenValues ?? []),
  ].filter(nonEmpty);
  for (const value of forbiddenValues) {
    if (serializedCatalog.includes(value)) {
      issues.push({
        code: "forbidden-value",
        path: "catalog",
        message: "A forbidden contact or environment value entered the catalog",
      });
    }
  }

  return issues;
}

export function assertValidPortfolioKnowledge(
  catalog: PortfolioKnowledgeCatalog = portfolioKnowledge,
  options: KnowledgeValidationOptions = {},
): void {
  const issues = validatePortfolioKnowledge(catalog, options);
  if (issues.length === 0) return;
  const detail = issues
    .map((issue) => `${issue.code} at ${issue.path}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid Portfolio Knowledge:\n${detail}`);
}
