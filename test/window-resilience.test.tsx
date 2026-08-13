import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";

import WindowFrame from "@/components/desktop/Window";
import Dock from "@/components/desktop/Dock";
import DesktopIcons from "@/components/desktop/DesktopIcons";
import {
  DesktopProvider,
  type DesktopApi,
} from "@/components/desktop/DesktopContext";
import { useWindowStore } from "@/lib/window-store";

class ResizeObserverFixture {
  static instances: ResizeObserverFixture[] = [];

  private target: Element | null = null;

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverFixture.instances.push(this);
  }

  observe(target: Element) {
    this.target = target;
  }

  unobserve() {}

  disconnect() {}

  emit() {
    if (!this.target) throw new Error("ResizeObserver has no target");
    this.callback(
      [{ target: this.target } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

function WindowArea({ size }: { size: { w: number; h: number } }) {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const win = useWindowStore((state) => state.windows[0]);

  return (
    <div
      ref={(element) => {
        areaRef.current = element;
        if (!element) return;
        Object.defineProperties(element, {
          clientWidth: { configurable: true, get: () => size.w },
          clientHeight: { configurable: true, get: () => size.h },
        });
      }}
    >
      {win ? <WindowFrame win={win} areaRef={areaRef} /> : null}
    </div>
  );
}

function WindowWorkspace() {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const windows = useWindowStore((state) => state.windows);
  const open = useWindowStore((state) => state.open);
  const area = { w: 1200, h: 800 };

  return (
    <>
      <button
        type="button"
        data-app-launcher="about"
        onClick={() => open("about", { size: { w: 640, h: 720 }, area })}
      >
        Open About
      </button>
      <button
        type="button"
        data-app-launcher="contact"
        onClick={() => open("contact", { size: { w: 480, h: 580 }, area })}
      >
        Open Contact
      </button>
      <div
        ref={(element) => {
          areaRef.current = element;
          if (!element) return;
          Object.defineProperties(element, {
            clientWidth: { configurable: true, value: area.w },
            clientHeight: { configurable: true, value: area.h },
          });
        }}
      >
        {windows.map((win) => (
          <WindowFrame key={win.id} win={win} areaRef={areaRef} />
        ))}
      </div>
    </>
  );
}

function DockWorkspace() {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const windows = useWindowStore((state) => state.windows);
  const open = useWindowStore((state) => state.open);
  const area = { w: 1200, h: 800 };
  const api: DesktopApi = {
    openApp: (appId) => open(appId, { size: { w: 640, h: 600 }, area }),
    openLocation: () => ({ opened: false, reason: "invalid-location" }),
    selectionFor: () => undefined,
    switchToSimple: () => {},
  };

  return (
    <DesktopProvider value={api}>
      <Dock />
      <div
        ref={(element) => {
          areaRef.current = element;
          if (!element) return;
          Object.defineProperties(element, {
            clientWidth: { configurable: true, value: area.w },
            clientHeight: { configurable: true, value: area.h },
          });
        }}
      >
        {windows.map((win) => (
          <WindowFrame key={win.id} win={win} areaRef={areaRef} />
        ))}
      </div>
    </DesktopProvider>
  );
}

function IconWorkspace() {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const windows = useWindowStore((state) => state.windows);
  const open = useWindowStore((state) => state.open);
  const area = { w: 1200, h: 800 };
  const api: DesktopApi = {
    openApp: (appId) => open(appId, { size: { w: 640, h: 600 }, area }),
    openLocation: () => ({ opened: false, reason: "invalid-location" }),
    selectionFor: () => undefined,
    switchToSimple: () => {},
  };

  return (
    <DesktopProvider value={api}>
      <div
        ref={(element) => {
          areaRef.current = element;
          if (!element) return;
          Object.defineProperties(element, {
            clientWidth: { configurable: true, value: area.w },
            clientHeight: { configurable: true, value: area.h },
          });
        }}
      >
        <DesktopIcons areaRef={areaRef} />
        <Dock />
        {windows.map((win) => (
          <WindowFrame key={win.id} win={win} areaRef={areaRef} />
        ))}
      </div>
    </DesktopProvider>
  );
}

describe("desktop window resilience", () => {
  beforeEach(() => {
    ResizeObserverFixture.instances = [];
    vi.stubGlobal("ResizeObserver", ResizeObserverFixture);
    useWindowStore.setState({ windows: [], focusedId: null, nextZ: 1 });
  });

  afterEach(cleanup);

  it("reconciles open windows when the rendered work area changes", () => {
    const size = { w: 1200, h: 800 };
    useWindowStore.getState().open("about", {
      size: { w: 640, h: 720 },
      area: size,
    });
    render(<WindowArea size={size} />);

    size.w = 420;
    size.h = 300;
    act(() => ResizeObserverFixture.instances[0].emit());

    expect(useWindowStore.getState().windows[0].rect).toEqual({
      x: 12,
      y: 8,
      w: 396,
      h: 284,
    });
  });

  it("renders the reconciled rectangle after a resize", async () => {
    const size = { w: 1200, h: 800 };
    useWindowStore.getState().open("about", {
      size: { w: 640, h: 720 },
      area: size,
    });
    const view = render(<WindowArea size={size} />);

    size.w = 420;
    size.h = 300;
    act(() => ResizeObserverFixture.instances[0].emit());

    await waitFor(() => {
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveStyle({
        width: "396px",
        height: "284px",
      });
    });
  });

  it("keeps a maximized window fitted to the live work area", async () => {
    const size = { w: 1200, h: 800 };
    useWindowStore.getState().open("about", {
      size: { w: 640, h: 720 },
      area: size,
    });
    useWindowStore.getState().toggleMaximize("about");
    const view = render(<WindowArea size={size} />);

    size.w = 420;
    size.h = 300;
    act(() => ResizeObserverFixture.instances[0].emit());

    await waitFor(() => {
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveStyle({
        width: "420px",
        height: "300px",
      });
    });
  });

  it("moves a short-work-area window down only while its title bar stays reachable", async () => {
    const size = { w: 800, h: 300 };
    useWindowStore.getState().open("about", {
      size: { w: 640, h: 720 },
      area: size,
    });
    const view = render(<WindowArea size={size} />);
    const dialog = view.getByRole("dialog", { name: "O mnie" });
    const titleBar = dialog.querySelector("header");
    const initialY = useWindowStore.getState().windows[0].rect.y;

    expect(titleBar).not.toBeNull();
    fireEvent.pointerDown(titleBar!, {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      buttons: 1,
      clientX: 200,
      clientY: 20,
    });
    fireEvent.pointerMove(window, {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      buttons: 1,
      clientX: 200,
      clientY: 1000,
    });
    await act(
      () =>
        new Promise<void>((resolve) =>
          window.requestAnimationFrame(() => resolve()),
        ),
    );
    fireEvent.pointerUp(window, {
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      clientX: 200,
      clientY: 1000,
    });

    await waitFor(() =>
      expect(useWindowStore.getState().windows[0].rect.y).toBe(256),
    );
    expect(useWindowStore.getState().windows[0].rect.y).toBeGreaterThan(
      initialY,
    );

    size.h = 240;
    act(() => ResizeObserverFixture.instances[0].emit());

    expect(useWindowStore.getState().windows[0].rect).toMatchObject({
      y: 8,
      h: 224,
    });
  });

  it("renders a pointer-down window above the others before title-bar drag starts", () => {
    const view = render(<WindowWorkspace />);
    fireEvent.click(view.getByRole("button", { name: "Open About" }));
    fireEvent.click(view.getByRole("button", { name: "Open Contact" }));
    const aboutWindow = view.getByRole("dialog", { name: "O mnie" });
    const contactWindow = view.getByRole("dialog", { name: "Kontakt" });
    const titleBar = aboutWindow.querySelector("header");
    let renderedZDuringPointerDown: string | undefined;

    expect(titleBar).not.toBeNull();
    expect(Number(contactWindow.style.zIndex)).toBeGreaterThan(
      Number(aboutWindow.style.zIndex),
    );
    titleBar?.addEventListener(
      "pointerdown",
      () => {
        renderedZDuringPointerDown = aboutWindow.style.zIndex;
      },
      { once: true },
    );

    fireEvent.pointerDown(titleBar!);

    expect(Number(renderedZDuringPointerDown)).toBeGreaterThan(
      Number(contactWindow.style.zIndex),
    );
    expect(useWindowStore.getState().focusedId).toBe("about");
  });

  it("raises a window when its body is pressed", () => {
    const view = render(<WindowWorkspace />);
    fireEvent.click(view.getByRole("button", { name: "Open About" }));
    fireEvent.click(view.getByRole("button", { name: "Open Contact" }));
    const aboutWindow = view.getByRole("dialog", { name: "O mnie" });
    const contactWindow = view.getByRole("dialog", { name: "Kontakt" });
    const body = aboutWindow.querySelector("[data-lenis-prevent]");

    expect(body).not.toBeNull();
    fireEvent.pointerDown(body!);

    expect(Number(aboutWindow.style.zIndex)).toBeGreaterThan(
      Number(contactWindow.style.zIndex),
    );
    expect(useWindowStore.getState().focusedId).toBe("about");
  });

  it("returns focus to the invoking launcher after its window closes", async () => {
    const view = render(<WindowWorkspace />);
    const launcher = view.getByRole("button", { name: "Open About" });
    launcher.focus();
    fireEvent.click(launcher);

    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveFocus(),
    );
    fireEvent.click(view.getByRole("button", { name: "Zamknij okno" }));

    await waitFor(() => expect(launcher).toHaveFocus());
  });

  it("returns focus to the exact Dock launcher after close", async () => {
    const view = render(<DockWorkspace />);
    const launcher = view.getByRole("button", { name: "O mnie" });
    launcher.focus();
    fireEvent.click(launcher);

    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveFocus(),
    );
    fireEvent.click(view.getByRole("button", { name: "Zamknij okno" }));

    await waitFor(() => expect(launcher).toHaveFocus());
  });

  it("returns focus to the exact desktop icon after close", async () => {
    const view = render(<IconWorkspace />);
    const launcher = view.getByRole("button", {
      name: /O mnie, otwórz kliknięciem lub Enterem/i,
    });
    launcher.focus();
    fireEvent.click(launcher);

    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveFocus(),
    );
    fireEvent.click(view.getByRole("button", { name: "Zamknij okno" }));

    await waitFor(() => expect(launcher).toHaveFocus());
  });

  it("moves focus to the next window after minimizing the active one", async () => {
    const view = render(<WindowWorkspace />);
    const aboutLauncher = view.getByRole("button", { name: "Open About" });
    const contactLauncher = view.getByRole("button", {
      name: "Open Contact",
    });

    aboutLauncher.focus();
    fireEvent.click(aboutLauncher);
    contactLauncher.focus();
    fireEvent.click(contactLauncher);
    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "Kontakt" })).toHaveFocus(),
    );

    fireEvent.click(
      view.getAllByRole("button", { name: "Minimalizuj okno" })[1],
    );

    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveFocus(),
    );
  });

  it("removes a minimized window from interaction while focus moves elsewhere", async () => {
    const view = render(<WindowWorkspace />);
    fireEvent.click(view.getByRole("button", { name: "Open About" }));
    fireEvent.click(view.getByRole("button", { name: "Open Contact" }));
    const contactWindow = view.getByRole("dialog", { name: "Kontakt" });

    await waitFor(() => expect(contactWindow).toHaveFocus());
    fireEvent.click(
      view.getAllByRole("button", { name: "Minimalizuj okno" })[1],
    );

    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveFocus(),
    );
    expect(contactWindow).toHaveAttribute("aria-hidden", "true");
    expect(contactWindow).toHaveAttribute("inert");
    expect(contactWindow).not.toContainElement(
      document.activeElement as HTMLElement,
    );
  });

  it("returns focus to the launcher when the only window is minimized", async () => {
    const view = render(<WindowWorkspace />);
    const launcher = view.getByRole("button", { name: "Open About" });
    launcher.focus();
    fireEvent.click(launcher);
    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveFocus(),
    );

    fireEvent.click(view.getByRole("button", { name: "Minimalizuj okno" }));

    await waitFor(() => expect(launcher).toHaveFocus());
  });

  it("updates focus return when a minimized app is restored elsewhere", async () => {
    const view = render(<IconWorkspace />);
    const icon = view.getByRole("button", {
      name: /O mnie, otwórz kliknięciem lub Enterem/i,
    });
    icon.focus();
    fireEvent.click(icon);
    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveFocus(),
    );
    fireEvent.click(view.getByRole("button", { name: "Minimalizuj okno" }));

    const dockLauncher = view.getByRole("button", {
      name: "O mnie (otwarte)",
    });
    dockLauncher.focus();
    fireEvent.click(dockLauncher);
    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "O mnie" })).toHaveFocus(),
    );
    fireEvent.click(view.getByRole("button", { name: "Zamknij okno" }));

    await waitFor(() => expect(dockLauncher).toHaveFocus());
  });
});
