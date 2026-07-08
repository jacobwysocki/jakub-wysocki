"use client";

import { useState } from "react";
import type { Point } from "@/lib/window-store";
import { useT } from "@/lib/lang-store";
import { ui } from "@/data/ui";
import { useDesktop } from "./DesktopContext";
import { APPS, AppTile, type AppConfig } from "./registry";

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
      // Klik w ikonę nie może "przeciec" do tła (menu kontekstowe/odznaczanie)
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => onOpen({ x: e.clientX, y: e.clientY })}
      aria-label={`${t(app.title)} — ${t(ui.desktop.openWindowHint)}`}
      className={`flex w-[92px] flex-col items-center gap-1.5 rounded-xl p-2 outline-none transition-colors ${
        active ? "bg-white/20 ring-1 ring-white/30" : "hover:bg-white/10"
      }`}
    >
      <AppTile appId={app.id} className="h-14 w-14 shadow-[0_8px_20px_rgba(0,0,0,0.3)]" />
      {/* Etykieta łamie się do dwóch linii — nic nie jest ucinane */}
      <span className="line-clamp-2 max-w-full text-center text-[12px] font-medium leading-[1.15] text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.55)]">
        {t(app.title)}
      </span>
    </button>
  );
}

/** Kolumna ikon na pulpicie (prawy górny róg). */
export default function DesktopIcons() {
  const { openApp } = useDesktop();
  // Krótkie podświetlenie klikniętej ikony — feedback zaznaczenia
  const [active, setActive] = useState<string | null>(null);
  const iconApps = APPS.filter((app) => app.desktopIcon);

  return (
    // flex-wrap-reverse: kolejne kolumny ikon rosną w lewo
    <div className="absolute bottom-4 right-4 top-4 flex flex-col flex-wrap-reverse content-start items-center gap-2.5">
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
  );
}
