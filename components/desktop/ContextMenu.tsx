"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { Point } from "@/lib/window-store";
import { useT } from "@/lib/lang-store";
import { ui } from "@/data/ui";
import { EASE_APPLE } from "@/lib/motion";
import { useDesktop } from "./DesktopContext";
import { WALLPAPERS, getWallpaperStyle } from "./wallpapers";

/** Menu kontekstowe pulpitu (prawy klik w tapetę). */
export default function ContextMenu({
  point,
  wallpaperId,
  onSelectWallpaper,
  onClose,
}: {
  point: Point;
  wallpaperId: string;
  onSelectWallpaper: (id: string) => void;
  onClose: () => void;
}) {
  const { switchToSimple } = useDesktop();
  const t = useT();
  const left = Math.min(point.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 240);
  const top = Math.min(point.y, (typeof window !== "undefined" ? window.innerHeight : 800) - 260);

  const item =
    "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] font-medium text-ink transition-colors hover:bg-accent hover:text-white focus-visible:bg-accent focus-visible:text-white";

  return (
    <>
      <div
        className="fixed inset-0 z-[90]"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
        aria-hidden
      />
      <motion.div
        role="menu"
        aria-label="Menu pulpitu"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15, ease: [...EASE_APPLE] }}
        style={{ left, top }}
        className="fixed z-[95] w-60 rounded-[20px] border border-white/40 bg-[#f5f5f7]/90 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
      >
        <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          {t(ui.desktop.wallpaper)}
        </p>
        {WALLPAPERS.map((wallpaper) => (
          <button
            key={wallpaper.id}
            type="button"
            role="menuitemradio"
            aria-checked={wallpaper.id === wallpaperId}
            className={item}
            onClick={() => {
              onSelectWallpaper(wallpaper.id);
              onClose();
            }}
          >
            <span className="flex items-center gap-2.5">
              <span
                aria-hidden
                className="h-4 w-6 rounded-[4px] ring-1 ring-black/10"
                style={getWallpaperStyle(wallpaper.id)}
              />
              {t(wallpaper.name)}
            </span>
            {wallpaper.id === wallpaperId && <Check size={14} aria-hidden />}
          </button>
        ))}
        <div aria-hidden className="mx-2 my-1.5 h-px bg-black/10" />
        <button
          type="button"
          role="menuitem"
          className={item}
          onClick={() => {
            onClose();
            switchToSimple();
          }}
        >
          {t(ui.mode.switchToSimple)}
        </button>
      </motion.div>
    </>
  );
}
