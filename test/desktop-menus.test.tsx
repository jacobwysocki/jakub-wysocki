import {
  act,
  cleanup,
  fireEvent,
  render,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRef, useState } from "react";

import {
  DesktopProvider,
  type DesktopApi,
} from "@/components/desktop/DesktopContext";
import MenuBar from "@/components/desktop/MenuBar";
import WindowFrame from "@/components/desktop/Window";
import ContextMenu from "@/components/desktop/ContextMenu";
import { useWindowStore } from "@/lib/window-store";

const desktopApi: DesktopApi = {
  openApp: vi.fn(),
  openLocation: () => ({ opened: false, reason: "invalid-location" }),
  selectionFor: () => undefined,
  switchToSimple: vi.fn(),
};

function renderMenuBar() {
  return render(
    <DesktopProvider value={desktopApi}>
      <MenuBar />
    </DesktopProvider>,
  );
}

function MenuWindowWorkspace() {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const windows = useWindowStore((state) => state.windows);
  const open = useWindowStore((state) => state.open);
  const area = { w: 1200, h: 800 };
  const api: DesktopApi = {
    openApp: (appId) => open(appId, { size: { w: 640, h: 600 }, area }),
    openLocation: () => ({ opened: false, reason: "invalid-location" }),
    selectionFor: () => undefined,
    switchToSimple: vi.fn(),
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

function ContextMenuWorkspace() {
  const [open, setOpen] = useState(false);

  return (
    <DesktopProvider value={desktopApi}>
      <button type="button" onClick={() => setOpen(true)}>
        Open desktop menu
      </button>
      {open ? (
        <ContextMenu
          point={{ x: 40, y: 40 }}
          wallpaperId="moon"
          onSelectWallpaper={() => {}}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </DesktopProvider>
  );
}

describe("Desktop menus", () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: [], focusedId: null, nextZ: 1 });
  });

  afterEach(cleanup);

  it("focuses the first logo-menu command and returns focus on Escape", async () => {
    const view = renderMenuBar();
    const trigger = view.getByRole("button", { name: "Menu główne" });
    fireEvent.click(trigger);
    const menu = view.getByRole("menu", { name: "Menu główne" });
    const firstItem = within(menu).getAllByRole("menuitem")[0];

    await waitFor(() => expect(firstItem).toHaveFocus());
    fireEvent.keyDown(firstItem, { key: "Escape" });

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("moves through logo-menu commands with arrows, Home, and End", async () => {
    const view = renderMenuBar();
    fireEvent.click(view.getByRole("button", { name: "Menu główne" }));
    const items = within(
      view.getByRole("menu", { name: "Menu główne" }),
    ).getAllByRole("menuitem");
    await waitFor(() => expect(items[0]).toHaveFocus());

    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(items[1]).toHaveFocus();
    fireEvent.keyDown(items[1], { key: "End" });
    expect(items.at(-1)).toHaveFocus();
    fireEvent.keyDown(items.at(-1)!, { key: "ArrowDown" });
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0], { key: "ArrowUp" });
    expect(items.at(-1)).toHaveFocus();
    fireEvent.keyDown(items.at(-1)!, { key: "Home" });
    expect(items[0]).toHaveFocus();
  });

  it("dismisses the logo menu outside and returns focus to its trigger", async () => {
    const view = renderMenuBar();
    const trigger = view.getByRole("button", { name: "Menu główne" });
    fireEvent.click(trigger);
    const menu = view.getByRole("menu", { name: "Menu główne" });
    await waitFor(() =>
      expect(within(menu).getAllByRole("menuitem")[0]).toHaveFocus(),
    );

    fireEvent.click(menu.previousElementSibling!);

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("hands focus to a menu-launched window and recovers the menu trigger", async () => {
    const view = render(<MenuWindowWorkspace />);
    const trigger = view.getByRole("button", { name: "Menu główne" });
    fireEvent.click(trigger);
    fireEvent.click(
      within(view.getByRole("menu", { name: "Menu główne" })).getByRole(
        "menuitem",
        { name: "O tym portfolio" },
      ),
    );

    const dialog = await view.findByRole("dialog", {
      name: "O tym portfolio",
    });
    await act(
      () =>
        new Promise<void>((resolve) =>
          window.requestAnimationFrame(() =>
            window.requestAnimationFrame(() => resolve()),
          ),
        ),
    );
    expect(dialog).toHaveFocus();

    fireEvent.click(view.getByRole("button", { name: "Zamknij okno" }));
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("focuses the desktop context menu and restores its invoker on Escape", async () => {
    const view = render(<ContextMenuWorkspace />);
    const trigger = view.getByRole("button", { name: "Open desktop menu" });
    trigger.focus();
    fireEvent.click(trigger);
    const menu = view.getByRole("menu", { name: "Menu pulpitu" });
    const firstItem = within(menu).getAllByRole("menuitemradio")[0];

    await waitFor(() => expect(firstItem).toHaveFocus());
    fireEvent.keyDown(firstItem, { key: "Escape" });

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("moves through every context-menu command with menu keys", async () => {
    const view = render(<ContextMenuWorkspace />);
    fireEvent.click(view.getByRole("button", { name: "Open desktop menu" }));
    const menu = within(view.getByRole("menu", { name: "Menu pulpitu" }));
    const items = [
      ...menu.getAllByRole("menuitemradio"),
      ...menu.getAllByRole("menuitem"),
    ];
    await waitFor(() => expect(items[0]).toHaveFocus());

    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(items[1]).toHaveFocus();
    fireEvent.keyDown(items[1], { key: "End" });
    expect(items.at(-1)).toHaveFocus();
    fireEvent.keyDown(items.at(-1)!, { key: "ArrowDown" });
    expect(items[0]).toHaveFocus();
    fireEvent.keyDown(items[0], { key: "ArrowUp" });
    expect(items.at(-1)).toHaveFocus();
    fireEvent.keyDown(items.at(-1)!, { key: "Home" });
    expect(items[0]).toHaveFocus();
  });

  it("dismisses the context menu outside and restores its invoker", async () => {
    const view = render(<ContextMenuWorkspace />);
    const trigger = view.getByRole("button", { name: "Open desktop menu" });
    trigger.focus();
    fireEvent.click(trigger);
    const menu = view.getByRole("menu", { name: "Menu pulpitu" });
    await waitFor(() =>
      expect(within(menu).getAllByRole("menuitemradio")[0]).toHaveFocus(),
    );

    fireEvent.click(menu.previousElementSibling!);

    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
