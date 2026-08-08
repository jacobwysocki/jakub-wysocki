import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";

import {
  DesktopProvider,
  type DesktopApi,
} from "@/components/desktop/DesktopContext";
import { resolvePortfolioLocation } from "@/features/portfolio-navigation";
import type { Lang } from "@/lib/lang";
import { LangContext } from "@/lib/lang-store";
import Spotlight from "./Spotlight";

function renderSpotlight(openLocation: DesktopApi["openLocation"] = openOwned) {
  return render(
    <DesktopProvider
      value={{
        openApp: vi.fn(),
        openLocation,
        selectionFor: () => undefined,
        switchToSimple: vi.fn(),
      }}
    >
      <Spotlight variant="desktop" />
    </DesktopProvider>,
  );
}

const openOwned: DesktopApi["openLocation"] = (location) => {
  const target = resolvePortfolioLocation(location);
  return target
    ? { opened: true, target }
    : { opened: false, reason: "invalid-location" };
};

function LanguageWorkspace() {
  const [lang, setLang] = useState<Lang>("pl");
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <DesktopProvider
        value={{
          openApp: vi.fn(),
          openLocation: openOwned,
          selectionFor: () => undefined,
          switchToSimple: vi.fn(),
        }}
      >
        <button type="button" onClick={() => setLang("en")}>
          English
        </button>
        <Spotlight variant="desktop" />
      </DesktopProvider>
    </LangContext.Provider>
  );
}

describe("Spotlight reduced motion", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens without entrance motion when reduced motion is requested", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    const view = renderSpotlight();

    fireEvent.click(view.getByRole("button", { name: "Szukaj w portfolio" }));

    expect(
      view.getByRole("dialog", { name: "Wyszukiwanie portfolio" }),
    ).toHaveAttribute("data-reduced-motion", "true");
  });
});

describe("Spotlight dialog", () => {
  afterEach(cleanup);

  it("opens focused and activates the selected semantic destination", async () => {
    const openLocation = vi.fn<DesktopApi["openLocation"]>(openOwned);
    const view = renderSpotlight(openLocation);

    fireEvent.click(view.getByRole("button", { name: "Szukaj w portfolio" }));
    const input = view.getByRole("combobox", {
      name: "Szukaj w portfolio",
    });
    await waitFor(() => expect(input).toHaveFocus());

    fireEvent.change(input, { target: { value: "Mandata" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(openLocation).toHaveBeenCalledWith({
      area: "experience",
      roleId: "mandata",
    });
    await waitFor(() =>
      expect(
        view.queryByRole("dialog", { name: "Wyszukiwanie portfolio" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("opens with Cmd/Ctrl+K and consumes Escape before desktop window handlers", async () => {
    const desktopApi: DesktopApi = {
      openApp: vi.fn(),
      openLocation: openOwned,
      selectionFor: () => undefined,
      switchToSimple: vi.fn(),
    };
    const view = render(
      <DesktopProvider value={desktopApi}>
        <button type="button">Current work</button>
        <Spotlight variant="desktop" />
      </DesktopProvider>,
    );
    const priorFocus = view.getByRole("button", { name: "Current work" });
    priorFocus.focus();

    fireEvent.keyDown(priorFocus, { key: "k", metaKey: true });
    const input = await view.findByRole("combobox", {
      name: "Szukaj w portfolio",
    });
    await waitFor(() => expect(input).toHaveFocus());

    const outsideEscapeHandler = vi.fn();
    window.addEventListener("keydown", outsideEscapeHandler);
    fireEvent.keyDown(input, { key: "Escape" });
    window.removeEventListener("keydown", outsideEscapeHandler);

    expect(outsideEscapeHandler).not.toHaveBeenCalled();
    await waitFor(() => expect(priorFocus).toHaveFocus());
    await waitFor(() =>
      expect(
        view.queryByRole("dialog", { name: "Wyszukiwanie portfolio" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("moves through results with arrows and opens the active result with Enter", () => {
    const openLocation = vi.fn<DesktopApi["openLocation"]>(openOwned);
    const view = renderSpotlight(openLocation);
    fireEvent.click(view.getByRole("button", { name: "Szukaj w portfolio" }));
    const input = view.getByRole("combobox", {
      name: "Szukaj w portfolio",
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    const options = view.getAllByRole("option");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(input, { key: "Enter" });

    expect(openLocation).toHaveBeenCalledWith({ area: "studio" });
  });

  it("keeps Tab focus inside the modal search surface", () => {
    const view = renderSpotlight();
    fireEvent.click(view.getByRole("button", { name: "Szukaj w portfolio" }));
    const input = view.getByRole("combobox", {
      name: "Szukaj w portfolio",
    });
    const close = view.getByRole("button", {
      name: "Zamknij wyszukiwanie",
    });

    close.focus();
    fireEvent.keyDown(close, { key: "Tab" });
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: "Tab", shiftKey: true });
    expect(close).toHaveFocus();
  });

  it("dismisses outside and returns focus to the trigger", async () => {
    const view = renderSpotlight();
    const trigger = view.getByRole("button", { name: "Szukaj w portfolio" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = view.getByRole("dialog", {
      name: "Wyszukiwanie portfolio",
    });

    fireEvent.mouseDown(dialog.parentElement!);

    await waitFor(() => expect(trigger).toHaveFocus());
    await waitFor(() =>
      expect(
        view.queryByRole("dialog", { name: "Wyszukiwanie portfolio" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("returns focus to the mobile trigger after a tap that did not focus it", async () => {
    const view = render(
      <DesktopProvider
        value={{
          openApp: vi.fn(),
          openLocation: openOwned,
          selectionFor: () => undefined,
          switchToSimple: vi.fn(),
        }}
      >
        <button type="button">Prior control</button>
        <Spotlight variant="mobile" />
      </DesktopProvider>,
    );
    const prior = view.getByRole("button", { name: "Prior control" });
    const trigger = view.getByRole("button", {
      name: "Szukaj w portfolio",
    });
    prior.focus();

    fireEvent.click(trigger);
    fireEvent.click(view.getByRole("button", { name: "Zamknij wyszukiwanie" }));

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("keeps the dialog useful for no results and stale navigation failures", () => {
    const unavailable: DesktopApi["openLocation"] = () => ({
      opened: false,
      reason: "invalid-location",
    });
    const view = renderSpotlight(unavailable);
    fireEvent.click(view.getByRole("button", { name: "Szukaj w portfolio" }));
    const input = view.getByRole("combobox", {
      name: "Szukaj w portfolio",
    });

    fireEvent.change(input, { target: { value: "nothing-like-this-987" } });
    expect(view.getByRole("status")).toHaveTextContent("Brak wyników");

    fireEvent.change(input, { target: { value: "Mandata" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(view.getByRole("alert")).toHaveTextContent(
      "To miejsce nie jest teraz dostępne.",
    );
    expect(
      view.getByRole("dialog", { name: "Wyszukiwanie portfolio" }),
    ).toBeInTheDocument();
  });

  it("updates copy and result metadata without losing the query on language change", () => {
    const view = render(<LanguageWorkspace />);
    fireEvent.click(view.getByRole("button", { name: "Szukaj w portfolio" }));
    const input = view.getByRole("combobox", {
      name: "Szukaj w portfolio",
    });
    fireEvent.change(input, { target: { value: "Mandata" } });
    expect(
      view.getByRole("option", { name: /Mandata — doświadczenie/ }),
    ).toBeInTheDocument();

    fireEvent.click(view.getByRole("button", { name: "English" }));

    expect(
      view.getByRole("combobox", { name: "Search portfolio" }),
    ).toHaveValue("Mandata");
    expect(
      view.getByRole("option", { name: /Mandata — experience/ }),
    ).toBeInTheDocument();
  });
});
