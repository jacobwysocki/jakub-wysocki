import {
  expandSearchAliases,
  findEvidence,
  normalizeSearchText,
  portfolioKnowledge,
  retrieveKnowledge,
} from "@/features/portfolio-knowledge";
import {
  AppCatalog,
  resolvePortfolioLocation,
  type AppCatalogEntry,
  type AppId,
  type PortfolioLocation,
} from "@/features/portfolio-navigation";
import type { Lang } from "@/lib/lang";
import type {
  SpotlightResult,
  SpotlightResultKind,
  SpotlightSearchOptions,
} from "./contract";

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 12;
const CONTEXT_LIMIT = 160;

function resultKind(location: PortfolioLocation): SpotlightResultKind {
  switch (location.area) {
    case "ask-jakub":
      return "portfolio";
    case "about":
      return "profile";
    case "experience":
      return "experience";
    case "education":
      return "education";
    case "project":
    case "studio":
    case "personal-project":
    case "showcase":
      return "project";
    case "contact":
      return "contact";
    case "portfolio-info":
      return "portfolio";
  }
}

function concise(value: string): string {
  if (value.length <= CONTEXT_LIMIT) return value;
  const shortened = value.slice(0, CONTEXT_LIMIT - 1);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > 80 ? boundary : undefined).trim()}…`;
}

function boundedLimit(value: number | undefined): number {
  return Math.max(1, Math.min(value ?? DEFAULT_LIMIT, MAX_LIMIT));
}

function semanticLocationKey(location: PortfolioLocation): string | undefined {
  const canonical = resolvePortfolioLocation(location)?.launch.selection;
  return canonical ? JSON.stringify(canonical) : undefined;
}

function appRootLocation(location: PortfolioLocation): PortfolioLocation {
  switch (location.area) {
    case "experience":
      return { area: "experience" };
    case "education":
      return { area: "education" };
    case "project":
      return location;
    case "studio":
      return { area: "studio" };
    case "showcase":
      return { area: "showcase", slug: location.slug };
    default:
      return location;
  }
}

function evidenceForApp(appId: AppId) {
  return portfolioKnowledge.evidence.find((evidence) => {
    const resolved = resolvePortfolioLocation(evidence.location);
    return resolved?.launch.appId === appId;
  });
}

function resultForApp(
  app: AppCatalogEntry,
  lang: Lang,
): SpotlightResult | undefined {
  const evidence = evidenceForApp(app.id);
  if (!evidence) return undefined;
  const location = appRootLocation(evidence.location);
  if (!resolvePortfolioLocation(location)) return undefined;

  return {
    id: `app:${app.id}`,
    title: app.title[lang],
    kind: "app",
    context: evidence.label[lang],
    location,
  };
}

function visitorApps(): readonly AppCatalogEntry[] {
  const onDesktop = AppCatalog.on("desktopIcon").filter(
    (app) => app.visitorVisible,
  );
  const placed = new Set(onDesktop.map((app) => app.id));
  return [
    ...onDesktop,
    ...AppCatalog.all().filter(
      (app) => app.visitorVisible && !placed.has(app.id),
    ),
  ];
}

function curatedDestinations(
  lang: Lang,
  limit: number,
): readonly SpotlightResult[] {
  return visitorApps()
    .flatMap((app) => {
      const result = resultForApp(app, lang);
      return result ? [result] : [];
    })
    .slice(0, limit);
}

function matchingApps(query: string, lang: Lang): readonly SpotlightResult[] {
  const expanded = expandSearchAliases(query);
  return visitorApps()
    .map((app, order) => {
      const normalizedTitles = [
        normalizeSearchText(app.title.pl),
        normalizeSearchText(app.title.en),
        normalizeSearchText(app.id),
      ];
      const sourceTokens = new Set(
        normalizedTitles.flatMap((title) => title.split(" ").filter(Boolean)),
      );
      const exact = normalizedTitles.includes(expanded.normalized);
      const phrase = normalizedTitles.some((title) =>
        title.includes(expanded.normalized),
      );
      const overlap = [...expanded.tokens].filter((token) =>
        sourceTokens.has(token),
      ).length;
      const score = exact ? 120 : phrase ? 90 : overlap * 8;
      return { app, order, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.order - right.order)
    .flatMap(({ app }) => {
      const result = resultForApp(app, lang);
      return result ? [result] : [];
    });
}

/**
 * Search the validated Portfolio Knowledge catalog. The result carries only a
 * Portfolio Location; presentation-specific opening remains the Navigator's
 * responsibility.
 */
export function searchSpotlight(
  query: string,
  lang: Lang,
  options: SpotlightSearchOptions = {},
): readonly SpotlightResult[] {
  const limit = boundedLimit(options.limit);
  if (!query.trim()) return curatedDestinations(lang, limit);
  if (!normalizeSearchText(query)) return [];

  const appResults = matchingApps(query, lang);
  const seenEvidence = new Set<string>();
  const results: SpotlightResult[] = [];

  for (const match of retrieveKnowledge(query, lang, {
    limit: MAX_LIMIT,
  })) {
    const evidence = match.entry.evidence
      .map(findEvidence)
      .find(
        (candidate) =>
          candidate !== undefined &&
          resolvePortfolioLocation(candidate.location) !== undefined,
      );
    if (!evidence || seenEvidence.has(evidence.id)) continue;

    seenEvidence.add(evidence.id);
    results.push({
      id: `${match.entry.id}:${evidence.id}`,
      title: evidence.label[lang],
      kind: resultKind(evidence.location),
      context: concise(match.entry.fact[lang]),
      location: evidence.location,
    });
  }

  const seenLocations = new Set<string>();
  return [...appResults, ...results]
    .filter((result) => {
      const locationKey = semanticLocationKey(result.location);
      if (!locationKey || seenLocations.has(locationKey)) return false;
      seenLocations.add(locationKey);
      return true;
    })
    .slice(0, limit);
}
