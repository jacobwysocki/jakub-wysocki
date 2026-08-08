/**
 * A presentation-independent address for a meaningful place in the portfolio.
 *
 * Keep this module free of React, browser APIs, and client-only data so the
 * same contract can be used by knowledge, server, and navigation code.
 */
export type PortfolioLocation =
  | { area: "ask-jakub" }
  | { area: "about" }
  | { area: "experience"; roleId?: string }
  | {
      area: "education";
      itemId?:
        "degree" | "dissertation" | "bootcamp" | "certifications" | "languages";
    }
  | { area: "studio"; projectSlug?: string }
  | { area: "personal-project"; projectId: string }
  | { area: "showcase"; slug: string; view?: "overview" | "live" }
  | { area: "contact" }
  | { area: "portfolio-info" };
