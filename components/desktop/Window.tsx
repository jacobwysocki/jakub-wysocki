"use client";

import {
  createContext,
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { useWindowStore, type Win } from "@/lib/window-store";
import { useT } from "@/lib/lang-store";
import { ui } from "@/data/ui";
import { getApp } from "./registry";
import { EASE_APPLE } from "@/lib/motion";

const MIN_W = 360;
const MIN_H = 260;

type Dir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLES: { dir: Dir; className: string }[] = [
  { dir: "n", className: "inset-x-2 -top-1 h-2 cursor-ns-resize" },
  { dir: "s", className: "inset-x-2 -bottom-1 h-2 cursor-ns-resize" },
  { dir: "e", className: "inset-y-2 -right-1 w-2 cursor-ew-resize" },
  { dir: "w", className: "inset-y-2 -left-1 w-2 cursor-ew-resize" },
  { dir: "nw", className: "-left-1 -top-1 h-3.5 w-3.5 cursor-nwse-resize" },
  { dir: "se", className: "-bottom-1 -right-1 h-3.5 w-3.5 cursor-nwse-resize" },
  { dir: "ne", className: "-right-1 -top-1 h-3.5 w-3.5 cursor-nesw-resize" },
  { dir: "sw", className: "-bottom-1 -left-1 h-3.5 w-3.5 cursor-nesw-resize" },
];

const clamp = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), Math.max(min, max));

/**
 * Stan chrome'u okna dla treści — aplikacje z iframe'em (SiteApp) muszą
 * wiedzieć, kiedy przykryć iframe nakładką: gdy okno jest nieaktywne
 * (klik ma fokusować, nie ginąć w iframe) i podczas drag/resize
 * (iframe połykałby pointermove). Domyślna wartość obsługuje kontekst
 * bez okna (mobilne sheety).
 */
const WindowChromeContext = createContext<{ focused: boolean; interacting: boolean }>({
  focused: true,
  interacting: false,
});

export function useWindowChrome() {
  return useContext(WindowChromeContext);
}

function TrafficLights({
  focused,
  onClose,
  onMinimize,
  onMaximize,
}: {
  focused: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
}) {
  const t = useT();
  const dot =
    "flex h-3 w-3 items-center justify-center rounded-full text-black/55 transition-colors duration-200";
  const glyph = "h-2 w-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100";
  return (
    <div
      className="group absolute left-4 top-1/2 flex -translate-y-1/2 items-center gap-2"
      onPointerDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-label={t(ui.desktop.closeWindow)}
        onClick={onClose}
        className={`${dot} ${focused ? "bg-[#FF5F57]" : "bg-black/20 group-hover:bg-[#FF5F57]"}`}
      >
        <svg viewBox="0 0 8 8" className={glyph} aria-hidden>
          <path d="M1.7 1.7l4.6 4.6M6.3 1.7L1.7 6.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={t(ui.desktop.minimizeWindow)}
        onClick={onMinimize}
        className={`${dot} ${focused ? "bg-[#FEBC2E]" : "bg-black/20 group-hover:bg-[#FEBC2E]"}`}
      >
        <svg viewBox="0 0 8 8" className={glyph} aria-hidden>
          <path d="M1.5 4h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>
      <button
        type="button"
        aria-label={t(ui.desktop.maximizeWindow)}
        onClick={onMaximize}
        className={`${dot} ${focused ? "bg-[#28C840]" : "bg-black/20 group-hover:bg-[#28C840]"}`}
      >
        <svg viewBox="0 0 8 8" className={glyph} aria-hidden>
          <path d="M2 4.6V2h2.6L2 4.6zM6 3.4V6H3.4L6 3.4z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}

function WindowFrame({
  win,
  areaRef,
}: {
  win: Win;
  areaRef: React.RefObject<HTMLDivElement | null>;
}) {
  const app = getApp(win.id);
  const t = useT();
  const title = t(app.title);
  const focused = useWindowStore((s) => s.focusedId === win.id);
  const focus = useWindowStore((s) => s.focus);
  const close = useWindowStore((s) => s.close);
  const minimize = useWindowStore((s) => s.minimize);
  const toggleMaximize = useWindowStore((s) => s.toggleMaximize);
  const commitRect = useWindowStore((s) => s.commitRect);

  const reduced = useReducedMotion();
  const dragControls = useDragControls();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [interacting, setInteracting] = useState(false);

  const x = useMotionValue(win.rect.x);
  const y = useMotionValue(win.rect.y);
  const w = useMotionValue(win.rect.w);
  const h = useMotionValue(win.rect.h);

  // Fokus klawiaturowy na świeżo otwartym oknie
  useEffect(() => {
    sectionRef.current?.focus({ preventScroll: true });
  }, []);

  // Maksymalizacja / przywrócenie — animacja motion values do celu
  const prevMax = useRef(win.maximized);
  useEffect(() => {
    if (prevMax.current === win.maximized) return;
    prevMax.current = win.maximized;
    const area = areaRef.current;
    if (!area) return;
    const opts = { duration: reduced ? 0 : 0.4, ease: [...EASE_APPLE] } as const;
    if (win.maximized) {
      animate(x, 0, opts);
      animate(y, 0, opts);
      animate(w, area.clientWidth, opts);
      animate(h, area.clientHeight, opts);
    } else {
      animate(x, win.rect.x, opts);
      animate(y, win.rect.y, opts);
      animate(w, win.rect.w, opts);
      animate(h, win.rect.h, opts);
    }
  }, [win.maximized, win.rect, x, y, w, h, areaRef, reduced]);

  // Punkt "wyrastania" okna przy otwarciu (np. ikona docka) — zamrożony na mount
  const openOrigin = useMemo(() => {
    if (!win.origin) return "50% 55%";
    const ox = clamp(((win.origin.x - win.rect.x) / win.rect.w) * 100, -60, 160);
    const oy = clamp(((win.origin.y - win.rect.y) / win.rect.h) * 100, -60, 160);
    return `${ox}% ${oy}%`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startResize = (dir: Dir) => (e: React.PointerEvent) => {
    if (win.maximized) return;
    e.preventDefault();
    e.stopPropagation();
    focus(win.id);
    setInteracting(true);
    // Capture: pointermove dociera do nas nawet nad cross-origin iframe'em
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    const area = areaRef.current;
    if (!area) return;
    const areaW = area.clientWidth;
    const areaH = area.clientHeight;
    const sx = e.clientX;
    const sy = e.clientY;
    const ix = x.get();
    const iy = y.get();
    const iw = w.get();
    const ih = h.get();

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      if (dir.includes("e")) w.set(clamp(iw + dx, MIN_W, areaW - ix));
      if (dir.includes("s")) h.set(clamp(ih + dy, MIN_H, areaH - iy));
      if (dir.includes("w")) {
        const nw = clamp(iw - dx, MIN_W, ix + iw);
        x.set(ix + iw - nw);
        w.set(nw);
      }
      if (dir.includes("n")) {
        const nh = clamp(ih - dy, MIN_H, iy + ih);
        y.set(iy + ih - nh);
        h.set(nh);
      }
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      setInteracting(false);
      commitRect(win.id, { x: x.get(), y: y.get(), w: w.get(), h: h.get() });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
  };

  // Kierunek minimalizacji: w dół, w stronę docka
  const minimizeShift = win.minimized
    ? (areaRef.current?.clientHeight ?? 800) - (y.get() + h.get()) + 80
    : 0;

  const chrome = useMemo(
    () => ({ focused, interacting }),
    [focused, interacting]
  );

  return (
    <motion.section
      ref={sectionRef}
      role="dialog"
      aria-label={title}
      aria-hidden={win.minimized || undefined}
      tabIndex={-1}
      drag={!win.maximized}
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={areaRef as React.RefObject<HTMLDivElement>}
      onDragStart={() => setInteracting(true)}
      onDragEnd={() => {
        setInteracting(false);
        commitRect(win.id, { x: x.get(), y: y.get() });
      }}
      onPointerDownCapture={() => focus(win.id)}
      // Esc obsługuje globalny nasłuch w Desktop.tsx — handler tutaj
      // dublował zamknięcie: okno + świeżo sfokusowane następne okno
      style={{ x, y, width: w, height: h, zIndex: win.z }}
      className={`absolute left-0 top-0 outline-none ${
        win.minimized ? "pointer-events-none" : ""
      }`}
    >
      <motion.div
        style={{ transformOrigin: win.minimized ? "50% 100%" : openOrigin }}
        initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
        animate={
          win.minimized
            ? reduced
              ? { opacity: 0, scale: 1, y: 0 }
              : { opacity: 0, scale: 0.14, y: minimizeShift }
            : { opacity: 1, scale: 1, y: 0 }
        }
        exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
        transition={{ duration: reduced ? 0.15 : 0.35, ease: [...EASE_APPLE] }}
        className={`flex h-full w-full flex-col overflow-hidden rounded-[11px] bg-[#f5f5f7]/[0.86] ring-1 backdrop-blur-2xl transition-shadow duration-300 ${
          focused
            ? "shadow-[0_28px_80px_rgba(0,0,0,0.35)] ring-black/15"
            : "shadow-[0_14px_44px_rgba(0,0,0,0.18)] ring-black/10"
        }`}
      >
        <header
          onPointerDown={(e) => {
            if (!win.maximized) dragControls.start(e);
          }}
          onDoubleClick={() => toggleMaximize(win.id)}
          style={{ touchAction: "none" }}
          className="relative flex h-10 shrink-0 select-none items-center justify-center border-b border-black/[0.06] px-20"
        >
          <TrafficLights
            focused={focused}
            onClose={() => close(win.id)}
            onMinimize={() => minimize(win.id)}
            onMaximize={() => toggleMaximize(win.id)}
          />
          <span
            className={`pointer-events-none truncate text-[13px] font-semibold ${
              focused ? "text-ink/80" : "text-ink/40"
            }`}
          >
            {title}
          </span>
        </header>

        {/* data-lenis-prevent: scroll wewnątrz okna nie może trafiać do Lenisa */}
        <div
          data-lenis-prevent
          className={`relative min-h-0 flex-1 select-text overscroll-contain ${
            app.scroll === false ? "overflow-hidden" : "overflow-y-auto"
          }`}
          // Aplikacje pełnowysokościowe: fokus w iframe nie może przewinąć ramy
          onScroll={
            app.scroll === false
              ? (e) => {
                  e.currentTarget.scrollTop = 0;
                  e.currentTarget.scrollLeft = 0;
                }
              : undefined
          }
        >
          <WindowChromeContext.Provider value={chrome}>
            <app.Content />
          </WindowChromeContext.Provider>
        </div>
      </motion.div>

      {!win.maximized &&
        !win.minimized &&
        HANDLES.map(({ dir, className }) => (
          <div
            key={dir}
            aria-hidden
            onPointerDown={startResize(dir)}
            className={`absolute ${className}`}
            style={{ touchAction: "none" }}
          />
        ))}
    </motion.section>
  );
}

/**
 * Memo: drag nie dotyka store'u (motion values), a zmiana stanu jednego
 * okna nie renderuje pozostałych — obiekt win zachowuje referencję.
 */
export default memo(WindowFrame);
