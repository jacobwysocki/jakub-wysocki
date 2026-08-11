import { describe, expect, it } from "vitest";

import {
  ASK_JAKUB_WIDGET_RIGHT,
  DESKTOP_DOCK_HEIGHT,
  DESKTOP_DOCK_MAX_VISUAL_RISE,
  DESKTOP_LAYOUT,
  DESKTOP_WORK_AREA,
  getDesktopDockWidth,
} from "@/components/desktop/desktop-layout";
import { AppCatalog } from "@/features/portfolio-navigation/app-catalog";

type Rect = Readonly<{
  left: number;
  right: number;
  top: number;
  bottom: number;
}>;

const VIEWPORT_HEIGHT = 900;
const VIEWPORT_WIDTHS = [900, 1280, 1440, 1920, 2560] as const;
const MAX_PROVEN_VIEWPORT_WIDTH = 5120;

function intersects(left: Rect, right: Rect): boolean {
  return (
    left.left < right.right &&
    left.right > right.left &&
    left.top < right.bottom &&
    left.bottom > right.top
  );
}

function defaultDesktopBoxes(viewportWidth: number) {
  const dockWidth = getDesktopDockWidth(AppCatalog.on("desktopDock").length);
  const widgetTop = DESKTOP_WORK_AREA.top;
  const widgetBottom =
    VIEWPORT_HEIGHT - DESKTOP_WORK_AREA.bottom - DESKTOP_LAYOUT.edgeInset;
  const askRight = viewportWidth - ASK_JAKUB_WIDGET_RIGHT;

  return {
    askJakub: {
      left: askRight - DESKTOP_LAYOUT.askJakubWidget.width,
      right: askRight,
      top: widgetTop,
      bottom: widgetBottom,
    },
    now: {
      left: DESKTOP_LAYOUT.edgeInset,
      right: DESKTOP_LAYOUT.edgeInset + DESKTOP_LAYOUT.nowWidget.width,
      top: widgetTop,
      bottom: widgetBottom,
    },
    desktopIcons: {
      left:
        viewportWidth -
        DESKTOP_LAYOUT.edgeInset -
        DESKTOP_LAYOUT.desktopIcons.width,
      right: viewportWidth - DESKTOP_LAYOUT.edgeInset,
      top: widgetTop,
      bottom: widgetBottom,
    },
    dock: {
      left: (viewportWidth - dockWidth) / 2,
      right: (viewportWidth + dockWidth) / 2,
      top:
        VIEWPORT_HEIGHT -
        DESKTOP_LAYOUT.edgeInset -
        DESKTOP_DOCK_HEIGHT -
        DESKTOP_DOCK_MAX_VISUAL_RISE,
      bottom: VIEWPORT_HEIGHT - DESKTOP_LAYOUT.edgeInset,
    },
    menuBar: {
      left: DESKTOP_LAYOUT.edgeInset,
      right: viewportWidth - DESKTOP_LAYOUT.edgeInset,
      top: DESKTOP_LAYOUT.menuBar.top,
      bottom: DESKTOP_LAYOUT.menuBar.top + DESKTOP_LAYOUT.menuBar.height,
    },
  } satisfies Record<string, Rect>;
}

describe("Desktop default placement geometry", () => {
  it("derives the Ask Jakub anchor from the Desktop Icons panel", () => {
    expect(ASK_JAKUB_WIDGET_RIGHT).toBe(
      DESKTOP_LAYOUT.edgeInset +
        DESKTOP_LAYOUT.desktopIcons.width +
        DESKTOP_LAYOUT.widgetGap,
    );
    expect(ASK_JAKUB_WIDGET_RIGHT).toBe(226);
  });

  it.each(VIEWPORT_WIDTHS)(
    "keeps the Ask Jakub box clear at %ipx",
    (viewportWidth) => {
      const boxes = defaultDesktopBoxes(viewportWidth);

      expect(intersects(boxes.askJakub, boxes.now)).toBe(false);
      expect(intersects(boxes.askJakub, boxes.desktopIcons)).toBe(false);
      expect(intersects(boxes.askJakub, boxes.dock)).toBe(false);
      expect(intersects(boxes.askJakub, boxes.menuBar)).toBe(false);

      expect(boxes.desktopIcons.left - boxes.askJakub.right).toBe(
        DESKTOP_LAYOUT.widgetGap,
      );
      expect(boxes.askJakub.left - boxes.now.right).toBeGreaterThanOrEqual(
        DESKTOP_LAYOUT.widgetGap,
      );
      expect(boxes.dock.top - boxes.askJakub.bottom).toBeGreaterThanOrEqual(
        DESKTOP_LAYOUT.widgetGap,
      );
    },
  );

  it("has no default-placement collision at any whole width from 900px through 5120px", () => {
    const collidingWidths: number[] = [];

    for (
      let viewportWidth = 900;
      viewportWidth <= MAX_PROVEN_VIEWPORT_WIDTH;
      viewportWidth += 1
    ) {
      const boxes = defaultDesktopBoxes(viewportWidth);
      const collides =
        intersects(boxes.askJakub, boxes.now) ||
        intersects(boxes.askJakub, boxes.desktopIcons) ||
        intersects(boxes.askJakub, boxes.dock) ||
        intersects(boxes.askJakub, boxes.menuBar);

      if (collides) collidingWidths.push(viewportWidth);
    }

    expect(collidingWidths).toEqual([]);
  });

  it("uses vertical Dock clearance across narrow and wide layouts", () => {
    const at1440 = defaultDesktopBoxes(1440);
    const at2560 = defaultDesktopBoxes(2560);

    expect(
      at1440.askJakub.left < at1440.dock.right &&
        at1440.askJakub.right > at1440.dock.left,
    ).toBe(true);
    expect(
      at2560.askJakub.left < at2560.dock.right &&
        at2560.askJakub.right > at2560.dock.left,
    ).toBe(false);
    expect(intersects(at1440.askJakub, at1440.dock)).toBe(false);
    expect(intersects(at2560.askJakub, at2560.dock)).toBe(false);
  });
});
