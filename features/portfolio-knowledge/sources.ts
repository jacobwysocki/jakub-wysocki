/**
 * Explicit ownership for facts that appear in more than one presentation.
 * Mirrors may add presentation detail, but must not redefine the nominated
 * current fact. The catalog imports the canonical module directly.
 */
export const canonicalKnowledgeSources = Object.freeze({
  identityAndPublicContact: "data/site.ts",
  employmentRoles: "data/experience.ts",
  educationAndDissertation: "data/education.ts",
  studioProjects: "data/projects.ts",
  showcaseProducts: "data/showcase.ts",
  personalProjects: "data/personal.ts",
  duplicatedClaims: {
    squizzuCurrentRole: {
      canonical: "data/experience.ts",
      mirrors: ["data/showcase.ts", "data/projects.ts"],
    },
    droneAcademicResearch: {
      canonical: "data/education.ts",
      mirrors: ["data/showcase.ts"],
    },
    studioCaseNarratives: {
      canonical: "data/projects.ts",
      mirrors: ["data/cases.ts"],
    },
    desktopAppCount: {
      canonical: "features/portfolio-navigation/app-catalog.ts",
      mirrors: ["data/personal.ts"],
    },
  },
} as const);
