"use client";

import { useState } from "react";
import { motion, useDragControls } from "framer-motion";
import type { AppId } from "@/features/portfolio-navigation";
import type { Point } from "@/lib/window-store";
import { useT } from "@/lib/lang-store";
import { ui } from "@/data/ui";
import { useDesktop } from "./DesktopContext";
import { AppTile, getAppsFor, type AppConfig } from "./registry";
import { DESKTOP_LAYOUT } from "./desktop-layout";

function DesktopIcon({
  app,
  active,
  onOpen,
}: {
  app: AppConfig;
  active: boolean;
  onOpen: (origin?: Point) => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      data-app-launcher={app.id}
      // Klik w ikonę nie może "przeciec" do tła (menu kontekstowe/odznaczanie)
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => onOpen({ x: e.clientX, y: e.clientY })}
      aria-label={`${t(app.title)}, ${t(ui.desktop.openWindowHint)}`}
      className={`flex w-full flex-col items-center gap-1.5 rounded-2xl p-2 outline-hidden transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30 ${
        active ? "bg-white/20 ring-1 ring-white/30" : "hover:bg-white/10"
      }`}
    >
      <AppTile
        appId={app.id}
        className="h-[52px] w-[52px] shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
      />
      {/* Etykieta łamie się do dwóch linii — nic nie jest ucinane */}
      <span className="line-clamp-2 max-w-full text-center text-[10.5px] font-medium leading-[1.15] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.65)]">
        {t(app.title)}
      </span>
    </button>
  );
}

/** Kolumna ikon na pulpicie (prawy górny róg). */
export default function DesktopIcons({
  areaRef,
}: {
  areaRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { openApp } = useDesktop();
  const t = useT();
  const dragControls = useDragControls();
  // Krótkie podświetlenie klikniętej ikony — feedback zaznaczenia
  const [active, setActive] = useState<AppId | null>(null);
  const iconApps = getAppsFor("desktopIcon");

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={areaRef}
      style={{
        right: DESKTOP_LAYOUT.edgeInset,
        top: DESKTOP_LAYOUT.edgeInset,
        width: DESKTOP_LAYOUT.desktopIcons.width,
      }}
      className="absolute rounded-[28px] border border-white/20 bg-black/20 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur-2xl"
    >
      <div
        onPointerDown={(event) => dragControls.start(event)}
        style={{ touchAction: "none" }}
        className="mb-2 flex cursor-grab items-center gap-2 rounded-lg px-1 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/45 active:cursor-grabbing"
      >
        <span>{t(ui.desktop.desktop)}</span>
        <span className="h-px flex-1 bg-white/15" />
        <span>{String(iconApps.length).padStart(2, "0")}</span>
      </div>
      <div className="grid grid-cols-2 gap-1">
        {iconApps.map((app) => (
          <DesktopIcon
            key={app.id}
            app={app}
            active={active === app.id}
            onOpen={(origin) => {
              setActive(app.id);
              window.setTimeout(() => setActive(null), 450);
              openApp(app.id, origin);
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
