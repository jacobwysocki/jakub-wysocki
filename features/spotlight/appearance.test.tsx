import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DesktopProvider,
  type DesktopApi,
} from "@/components/desktop/DesktopContext";
import {
  spotlightAppearance,
  spotlightDialogVariables,
  spotlightTriggerVariables,
  type SpotlightColor,
  type SpotlightColorLayer,
} from "./appearance";
import Spotlight from "./Spotlight";

const desktopApi: DesktopApi = {
  openApp: vi.fn(),
  openLocation: () => ({ opened: false, reason: "invalid-location" }),
  selectionFor: () => undefined,
  switchToSimple: vi.fn(),
};

function renderSpotlight() {
  return render(
    <DesktopProvider value={desktopApi}>
      <Spotlight variant="desktop" />
    </DesktopProvider>,
  );
}

function linearChannel(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function luminance(color: SpotlightColor): number {
  return (
    0.2126 * linearChannel(color[0]) +
    0.7152 * linearChannel(color[1]) +
    0.0722 * linearChannel(color[2])
  );
}

function contrast(first: SpotlightColor, second: SpotlightColor): number {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function composite(
  foreground: SpotlightColor,
  opacity: number,
  background: SpotlightColor,
): SpotlightColor {
  return [
    foreground[0] * opacity + background[0] * (1 - opacity),
    foreground[1] * opacity + background[1] * (1 - opacity),
    foreground[2] * opacity + background[2] * (1 - opacity),
  ];
}

function layerColor(
  layer: SpotlightColorLayer,
  background: SpotlightColor,
): SpotlightColor {
  return composite(layer.color, layer.opacity, background);
}

function dualToneBoundaryFloor(
  first: SpotlightColor,
  second: SpotlightColor,
): number {
  // If the surroundings sit between both luminances, one of the adjacent
  // tones still contrasts by at least the square root of their mutual ratio.
  return Math.sqrt(contrast(first, second));
}

function backdropSamples(): readonly SpotlightColor[] {
  const channels = [0, 51, 102, 153, 204, 255];
  return channels.flatMap((red) =>
    channels.flatMap((green) =>
      channels.map((blue) => [red, green, blue] as const),
    ),
  );
}

describe("Spotlight appearance contract", () => {
  afterEach(cleanup);

  it("binds the measured appearance tokens to the rendered surfaces", () => {
    const view = renderSpotlight();
    const trigger = view.getByRole("button", { name: "Szukaj w portfolio" });

    for (const [property, value] of Object.entries(spotlightTriggerVariables)) {
      expect(trigger.style.getPropertyValue(property)).toBe(value);
    }
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = view.getByRole("dialog", {
      name: "Wyszukiwanie portfolio",
    });
    for (const [property, value] of Object.entries(spotlightDialogVariables)) {
      expect(dialog.style.getPropertyValue(property)).toBe(value);
    }
  });

  it("keeps trigger text and every two-tone boundary above AA", () => {
    const { trigger } = spotlightAppearance;

    for (const state of [trigger.rest, trigger.hoverAndOpen, trigger.active]) {
      expect(contrast(state.foreground, state.surface)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(
        contrast(
          composite(state.foreground, trigger.shortcutOpacity, state.surface),
          state.surface,
        ),
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        dualToneBoundaryFloor(state.surface, state.boundary),
      ).toBeGreaterThanOrEqual(3);
    }
    expect(trigger.focusIndicator.width).toBeGreaterThanOrEqual(2);
    expect(
      dualToneBoundaryFloor(
        trigger.focusIndicator.inner,
        trigger.focusIndicator.outer,
      ),
    ).toBeGreaterThanOrEqual(3);
  });

  it("keeps dialog copy, selection, and empty-state boundaries above AA on any backdrop", () => {
    const { dialog } = spotlightAppearance;

    for (const backdrop of backdropSamples()) {
      const surface = layerColor(dialog.surface, backdrop);
      const secondary = layerColor(dialog.secondary, surface);
      const emptyBoundary = layerColor(dialog.emptyBoundary, surface);

      expect(contrast(dialog.foreground, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(secondary, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(dialog.accent, surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(emptyBoundary, surface)).toBeGreaterThanOrEqual(3);
      expect(
        contrast(dialog.selection.boundary, surface),
      ).toBeGreaterThanOrEqual(3);
      expect(
        dualToneBoundaryFloor(surface, dialog.boundary),
      ).toBeGreaterThanOrEqual(3);
    }

    expect(
      contrast(dialog.accentForeground, dialog.accent),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(dialog.foreground, dialog.selection.surface),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(
        layerColor(dialog.secondary, dialog.selection.surface),
        dialog.selection.surface,
      ),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(dialog.selection.boundary, dialog.selection.surface),
    ).toBeGreaterThanOrEqual(3);
    expect(dialog.selection.boundaryWidth).toBeGreaterThanOrEqual(2);
  });
});
