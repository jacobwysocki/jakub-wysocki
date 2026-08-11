"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationControls,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { AppWindowMac } from "lucide-react";
import { useWindowStore } from "@/lib/window-store";
import { useT } from "@/lib/lang-store";
import { ui } from "@/data/ui";
import { useDesktop } from "./DesktopContext";
import { AppTile, getAppsFor, type AppConfig } from "./registry";
import { DESKTOP_LAYOUT } from "./desktop-layout";

/**
 * Dock o stałych wymiarach: sloty ikon mają zawsze BASE×BASE, a powiększenie
 * to czysty transform scale (origin: dół) — pasek nie zmienia rozmiaru,
 * rosną wyłącznie ikony, wystając ponad krawędź paska.
 */
const BASE = DESKTOP_LAYOUT.dock.launcherSize;
// Skala trzymana w ryzach (1.24) + lekki lift w górę: sąsiednie ikony
// nie nachodzą na siebie, a powiększenie wciąż jest wyraźne.
const MAX_SCALE = DESKTOP_LAYOUT.dock.maxScale;
const LIFT = DESKTOP_LAYOUT.dock.lift;
const RANGE = 80;

/** Magnifikacja: odległość kursora od środka ikony → skala + lift (sprężyna). */
function useDockScale(
  mouseX: MotionValue<number>,
  ref: React.RefObject<HTMLButtonElement | null>,
) {
  const distance = useTransform(mouseX, (mx: number) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || mx === Infinity) return RANGE + 1;
    return mx - (bounds.x + bounds.width / 2);
  });
  const target = useTransform(distance, [-RANGE, 0, RANGE], [1, MAX_SCALE, 1]);
  const scale = useSpring(target, { stiffness: 420, damping: 30 });
  // Ikona unosi się proporcjonalnie do powiększenia
  const y = useTransform(scale, (s) => -((s - 1) / (MAX_SCALE - 1)) * LIFT);
  return { scale, y };
}

const tooltipClass =
  "pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/65 px-2.5 py-1 text-[12px] font-medium text-white opacity-0 backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100";

function DockItem({
  app,
  mouseX,
}: {
  app: AppConfig;
  mouseX: MotionValue<number>;
}) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const reduced = useReducedMotion();
  const t = useT();
  const { openApp } = useDesktop();
  const isOpen = useWindowStore((s) => s.windows.some((w) => w.id === app.id));
  const isMinimized = useWindowStore(
    (s) => s.windows.find((w) => w.id === app.id)?.minimized ?? false,
  );
  const restore = useWindowStore((s) => s.restore);
  const focus = useWindowStore((s) => s.focus);
  const { scale, y } = useDockScale(mouseX, ref);
  const bounce = useAnimationControls();

  const title = t(app.title);

  const onClick = () => {
    const bounds = ref.current?.getBoundingClientRect();
    const origin = bounds
      ? { x: bounds.x + bounds.width / 2, y: bounds.y }
      : undefined;
    if (!isOpen) {
      if (!reduced) {
        bounce.start({
          y: [0, -16, 0, -7, 0],
          transition: { duration: 0.7, ease: "easeOut" },
        });
      }
      openApp(app.id, origin);
    } else if (isMinimized) {
      restore(app.id);
    } else {
      focus(app.id);
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      data-app-launcher={app.id}
      onClick={onClick}
      aria-label={isOpen ? `${title} (${t(ui.desktop.windowOpen)})` : title}
      style={{ width: BASE, height: BASE }}
      className="group relative shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
    >
      <span className={tooltipClass} aria-hidden>
        {title}
      </span>
      <motion.span
        animate={bounce}
        style={reduced ? undefined : { scale, y, transformOrigin: "50% 100%" }}
        className="block h-full w-full will-change-transform"
      >
        <AppTile
          appId={app.id}
          className="h-full w-full shadow-[0_6px_16px_rgba(0,0,0,0.25)]"
        />
      </motion.span>
      <span
        aria-hidden
        className={`absolute -bottom-[7px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent-bright shadow-[0_0_7px_rgba(255,106,61,0.9)] transition-opacity duration-200 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  );
}

function DockModeSwitch({ mouseX }: { mouseX: MotionValue<number> }) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const reduced = useReducedMotion();
  const t = useT();
  const { switchToSimple } = useDesktop();
  const { scale, y } = useDockScale(mouseX, ref);

  return (
    <button
      ref={ref}
      type="button"
      onClick={switchToSimple}
      aria-label={t(ui.mode.switchToSimple)}
      style={{ width: BASE, height: BASE }}
      className="group relative shrink-0 outline-none"
    >
      <span className={tooltipClass} aria-hidden>
        {t(ui.mode.toSimple)}
      </span>
      <motion.span
        style={reduced ? undefined : { scale, y, transformOrigin: "50% 100%" }}
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[24%] will-change-transform"
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-[24%]"
          style={{
            background: "linear-gradient(145deg, #FF6A3D 0%, #C2410C 100%)",
          }}
        />
        <AppWindowMac
          strokeWidth={1.5}
          className="relative h-[52%] w-[52%] text-white/90"
          aria-hidden
        />
        <span className="pointer-events-none absolute inset-0 rounded-[24%] ring-1 ring-inset ring-white/30" />
      </motion.span>
    </button>
  );
}

/** Dock: translucentny pasek o stałej wysokości z magnifikacją ikon. */
export default function Dock() {
  const mouseX = useMotionValue(Infinity);
  const reduced = useReducedMotion();
  const dockApps = getAppsFor("desktopDock");

  return (
    <nav
      aria-label="Dock"
      style={{ bottom: DESKTOP_LAYOUT.edgeInset }}
      className="pointer-events-none absolute inset-x-0 z-[70] flex justify-center"
    >
      <div
        onMouseMove={reduced ? undefined : (e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        style={{
          borderWidth: DESKTOP_LAYOUT.dock.borderWidth,
          gap: DESKTOP_LAYOUT.dock.gap,
          paddingBlock: DESKTOP_LAYOUT.dock.paddingBlock,
          paddingInline: DESKTOP_LAYOUT.dock.paddingInline,
        }}
        className="pointer-events-auto flex items-center rounded-[25px] border-white/20 bg-black/25 shadow-[0_22px_65px_rgba(0,0,0,0.38)] backdrop-blur-2xl"
      >
        {dockApps.map((app) => (
          <DockItem key={app.id} app={app} mouseX={mouseX} />
        ))}
        <div
          aria-hidden
          style={{
            marginInline: DESKTOP_LAYOUT.dock.separatorMarginInline,
            width: DESKTOP_LAYOUT.dock.separatorWidth,
          }}
          className="h-9 bg-white/20"
        />
        <DockModeSwitch mouseX={mouseX} />
      </div>
    </nav>
  );
}
