/**
 * Stała geometria głównych powierzchni Desktop Mode, w pikselach CSS.
 * Widgety pozostają przeciągalne; te wartości opisują ich pozycje startowe.
 */
export const DESKTOP_LAYOUT = {
  edgeInset: 16,
  widgetGap: 20,
  nowWidget: {
    width: 290,
  },
  askJakubWidget: {
    width: 330,
  },
  desktopIcons: {
    width: 190,
  },
  menuBar: {
    top: 12,
    height: 44,
    gapToWorkArea: 12,
  },
  dock: {
    launcherSize: 48,
    gap: 6,
    paddingInline: 10,
    paddingBlock: 8,
    borderWidth: 1,
    separatorWidth: 1,
    separatorMarginInline: 4,
    maxScale: 1.2,
    lift: 8,
    gapToWorkArea: 22,
  },
} as const;

export const DESKTOP_DOCK_HEIGHT =
  DESKTOP_LAYOUT.dock.launcherSize +
  2 * (DESKTOP_LAYOUT.dock.paddingBlock + DESKTOP_LAYOUT.dock.borderWidth);

export const DESKTOP_DOCK_MAX_VISUAL_RISE = Math.max(
  0,
  (DESKTOP_LAYOUT.dock.maxScale - 1) * DESKTOP_LAYOUT.dock.launcherSize +
    DESKTOP_LAYOUT.dock.lift -
    DESKTOP_LAYOUT.dock.paddingBlock -
    DESKTOP_LAYOUT.dock.borderWidth,
);

export const DESKTOP_WORK_AREA = {
  top:
    DESKTOP_LAYOUT.menuBar.top +
    DESKTOP_LAYOUT.menuBar.height +
    DESKTOP_LAYOUT.menuBar.gapToWorkArea,
  bottom:
    DESKTOP_LAYOUT.edgeInset +
    DESKTOP_DOCK_HEIGHT +
    DESKTOP_LAYOUT.dock.gapToWorkArea,
} as const;

/**
 * Pozycja startowa Ask Jakub: na lewo od panelu ikon, z takim samym
 * odstępem jak między pozostałymi stałymi powierzchniami pulpitu.
 */
export const ASK_JAKUB_WIDGET_RIGHT =
  DESKTOP_LAYOUT.edgeInset +
  DESKTOP_LAYOUT.desktopIcons.width +
  DESKTOP_LAYOUT.widgetGap;

/** Szerokość ramki Docka dla bieżącej liczby aplikacji. */
export function getDesktopDockWidth(appCount: number): number {
  const launcherCount = appCount + 1; // aplikacje + przełącznik trybu
  const childCount = launcherCount + 1; // launchery + separator

  return (
    launcherCount * DESKTOP_LAYOUT.dock.launcherSize +
    DESKTOP_LAYOUT.dock.separatorWidth +
    2 * DESKTOP_LAYOUT.dock.separatorMarginInline +
    Math.max(0, childCount - 1) * DESKTOP_LAYOUT.dock.gap +
    2 * (DESKTOP_LAYOUT.dock.paddingInline + DESKTOP_LAYOUT.dock.borderWidth)
  );
}
