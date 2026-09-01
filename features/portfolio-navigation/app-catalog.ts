import {
  caseStudies,
  parseProjectId,
  type ProjectId,
} from "@/data/case-studies";
import { showcase } from "@/data/showcase";
import type { L10n } from "@/lib/lang";

export const STATIC_APP_IDS = [
  "ask-jakub",
  "studio",
  "venor",
  "experience",
  "education",
  "about",
  "contact",
  "info",
] as const;

export type StaticAppId = (typeof STATIC_APP_IDS)[number];
export type ShowcaseAppId = `site:${string}`;
export type ProjectAppId = `project:${ProjectId}`;
export type AppId = StaticAppId | ShowcaseAppId | ProjectAppId;

/**
 * Projekty z własną aplikacją case study. Squizzu, Ultra Studio, Venor i
 * Drone Simulation mają już okna (site:…, studio, venor), więc rejestrujemy
 * tylko brakujące; nowy wpis wolno dodać wyłącznie dla opublikowanego
 * rekordu w data/case-studies.ts.
 */
const PROJECT_APP_PROJECTS = [
  "alumed",
  "printly",
] as const satisfies readonly ProjectId[];

export type AppCatalogSurface =
  "desktopIcon" | "desktopDock" | "mobileGrid" | "mobileDock";

export type AppCatalogEntry = Readonly<{
  id: AppId;
  title: L10n;
  size: Readonly<{ w: number; h: number }>;
  placement: Readonly<Record<AppCatalogSurface, number | null>>;
  /** true when the window/sheet frame owns vertical scrolling. */
  scroll: boolean;
  /** Hidden system utilities such as Info are excluded from public app counts. */
  visitorVisible: boolean;
}>;

const same = (name: string): L10n => ({ pl: name, en: name });

const placedEverywhere = (order: number) => ({
  desktopIcon: order,
  desktopDock: order,
  mobileGrid: order,
  mobileDock: null,
});

function isShowcaseSlug(value: string): boolean {
  return showcase.some((site) => site.slug === value);
}

function showcaseId(slug: string): ShowcaseAppId {
  if (!isShowcaseSlug(slug)) {
    throw new Error(`Unknown showcase slug in App Catalog: ${slug}`);
  }
  return `site:${slug}`;
}

const showcaseEntries: readonly AppCatalogEntry[] = showcase.map(
  (site, index) => ({
    id: showcaseId(site.slug),
    title: same(site.name),
    size: site.slug === "squizzu" ? { w: 980, h: 700 } : { w: 1200, h: 780 },
    placement: placedEverywhere(20 + index * 10),
    scroll: false,
    visitorVisible: true,
  }),
);

const afterShowcaseOrder = 20 + showcaseEntries.length * 10;

/**
 * Case studies bez własnego okna dostają je tutaj. Ikona i siatka mobilna —
 * tak, dock — nie: dock zostaje kuratorowany, żeby nie urósł ponad szerokość,
 * którą desktop-layout uznaje za rozsądną.
 */
const projectEntries: readonly AppCatalogEntry[] = PROJECT_APP_PROJECTS.map(
  (projectId, index) => {
    const study = caseStudies[projectId];
    if (!study) {
      throw new Error(`Unpublished case study in App Catalog: ${projectId}`);
    }
    return {
      id: `project:${projectId}` as ProjectAppId,
      title: same(study.client),
      size: { w: 880, h: 720 },
      placement: {
        desktopIcon: afterShowcaseOrder + 1 + index,
        desktopDock: null,
        mobileGrid: afterShowcaseOrder + 1 + index,
        mobileDock: null,
      },
      scroll: true,
      visitorVisible: true,
    };
  },
);

const catalogEntries: readonly AppCatalogEntry[] = [
  {
    id: "ask-jakub",
    title: { pl: "Zapytaj o Jakuba", en: "Ask Jakub" },
    size: { w: 720, h: 720 },
    placement: {
      desktopIcon: 0,
      desktopDock: 0,
      mobileGrid: 0,
      mobileDock: 0,
    },
    scroll: false,
    visitorVisible: true,
  },
  {
    id: "studio",
    title: same("Ultra Studio"),
    size: { w: 980, h: 700 },
    placement: {
      ...placedEverywhere(10),
      mobileDock: 30,
    },
    scroll: false,
    visitorVisible: true,
  },
  ...showcaseEntries,
  {
    id: "venor",
    title: same("Venor"),
    size: { w: 880, h: 720 },
    placement: placedEverywhere(afterShowcaseOrder),
    scroll: true,
    visitorVisible: true,
  },
  ...projectEntries,
  {
    id: "experience",
    title: { pl: "Doświadczenie", en: "Experience" },
    size: { w: 880, h: 640 },
    placement: {
      ...placedEverywhere(afterShowcaseOrder + 10),
      mobileDock: 20,
    },
    scroll: false,
    visitorVisible: true,
  },
  {
    id: "education",
    title: { pl: "Edukacja", en: "Education" },
    size: { w: 760, h: 700 },
    placement: placedEverywhere(afterShowcaseOrder + 20),
    scroll: true,
    visitorVisible: true,
  },
  {
    id: "about",
    title: { pl: "O mnie", en: "About Me" },
    size: { w: 640, h: 720 },
    placement: {
      ...placedEverywhere(afterShowcaseOrder + 30),
      mobileDock: 10,
    },
    scroll: true,
    visitorVisible: true,
  },
  {
    id: "contact",
    title: { pl: "Kontakt", en: "Contact" },
    size: { w: 480, h: 580 },
    placement: {
      ...placedEverywhere(afterShowcaseOrder + 40),
      mobileDock: 40,
    },
    scroll: true,
    visitorVisible: true,
  },
  {
    id: "info",
    title: { pl: "O tym portfolio", en: "About This Portfolio" },
    size: { w: 460, h: 640 },
    placement: {
      desktopIcon: null,
      desktopDock: null,
      mobileGrid: null,
      mobileDock: null,
    },
    scroll: true,
    visitorVisible: false,
  },
];

const appById = new Map(catalogEntries.map((entry) => [entry.id, entry]));

export type AppCatalog = Readonly<{
  all(): readonly AppCatalogEntry[];
  find(value: unknown): AppCatalogEntry | undefined;
  on(surface: AppCatalogSurface): readonly AppCatalogEntry[];
}>;

/** The server-safe App Catalog Interface. */
export const AppCatalog: AppCatalog = Object.freeze({
  all(): readonly AppCatalogEntry[] {
    return catalogEntries;
  },

  find(value: unknown): AppCatalogEntry | undefined {
    const id = parseAppId(value);
    return id ? appById.get(id) : undefined;
  },

  on(surface: AppCatalogSurface): readonly AppCatalogEntry[] {
    return [...catalogEntries]
      .filter((entry) => entry.placement[surface] !== null)
      .sort(
        (left, right) =>
          (left.placement[surface] ?? 0) - (right.placement[surface] ?? 0),
      );
  },
});

/** Parse external or generated identity; unknown values fail closed. */
export function parseAppId(value: unknown): AppId | undefined {
  if (typeof value !== "string") return undefined;
  if ((STATIC_APP_IDS as readonly string[]).includes(value)) {
    return value as StaticAppId;
  }
  if (value.startsWith("project:")) {
    const projectId = parseProjectId(value.slice("project:".length));
    if (
      projectId &&
      (PROJECT_APP_PROJECTS as readonly ProjectId[]).includes(projectId)
    ) {
      return `project:${projectId}`;
    }
    return undefined;
  }
  if (!value.startsWith("site:")) return undefined;
  const slug = value.slice("site:".length);
  return isShowcaseSlug(slug) ? `site:${slug}` : undefined;
}

export const PUBLIC_DESKTOP_APP_COUNT = catalogEntries.filter(
  (entry) => entry.visitorVisible,
).length;
