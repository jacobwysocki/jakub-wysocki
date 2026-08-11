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

describe("Window Manager stacking", () => {
  const area = { w: 1200, h: 800 };

  beforeEach(() => {
    useWindowStore.setState({ windows: [], focusedId: null, nextZ: 1 });
  });

  it("raises a focused window above the others without changing array order", () => {
    const store = useWindowStore.getState();
    store.open("about", { size: { w: 640, h: 720 }, area });
    useWindowStore
      .getState()
      .open("contact", { size: { w: 480, h: 580 }, area });

    useWindowStore.getState().focus("about");

    const state = useWindowStore.getState();
    const about = state.windows.find((win) => win.id === "about");
    const contact = state.windows.find((win) => win.id === "contact");

    expect(state.windows.map((win) => win.id)).toEqual(["about", "contact"]);
    expect(about?.z).toBeGreaterThan(contact?.z ?? Number.POSITIVE_INFINITY);
    expect(state.focusedId).toBe("about");
  });

  it("opens and restores windows at the top of the stack", () => {
    const store = useWindowStore.getState();
    store.open("about", { size: { w: 640, h: 720 }, area });
    useWindowStore
      .getState()
      .open("contact", { size: { w: 480, h: 580 }, area });

    let [about, contact] = useWindowStore.getState().windows;
    expect(contact.z).toBeGreaterThan(about.z);

    useWindowStore.getState().minimize("about");
    useWindowStore.getState().restore("about");
    [about, contact] = useWindowStore.getState().windows;

    expect(about.z).toBeGreaterThan(contact.z);
    expect(useWindowStore.getState().focusedId).toBe("about");
  });
});
