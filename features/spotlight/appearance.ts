import type { CSSProperties } from "react";

export type SpotlightColor = readonly [
  red: number,
  green: number,
  blue: number,
];

export type SpotlightColorLayer = Readonly<{
  color: SpotlightColor;
  opacity: number;
}>;

const ink = [29, 29, 31] as const;
const white = [255, 255, 255] as const;

export const spotlightAppearance = {
  trigger: {
    rest: {
      surface: ink,
      foreground: white,
      boundary: white,
    },
    hoverAndOpen: {
      surface: white,
      foreground: ink,
      boundary: ink,
    },
    active: {
      surface: [210, 210, 215] as const,
      foreground: ink,
      boundary: ink,
    },
    shortcutOpacity: 0.7,
    focusIndicator: {
      inner: ink,
      outer: white,
      width: 2,
    },
  },
  dialog: {
    surface: {
      color: [245, 245, 247] as const,
      opacity: 0.98,
    },
    boundary: ink,
    foreground: ink,
    secondary: {
      color: ink,
      opacity: 0.7,
    },
    accent: [194, 65, 12] as const,
    accentForeground: white,
    selection: {
      surface: white,
      boundary: ink,
      boundaryWidth: 2,
    },
    emptyBoundary: {
      color: ink,
      opacity: 0.6,
    },
  },
} as const;

type SpotlightCssProperties = CSSProperties &
  Record<`--spotlight-${string}`, string>;

function cssColor(color: SpotlightColor, opacity = 1): string {
  const channels = color.join(" ");
  return opacity === 1 ? `rgb(${channels})` : `rgb(${channels} / ${opacity})`;
}

export const spotlightTriggerVariables: SpotlightCssProperties = {
  "--spotlight-trigger-rest-surface": cssColor(
    spotlightAppearance.trigger.rest.surface,
  ),
  "--spotlight-trigger-rest-foreground": cssColor(
    spotlightAppearance.trigger.rest.foreground,
  ),
  "--spotlight-trigger-rest-boundary": cssColor(
    spotlightAppearance.trigger.rest.boundary,
  ),
  "--spotlight-trigger-hover-surface": cssColor(
    spotlightAppearance.trigger.hoverAndOpen.surface,
  ),
  "--spotlight-trigger-hover-foreground": cssColor(
    spotlightAppearance.trigger.hoverAndOpen.foreground,
  ),
  "--spotlight-trigger-hover-boundary": cssColor(
    spotlightAppearance.trigger.hoverAndOpen.boundary,
  ),
  "--spotlight-trigger-active-surface": cssColor(
    spotlightAppearance.trigger.active.surface,
  ),
  "--spotlight-trigger-active-foreground": cssColor(
    spotlightAppearance.trigger.active.foreground,
  ),
  "--spotlight-trigger-active-boundary": cssColor(
    spotlightAppearance.trigger.active.boundary,
  ),
  "--spotlight-trigger-focus-inner": cssColor(
    spotlightAppearance.trigger.focusIndicator.inner,
  ),
  "--spotlight-trigger-focus-outer": cssColor(
    spotlightAppearance.trigger.focusIndicator.outer,
  ),
};

export const spotlightDialogVariables: SpotlightCssProperties = {
  "--spotlight-dialog-surface": cssColor(
    spotlightAppearance.dialog.surface.color,
    spotlightAppearance.dialog.surface.opacity,
  ),
  "--spotlight-dialog-boundary": cssColor(spotlightAppearance.dialog.boundary),
  "--spotlight-dialog-foreground": cssColor(
    spotlightAppearance.dialog.foreground,
  ),
  "--spotlight-dialog-secondary": cssColor(
    spotlightAppearance.dialog.secondary.color,
    spotlightAppearance.dialog.secondary.opacity,
  ),
  "--spotlight-dialog-accent": cssColor(spotlightAppearance.dialog.accent),
  "--spotlight-dialog-accent-foreground": cssColor(
    spotlightAppearance.dialog.accentForeground,
  ),
  "--spotlight-dialog-selection-surface": cssColor(
    spotlightAppearance.dialog.selection.surface,
  ),
  "--spotlight-dialog-selection-boundary": cssColor(
    spotlightAppearance.dialog.selection.boundary,
  ),
  "--spotlight-dialog-empty-boundary": cssColor(
    spotlightAppearance.dialog.emptyBoundary.color,
    spotlightAppearance.dialog.emptyBoundary.opacity,
  ),
};
