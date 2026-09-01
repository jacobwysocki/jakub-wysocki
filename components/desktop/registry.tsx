"use client";

import type { ComponentType, ReactNode } from "react";
import dynamic from "next/dynamic";
import type { LucideIcon } from "lucide-react";
import {
  AtSign,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Info,
  MessageCircleMore,
  NotebookText,
} from "lucide-react";
import { PrintlyMark, UltraStudioLogo, VenorMark } from "@/components/logos";
import { caseStudies, type ProjectId } from "@/data/case-studies";
import { showcase, type ShowcaseSite } from "@/data/showcase";
import {
  AppCatalog,
  parseAppId,
  type AppCatalogEntry,
  type AppCatalogSurface,
  type AppId,
  type StaticAppId,
} from "@/features/portfolio-navigation/app-catalog";
import { SITE_GLYPHS } from "./siteGlyphs";
import AboutApp from "./apps/AboutApp";
import AskJakubApp from "./apps/AskJakubApp";
import ContactApp from "./apps/ContactApp";
import EducationApp from "./apps/EducationApp";
import ExperienceApp from "./apps/ExperienceApp";
import InfoApp from "./apps/InfoApp";
import SiteApp from "./apps/SiteApp";
import StudioApp from "./apps/StudioApp";
import VenorApp from "./apps/VenorApp";

type ClientAppAdapter = Readonly<{
  tile: Readonly<{ bg: string; glyph: ReactNode }>;
  Content: ComponentType;
}>;

export type AppConfig = AppCatalogEntry & ClientAppAdapter;

const glyph = (Icon: LucideIcon, color = "#FFFFFF") => (
  <Icon
    aria-hidden
    strokeWidth={2}
    className="h-[52%] w-[52%] drop-shadow-sm"
    style={{ color }}
  />
);

/** Shared dark tile treatment for client-only visual adapters. */
const darkTile = (tint?: string) =>
  tint
    ? `radial-gradient(130% 130% at 82% -8%, ${tint} 0%, rgba(0,0,0,0) 62%), linear-gradient(160deg, #2C2C2E 0%, #17171A 100%)`
    : "linear-gradient(160deg, #3A3A3C 0%, #17171A 100%)";

const staticAdapters = {
  "ask-jakub": {
    tile: {
      bg: darkTile("rgba(255,106,61,0.48)"),
      glyph: glyph(MessageCircleMore, "#FFB39A"),
    },
    Content: AskJakubApp,
  },
  studio: {
    tile: {
      bg: "linear-gradient(145deg, #0A0A0C 0%, #1D1D1F 45%, #C2410C 130%)",
      glyph: <UltraStudioLogo className="h-[34%] w-[66%] drop-shadow-sm" />,
    },
    Content: StudioApp,
  },
  venor: {
    tile: {
      // Prawdziwy znak marki na jej ciemnym polu (Night Mulberry),
      // nie zastępczy radar sprzed brandingu.
      bg: darkTile("rgba(138,40,83,0.55)"),
      glyph: (
        <VenorMark
          onDark
          className="h-[58%] w-[58%] text-[#FCFAFB] drop-shadow-sm"
        />
      ),
    },
    Content: VenorApp,
  },
  experience: {
    tile: {
      bg: darkTile("rgba(191,90,242,0.38)"),
      glyph: glyph(Briefcase, "#D8A5F5"),
    },
    Content: ExperienceApp,
  },
  education: {
    tile: {
      bg: darkTile("rgba(255,159,10,0.35)"),
      glyph: glyph(GraduationCap, "#FFC26B"),
    },
    Content: EducationApp,
  },
  about: {
    tile: {
      bg: darkTile("rgba(255,214,10,0.3)"),
      glyph: glyph(NotebookText, "#FFE38A"),
    },
    Content: AboutApp,
  },
  contact: {
    tile: {
      bg: darkTile("rgba(48,209,88,0.35)"),
      glyph: glyph(AtSign, "#7CE3A0"),
    },
    Content: ContactApp,
  },
  info: {
    tile: {
      bg: darkTile(),
      glyph: glyph(Info),
    },
    Content: InfoApp,
  },
} satisfies Record<StaticAppId, ClientAppAdapter>;

/**
 * Korpus case study ładuje się dopiero przy pierwszym otwarciu okna:
 * rejestr importuje wszystkie aplikacje statycznie, więc bez tej granicy
 * każdy wizytujący pulpit pobierałby też rekordy i layout case'ów.
 */
const LazyCaseStudyApp = dynamic(
  () => import("@/components/case-study/CaseStudyApp"),
);

/** Znak kafelka dla aplikacji case study; kolor tła niesie tożsamość marki. */
const PROJECT_GLYPHS: Partial<Record<ProjectId, ReactNode>> = {
  alumed: glyph(HeartPulse),
  // Prawdziwy logotyp klienta zamiast zastępczej drukarki z lucide.
  printly: (
    <PrintlyMark className="h-[46%] w-[46%] text-white drop-shadow-sm" />
  ),
};

function projectAdapter(projectId: ProjectId): ClientAppAdapter {
  const study = caseStudies[projectId];
  if (!study) {
    throw new Error(`Missing case study for Desktop App: project:${projectId}`);
  }
  return {
    tile: {
      bg: study.gradient,
      glyph: PROJECT_GLYPHS[projectId] ?? glyph(NotebookText),
    },
    Content: function CaseStudyWindow() {
      return <LazyCaseStudyApp projectId={projectId} />;
    },
  };
}

function showcaseAdapter(site: ShowcaseSite): ClientAppAdapter {
  return {
    tile: {
      bg:
        site.slug === "squizzu"
          ? site.gradient
          : darkTile("rgba(255,55,95,0.4)"),
      glyph: SITE_GLYPHS[site.slug] ?? glyph(NotebookText),
    },
    Content: function SiteWindow() {
      return <SiteApp site={site} />;
    },
  };
}

function adapterFor(entry: AppCatalogEntry): ClientAppAdapter {
  if (entry.id.startsWith("project:")) {
    return projectAdapter(entry.id.slice("project:".length) as ProjectId);
  }
  if (!entry.id.startsWith("site:")) {
    return staticAdapters[entry.id as StaticAppId];
  }
  const slug = entry.id.slice("site:".length);
  const site = showcase.find((candidate) => candidate.slug === slug);
  if (!site) throw new Error(`Missing visual adapter for ${entry.id}`);
  return showcaseAdapter(site);
}

export const APPS: readonly AppConfig[] = AppCatalog.all().map((entry) => ({
  ...entry,
  ...adapterFor(entry),
}));

const appById = new Map(APPS.map((app) => [app.id, app]));

/** Strict lookup for a previously validated AppId. Never substitutes an app. */
export function getApp(id: AppId): AppConfig {
  const app = appById.get(id);
  if (!app) throw new Error(`Unknown Desktop App: ${id}`);
  return app;
}

/** Strict boundary lookup for external or generated values. */
export function findApp(value: unknown): AppConfig | undefined {
  const id = parseAppId(value);
  return id ? appById.get(id) : undefined;
}

export function getAppsFor(surface: AppCatalogSurface): readonly AppConfig[] {
  return AppCatalog.on(surface).map((entry) => getApp(entry.id));
}

/** Square app tile (squircle + highlight). */
export function AppTile({
  appId,
  className = "",
}: {
  appId: AppId;
  className?: string;
}) {
  const app = getApp(appId);
  return (
    <span
      aria-hidden
      className={`relative flex items-center justify-center overflow-hidden rounded-[24%] ${className}`}
      style={{ background: app.tile.bg }}
    >
      {app.tile.glyph}
      <span className="pointer-events-none absolute inset-0 rounded-[24%] ring-1 ring-inset ring-white/20" />
    </span>
  );
}
