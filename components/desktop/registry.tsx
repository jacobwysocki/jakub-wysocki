"use client";

import type { LucideIcon } from "lucide-react";
import { AtSign, Briefcase, GraduationCap, Info, NotebookText, Radar } from "lucide-react";
import type { L10n } from "@/lib/lang-store";
import { showcase, type ShowcaseSite } from "@/data/showcase";
import { UltraStudioLogo } from "@/components/logos";
import { SITE_GLYPHS } from "./siteGlyphs";
import AboutApp from "./apps/AboutApp";
import StudioApp from "./apps/StudioApp";
import ExperienceApp from "./apps/ExperienceApp";
import EducationApp from "./apps/EducationApp";
import ContactApp from "./apps/ContactApp";
import InfoApp from "./apps/InfoApp";
import SiteApp from "./apps/SiteApp";
import VenorApp from "./apps/VenorApp";

export type AppConfig = {
  id: string;
  title: L10n;
  /** Domyślny rozmiar okna (przycinany do obszaru pulpitu) */
  size: { w: number; h: number };
  tile: { bg: string; glyph: React.ReactNode };
  Content: React.ComponentType;
  dock: boolean;
  desktopIcon: boolean;
  /**
   * false = aplikacja zarządza własnym scrollem/układem pełnej wysokości
   * (iframe'y, sidebar) — rama okna nie może wtedy scrollować treści,
   * bo fokus w cross-origin iframe przewijałby pasek narzędzi poza widok.
   */
  scroll?: boolean;
};

/** Nazwa identyczna w obu językach (marki, nazwy własne) */
const same = (name: string): L10n => ({ pl: name, en: name });

const glyph = (Icon: LucideIcon, color = "#FFFFFF") => (
  <Icon
    aria-hidden
    strokeWidth={2}
    className="h-[52%] w-[52%] drop-shadow-sm"
    style={{ color }}
  />
);

/**
 * Kafelek w stylu ikon macOS dark mode: wspólna ciemna baza + delikatna
 * poświata w kolorze aplikacji (glif w tym samym odcieniu). Brandowe
 * wyjątki (Ultra Studio, Squizzu) zachowują własne tła.
 */
const darkTile = (tint?: string) =>
  tint
    ? `radial-gradient(130% 130% at 82% -8%, ${tint} 0%, rgba(0,0,0,0) 62%), linear-gradient(160deg, #2C2C2E 0%, #17171A 100%)`
    : "linear-gradient(160deg, #3A3A3C 0%, #17171A 100%)";

/**
 * Żywe strony (data/showcase.ts) jako aplikacje-okna: zakładka Przegląd
 * (opis + technologie) i podgląd na żywo w skalowanym iframe. Duże okno,
 * żeby strona renderowała się w układzie desktopowym.
 */
const siteApp = (site: ShowcaseSite): AppConfig => ({
  id: `site:${site.slug}`,
  title: same(site.name),
  size: site.slug === "squizzu" ? { w: 980, h: 700 } : { w: 1200, h: 780 },
  tile: {
    bg: site.slug === "squizzu" ? site.gradient : darkTile("rgba(255,55,95,0.4)"),
    glyph: SITE_GLYPHS[site.slug] ?? glyph(NotebookText),
  },
  Content: function SiteWindow() {
    return <SiteApp site={site} />;
  },
  dock: true,
  desktopIcon: true,
  scroll: false,
});

export const APPS: AppConfig[] = [
  {
    id: "studio",
    title: same("Ultra Studio"),
    size: { w: 980, h: 700 },
    tile: {
      bg: "linear-gradient(145deg, #0A0A0C 0%, #1D1D1F 45%, #C2410C 130%)",
      glyph: <UltraStudioLogo className="h-[34%] w-[66%] drop-shadow-sm" />,
    },
    Content: StudioApp,
    dock: true,
    desktopIcon: true,
    scroll: false,
  },
  ...showcase.map(siteApp),
  {
    // Tint sygnałowy, nieużywany przez żaden inny kafelek: wermilion nosi już
    // Ultra Studio, a dwie bliźniacze płytki obok siebie w docku źle się skanuje.
    id: "venor",
    title: same("Venor"),
    size: { w: 880, h: 720 },
    tile: {
      bg: darkTile("rgba(50,199,222,0.36)"),
      glyph: glyph(Radar, "#8FE0EE"),
    },
    Content: VenorApp,
    dock: true,
    desktopIcon: true,
  },
  {
    id: "experience",
    title: { pl: "Doświadczenie", en: "Experience" },
    size: { w: 880, h: 640 },
    tile: {
      bg: darkTile("rgba(191,90,242,0.38)"),
      glyph: glyph(Briefcase, "#D8A5F5"),
    },
    Content: ExperienceApp,
    dock: true,
    desktopIcon: true,
    scroll: false,
  },
  {
    id: "education",
    title: { pl: "Edukacja", en: "Education" },
    size: { w: 760, h: 700 },
    tile: {
      bg: darkTile("rgba(255,159,10,0.35)"),
      glyph: glyph(GraduationCap, "#FFC26B"),
    },
    Content: EducationApp,
    dock: true,
    desktopIcon: true,
  },
  {
    id: "about",
    title: { pl: "O mnie", en: "About Me" },
    size: { w: 640, h: 720 },
    tile: {
      bg: darkTile("rgba(255,214,10,0.3)"),
      glyph: glyph(NotebookText, "#FFE38A"),
    },
    Content: AboutApp,
    dock: true,
    desktopIcon: true,
  },
  {
    id: "contact",
    title: { pl: "Kontakt", en: "Contact" },
    size: { w: 480, h: 580 },
    tile: {
      bg: darkTile("rgba(48,209,88,0.35)"),
      glyph: glyph(AtSign, "#7CE3A0"),
    },
    Content: ContactApp,
    dock: true,
    desktopIcon: true,
  },
  {
    id: "info",
    title: { pl: "O tym portfolio", en: "About This Portfolio" },
    size: { w: 460, h: 640 },
    tile: {
      bg: darkTile(),
      glyph: glyph(Info),
    },
    Content: InfoApp,
    dock: false,
    desktopIcon: false,
  },
];

export function getApp(id: string): AppConfig {
  // Nieznane id nie powinno się zdarzyć — bezpieczny fallback na pierwszą
  return APPS.find((app) => app.id === id) ?? APPS[0];
}

/** Kwadratowa "płytka" ikony aplikacji (squircle + połysk). */
export function AppTile({
  appId,
  className = "",
}: {
  appId: string;
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
