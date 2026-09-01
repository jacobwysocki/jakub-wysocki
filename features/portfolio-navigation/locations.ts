import {
  findCaseStudy,
  parseProjectId,
  type ProjectId,
} from "@/data/case-studies";
import { allRoles } from "@/data/experience";
import { interactiveOs, personalProjects, venor } from "@/data/personal";
import { studioProjects } from "@/data/projects";
import { parseAppId, type AppId } from "./app-catalog";
import type { PortfolioLocation } from "./contract";

export type PortfolioHref = `/#${string}` | `/work/${ProjectId}`;

export type AppLaunchPayload = Readonly<{
  appId: AppId;
  /** Semantic app selection stays in the presentation, not the window store. */
  selection?: PortfolioLocation;
}>;

export type ResolvedPortfolioLocation = Readonly<{
  launch: AppLaunchPayload;
  href: PortfolioHref;
}>;

const EDUCATION_ITEM_IDS = [
  "degree",
  "dissertation",
  "bootcamp",
  "certifications",
  "languages",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function hasOnlyKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).every((key) => keys.includes(key));
}

const optionalString = (
  value: Record<string, unknown>,
  key: string,
): string | undefined | null => {
  const item = value[key];
  if (item === undefined) return undefined;
  return typeof item === "string" && item.length > 0 ? item : null;
};

const withSelection = (
  appId: AppId,
  location: PortfolioLocation,
  href: PortfolioHref,
): ResolvedPortfolioLocation => ({
  launch: { appId, selection: location },
  href,
});

function personalProjectAppId(projectId: string): AppId | undefined {
  if (projectId === interactiveOs.id) return "info";
  if (projectId === venor.id) return "venor";
  return undefined;
}

function publishedProjectHref(value: string): `/work/${ProjectId}` | undefined {
  const projectId = parseProjectId(value);
  if (!projectId) return undefined;

  const study = findCaseStudy(projectId);
  return study?.slug === projectId ? `/work/${projectId}` : undefined;
}

function projectAppId(projectId: ProjectId): AppId {
  switch (projectId) {
    case "squizzu":
      return "site:squizzu";
    case "ultra-studio":
      return "studio";
    case "venor":
      return "venor";
    case "alumed":
      return "project:alumed";
    case "printly":
      return "project:printly";
    case "drone-path":
      return "site:drone-path";
  }
}

function showcaseFallback(slug: string): PortfolioHref | undefined {
  const publishedHref = publishedProjectHref(slug);
  if (publishedHref) return publishedHref;
  if (slug === "squizzu") return "/#studio";
  if (slug === "drone-path") return "/#engineering";
  return undefined;
}

/**
 * Resolve untrusted/generated Portfolio Locations through owned identities.
 * Malformed or stale targets return undefined; no nearby app is substituted.
 */
export function resolvePortfolioLocation(
  value: unknown,
): ResolvedPortfolioLocation | undefined {
  if (!isRecord(value) || typeof value.area !== "string") return undefined;

  switch (value.area) {
    case "ask-jakub": {
      if (!hasOnlyKeys(value, ["area"])) return undefined;
      return withSelection("ask-jakub", { area: "ask-jakub" }, "/#about");
    }

    case "about": {
      if (!hasOnlyKeys(value, ["area"])) return undefined;
      return withSelection("about", { area: "about" }, "/#about");
    }

    case "experience": {
      if (!hasOnlyKeys(value, ["area", "roleId"])) return undefined;
      const roleId = optionalString(value, "roleId");
      if (roleId === null) return undefined;
      if (roleId && !allRoles.some((role) => role.id === roleId)) {
        return undefined;
      }
      const location: PortfolioLocation = roleId
        ? { area: "experience", roleId }
        : { area: "experience" };
      return withSelection("experience", location, "/#engineering");
    }

    case "education": {
      if (!hasOnlyKeys(value, ["area", "itemId"])) return undefined;
      const itemId = optionalString(value, "itemId");
      if (
        itemId === null ||
        (itemId && !(EDUCATION_ITEM_IDS as readonly string[]).includes(itemId))
      ) {
        return undefined;
      }
      const location: PortfolioLocation = itemId
        ? {
            area: "education",
            itemId: itemId as NonNullable<
              Extract<PortfolioLocation, { area: "education" }>["itemId"]
            >,
          }
        : { area: "education" };
      const href =
        itemId === "certifications" || itemId === "languages"
          ? "/#extras"
          : "/#engineering";
      return withSelection("education", location, href);
    }

    case "project": {
      if (!hasOnlyKeys(value, ["area", "projectId"])) return undefined;
      const rawProjectId = optionalString(value, "projectId");
      if (!rawProjectId) return undefined;

      const projectId = parseProjectId(rawProjectId);
      const href = projectId ? publishedProjectHref(projectId) : undefined;
      if (!projectId || !href) return undefined;

      const location: PortfolioLocation = { area: "project", projectId };
      return withSelection(projectAppId(projectId), location, href);
    }

    case "studio": {
      if (!hasOnlyKeys(value, ["area", "projectSlug"])) return undefined;
      const projectSlug = optionalString(value, "projectSlug");
      if (
        projectSlug === null ||
        (projectSlug &&
          !studioProjects.some((project) => project.slug === projectSlug))
      ) {
        return undefined;
      }
      const location: PortfolioLocation = projectSlug
        ? { area: "studio", projectSlug }
        : { area: "studio" };
      const href = projectSlug
        ? (publishedProjectHref(projectSlug) ?? "/#studio")
        : "/#studio";
      return withSelection("studio", location, href);
    }

    case "personal-project": {
      if (!hasOnlyKeys(value, ["area", "projectId"])) return undefined;
      const projectId = optionalString(value, "projectId");
      if (
        !projectId ||
        !personalProjects.some((project) => project.id === projectId)
      ) {
        return undefined;
      }
      const appId = personalProjectAppId(projectId);
      if (!appId) return undefined;
      const href =
        projectId === venor.id
          ? (publishedProjectHref(projectId) ?? "/#personal-projects")
          : "/#personal-projects";
      return withSelection(
        appId,
        { area: "personal-project", projectId },
        href,
      );
    }

    case "showcase": {
      if (!hasOnlyKeys(value, ["area", "slug", "view"])) return undefined;
      const slug = optionalString(value, "slug");
      const view = value.view;
      if (
        !slug ||
        (view !== undefined && view !== "overview" && view !== "live")
      ) {
        return undefined;
      }
      const appId = parseAppId(`site:${slug}`);
      if (!appId || !appId.startsWith("site:")) return undefined;
      const href = showcaseFallback(slug);
      if (!href) return undefined;
      const location: PortfolioLocation =
        view === undefined
          ? { area: "showcase", slug }
          : { area: "showcase", slug, view };
      return withSelection(appId, location, href);
    }

    case "contact": {
      if (!hasOnlyKeys(value, ["area"])) return undefined;
      return withSelection("contact", { area: "contact" }, "/#contact");
    }

    case "portfolio-info": {
      if (!hasOnlyKeys(value, ["area"])) return undefined;
      return withSelection(
        "info",
        { area: "portfolio-info" },
        "/#personal-projects",
      );
    }

    default:
      return undefined;
  }
}

/** Encode a validated semantic location to its canonical Simple Mode href. */
export function encodePortfolioLocation(
  value: unknown,
): PortfolioHref | undefined {
  return resolvePortfolioLocation(value)?.href;
}

/**
 * Decode a case-study pathname to its canonical semantic location.
 * Root fragments are intentionally not decoded: several semantic locations
 * share each legacy section anchor, so the pathname alone cannot recover one.
 */
export function decodePortfolioPathname(
  value: unknown,
): PortfolioLocation | undefined {
  if (typeof value !== "string") return undefined;

  const match = /^\/work\/([^/]+)$/.exec(value);
  if (!match) return undefined;

  let rawProjectId: string;
  try {
    rawProjectId = decodeURIComponent(match[1]);
  } catch {
    return undefined;
  }

  const projectId = parseProjectId(rawProjectId);
  if (!projectId || !publishedProjectHref(projectId)) return undefined;
  return { area: "project", projectId };
}
