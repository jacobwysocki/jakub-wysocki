import type { PortfolioLocation } from "@/features/portfolio-navigation";

export type SpotlightResultKind =
  | "app"
  | "profile"
  | "experience"
  | "education"
  | "project"
  | "contact"
  | "portfolio";

/** A localized, presentation-independent discovery result. */
export type SpotlightResult = Readonly<{
  id: string;
  title: string;
  kind: SpotlightResultKind;
  context: string;
  location: PortfolioLocation;
}>;

export type SpotlightSearchOptions = Readonly<{
  limit?: number;
}>;
