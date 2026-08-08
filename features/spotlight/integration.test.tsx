import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRef } from "react";

import MenuBar from "@/components/desktop/MenuBar";
import Desktop from "@/components/desktop/Desktop";
import MobileDesktop from "@/components/desktop/MobileDesktop";
import WindowFrame from "@/components/desktop/Window";
import {
  DesktopProvider,
  type DesktopApi,
} from "@/components/desktop/DesktopContext";
import { getApp } from "@/components/desktop/registry";
import {
  PortfolioNavigator,
  resolvePortfolioLocation,
  type AppLaunchPayload,
} from "@/features/portfolio-navigation";
import { useWindowStore } from "@/lib/window-store";

const desktopApi: DesktopApi = {
  openApp: () => {},
  openLocation: (location) => {
    const target = resolvePortfolioLocation(location);
    return target
      ? { opened: true, target }
      : { opened: false, reason: "invalid-location" };
  },
  selectionFor: () => undefined,
  switchToSimple: () => {},
};

function SpotlightWindowWorkspace() {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const windows = useWindowStore((state) => state.windows);
  const open = useWindowStore((state) => state.open);
  const area = { w: 1200, h: 800 };
  const launch = (payload: AppLaunchPayload) => {
    open(payload.appId, { size: getApp(payload.appId).size, area });
  };
  const api: DesktopApi = {
    openApp: (appId) => launch({ appId }),
    openLocation: PortfolioNavigator.desktop(launch).open,
    selectionFor: () => undefined,
    switchToSimple: () => {},
  };

  return (
    <DesktopProvider value={api}>
      <MenuBar />
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

describe("Spotlight desktop surfaces", () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: [], focusedId: null, nextZ: 1 });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("turns the menu-bar search affordance into an operable button", () => {
    const view = render(
      <DesktopProvider value={desktopApi}>
        <MenuBar />
      </DesktopProvider>,
    );

    fireEvent.click(view.getByRole("button", { name: "Szukaj w portfolio" }));

    const dialog = view.getByRole("dialog", {
      name: "Wyszukiwanie portfolio",
    });
    expect(dialog).toBeInTheDocument();
    expect(dialog.closest("header")).toBeNull();
  });

  it("returns focus to Spotlight after a discovered desktop window closes", async () => {
    const view = render(<SpotlightWindowWorkspace />);
    const trigger = view.getByRole("button", {
      name: "Szukaj w portfolio",
    });
    fireEvent.click(trigger);
    const input = view.getByRole("combobox", {
      name: "Szukaj w portfolio",
    });
    fireEvent.change(input, { target: { value: "Mandata" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "Doświadczenie" })).toHaveFocus(),
    );
    fireEvent.click(view.getByRole("button", { name: "Zamknij okno" }));

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("focuses an already-open destination window after Spotlight navigation", async () => {
    const view = render(<Desktop />);
    const trigger = view.getByRole("button", {
      name: "Szukaj w portfolio",
    });
    fireEvent.click(trigger);
    let input = view.getByRole("combobox", {
      name: "Szukaj w portfolio",
    });
    fireEvent.change(input, { target: { value: "Mandata" } });
    fireEvent.keyDown(input, { key: "Enter" });

    const destination = await view.findByRole("dialog", {
      name: "Doświadczenie",
    });
    await waitFor(() => expect(destination).toHaveFocus());

    fireEvent.keyDown(destination, { key: "k", metaKey: true });
    input = await view.findByRole("combobox", {
      name: "Szukaj w portfolio",
    });
    fireEvent.change(input, { target: { value: "Mandata" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(destination).toHaveFocus());
  });

  it("opens a semantic destination as a Pocket OS sheet", async () => {
    const view = render(<MobileDesktop wallpaperId="moon" />);
    fireEvent.click(view.getByRole("button", { name: "Szukaj w portfolio" }));
    const input = view.getByRole("combobox", {
      name: "Szukaj w portfolio",
    });
    fireEvent.change(input, { target: { value: "Mandata" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() =>
      expect(view.getByRole("dialog", { name: "Doświadczenie" })).toHaveFocus(),
    );
    const trigger = view.container.querySelector<HTMLButtonElement>(
      '[data-window-return="true"]',
    );
    fireEvent.click(view.getByRole("button", { name: "Zamknij" }));

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("isolates the Pocket OS background while keeping Spotlight operable", async () => {
    const view = render(<MobileDesktop wallpaperId="moon" />);
    const trigger = view.getByRole("button", { name: "Szukaj w portfolio" });
    fireEvent.click(trigger);

    const dialog = view.getByRole("dialog", {
      name: "Wyszukiwanie portfolio",
    });
    const background = view.container.querySelector(
      "[data-mobile-desktop-background]",
    );

    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveAttribute("inert");
    expect(background).not.toContainElement(dialog);
    expect(
      view.queryByRole("button", { name: "Otwórz: O mnie" }),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        view.getByRole("combobox", { name: "Szukaj w portfolio" }),
      ).toHaveFocus(),
    );

    fireEvent.click(view.getByRole("button", { name: "Zamknij wyszukiwanie" }));
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(background).not.toHaveAttribute("aria-hidden");
    expect(background).not.toHaveAttribute("inert");
  });

  it("does not open Spotlight behind an active mobile sheet", async () => {
    const view = render(<MobileDesktop wallpaperId="moon" />);
    fireEvent.click(view.getAllByRole("button", { name: "Otwórz: O mnie" })[0]);
    const sheet = await view.findByRole("dialog", { name: "O mnie" });
    await waitFor(() => expect(sheet).toHaveFocus());

    fireEvent.keyDown(sheet, { key: "k", ctrlKey: true });

    expect(view.getByRole("dialog", { name: "O mnie" })).toBeInTheDocument();
    expect(
      view.queryByRole("dialog", { name: "Wyszukiwanie portfolio" }),
    ).not.toBeInTheDocument();
  });
});
