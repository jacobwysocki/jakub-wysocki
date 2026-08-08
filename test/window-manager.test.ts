import { beforeEach, describe, expect, it } from "vitest";

import { reconcileWindowRect, useWindowStore } from "@/lib/window-store";

describe("Window Manager viewport reconciliation", () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: [], focusedId: null, nextZ: 1 });
  });

  it("keeps a restored window fully reachable after the work area shrinks", () => {
    expect(
      reconcileWindowRect(
        { x: 760, y: 520, w: 640, h: 480 },
        { w: 800, h: 600 },
      ),
    ).toEqual({ x: 148, y: 112, w: 640, h: 480 });
  });

  it("reconciles restored geometry without changing maximize state", () => {
    const store = useWindowStore.getState();

    store.open("experience", {
      size: { w: 880, h: 640 },
      area: { w: 1200, h: 800 },
    });
    useWindowStore.getState().toggleMaximize("experience");

    useWindowStore.getState().reconcileArea({ w: 320, h: 240 });

    expect(useWindowStore.getState().windows[0]).toMatchObject({
      id: "experience",
      maximized: true,
      rect: { x: 12, y: 8, w: 296, h: 224 },
    });
  });

  it("opens a usable window even when the work area is exceptionally small", () => {
    useWindowStore.getState().open("contact", {
      size: { w: 480, h: 580 },
      area: { w: 20, h: 16 },
    });

    expect(useWindowStore.getState().windows[0].rect).toEqual({
      x: 9.5,
      y: 7.5,
      w: 1,
      h: 1,
    });
  });
});
