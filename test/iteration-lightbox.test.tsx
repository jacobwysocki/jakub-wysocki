import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import IterationLightbox from "@/components/case-study/IterationLightbox";
import LangProvider from "@/components/LangProvider";
import { hasTopmostOverlay } from "@/lib/overlay";
import type { IterationFrame } from "@/data/case-studies";

/**
 * Nakładka iteracji jest najwyższą warstwą modalną: te testy przypinają
 * kontrakt klawiatury (Escape kończy się na niej, strzałki zawijają),
 * pułapkę i powrót fokusa oraz sygnał, którym ustępują jej warstwy pulpitu.
 */

const FRAMES: IterationFrame[] = [
  {
    src: "/projects/squizzu/iterations/iter-1.jpg",
    alt: { pl: "Klatka pierwsza", en: "Frame one" },
    note: { pl: "Notatka 1.", en: "Note 1." },
  },
  {
    src: "/projects/squizzu/iterations/iter-2.jpg",
    alt: { pl: "Klatka druga", en: "Frame two" },
  },
  {
    src: "/projects/squizzu/iterations/iter-3.jpg",
    alt: { pl: "Klatka trzecia", en: "Frame three" },
    note: { pl: "Wdrożona.", en: "Shipped." },
    final: true,
  },
];

function Harness({ initial = null }: { initial?: number | null }) {
  const [index, setIndex] = useState<number | null>(initial);
  return (
    <LangProvider initialLang="en">
      <button type="button" onClick={() => setIndex(0)}>
        opener
      </button>
      <IterationLightbox
        frames={FRAMES}
        index={index}
        onClose={() => setIndex(null)}
        onNavigate={setIndex}
      />
    </LangProvider>
  );
}

function dialog() {
  return screen.queryByRole("dialog");
}

beforeEach(() => {
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

describe("IterationLightbox", () => {
  it("renders nothing while closed and lets keys pass to the layer below", () => {
    render(<Harness />);
    const below = vi.fn();
    window.addEventListener("keydown", below);

    expect(dialog()).not.toBeInTheDocument();
    expect(hasTopmostOverlay()).toBe(false);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(below).toHaveBeenCalledTimes(1);

    window.removeEventListener("keydown", below);
  });

  it("opens with a labeled dialog and raises the topmost-overlay signal", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "opener" }));

    expect(
      screen.getByRole("dialog", { name: /Iteration 1\/3: Frame one/ }),
    ).toBeInTheDocument();
    // Ten atrybut jest kontraktem dla pulpitu i arkusza mobilnego:
    // dopóki istnieje, ich własne skróty klawiatury ustępują.
    expect(hasTopmostOverlay()).toBe(true);
    expect(screen.getByAltText("Frame one")).toBeInTheDocument();
  });

  it("closes only itself on Escape and returns focus to the opener", async () => {
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "opener" });
    opener.focus();
    fireEvent.click(opener);
    expect(dialog()).toHaveFocus();

    // Symulacja warstwy pulpitu: bąbelkujący listener na window,
    // który zamknąłby okno pod nakładką.
    const desktopEscape = vi.fn();
    window.addEventListener("keydown", desktopEscape);
    fireEvent.keyDown(document.body, { key: "Escape" });
    window.removeEventListener("keydown", desktopEscape);

    expect(desktopEscape).not.toHaveBeenCalled();
    // AnimatePresence trzyma węzeł na czas animacji wyjścia.
    await waitFor(() => expect(dialog()).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  it("wraps arrow navigation across both ends", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "opener" }));

    fireEvent.keyDown(document.body, { key: "ArrowLeft" });
    expect(
      screen.getByRole("dialog", { name: /Iteration 3\/3/ }),
    ).toBeInTheDocument();
    // Finałowa klatka niesie swój znacznik także w nakładce.
    expect(screen.getByText(/final/)).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: "ArrowRight" });
    expect(
      screen.getByRole("dialog", { name: /Iteration 1\/3/ }),
    ).toBeInTheDocument();
  });

  it("keeps Tab cycling inside the overlay controls", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "opener" }));

    const close = screen.getByRole("button", { name: "Close the preview" });
    const next = screen.getByRole("button", { name: "Next iteration" });

    // Z ostatniego przycisku Tab wraca na pierwszy…
    next.focus();
    fireEvent.keyDown(document.body, { key: "Tab" });
    expect(close).toHaveFocus();
    // …a Shift+Tab z pierwszego domyka cykl na ostatnim.
    fireEvent.keyDown(document.body, { key: "Tab", shiftKey: true });
    expect(next).toHaveFocus();
    // Fokus spoza nakładki jest zawracany do środka.
    screen.getByRole("button", { name: "opener" }).focus();
    fireEvent.keyDown(document.body, { key: "Tab" });
    expect(close).toHaveFocus();
  });

  it("renders empty on the server instead of touching the portal", () => {
    const markup = renderToString(
      <LangProvider initialLang="en">
        <IterationLightbox
          frames={FRAMES}
          index={0}
          onClose={() => {}}
          onNavigate={() => {}}
        />
      </LangProvider>,
    );
    expect(markup).not.toContain('role="dialog"');
  });
});
