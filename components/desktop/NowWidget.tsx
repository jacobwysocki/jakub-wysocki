"use client";

import { motion, useDragControls } from "framer-motion";
import { ArrowUpRight, MapPin } from "lucide-react";
import { contactInfo, site } from "@/data/site";
import { ui } from "@/data/ui";
import { useT, type L10n } from "@/lib/lang-store";
import { useDesktop } from "./DesktopContext";
import { DESKTOP_LAYOUT } from "./desktop-layout";

const copy = {
  now: { pl: "Teraz", en: "Now" },
  active: { pl: "Aktywny", en: "Active" },
  focus: { pl: "Aktualny fokus", en: "Current focus" },
  experience: { pl: "lat doświadczenia", en: "years experience" },
  users: { pl: "użytkowników", en: "users reached" },
  screens: { pl: "ekranów UX", en: "UX screens" },
} satisfies Record<string, L10n>;

const focusTech = [".NET", "Node.js", "React", "Next.js", "AI / ML", "UI / UX"];

export default function NowWidget({
  areaRef,
  onRaise,
  zIndex,
}: {
  areaRef: React.RefObject<HTMLDivElement | null>;
  onRaise: () => void;
  zIndex: number;
}) {
  const dragControls = useDragControls();
  const { openApp } = useDesktop();
  const t = useT();

  return (
    <motion.aside
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={areaRef}
      aria-label={t(copy.now)}
      onPointerDownCapture={onRaise}
      style={{
        bottom: DESKTOP_LAYOUT.edgeInset,
        left: DESKTOP_LAYOUT.edgeInset,
        width: DESKTOP_LAYOUT.nowWidget.width,
        zIndex,
      }}
      className="absolute overflow-hidden rounded-[28px] border border-white/20 bg-black/25 p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.24)] backdrop-blur-2xl"
    >
      <div
        onPointerDown={(event) => dragControls.start(event)}
        style={{ touchAction: "none" }}
        className="flex cursor-grab items-center gap-2 rounded-lg text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45 active:cursor-grabbing"
      >
        <span>{t(copy.now)}</span>
        <span className="h-px flex-1 bg-white/15" />
        <span className="flex items-center gap-1.5 text-white/55">
          <span className="h-1.5 w-1.5 rounded-full bg-[#30D158] shadow-[0_0_9px_rgba(48,209,88,0.8)]" />
          {t(copy.active)}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-bright">
          {t(copy.focus)}
        </p>
        <h2 className="mt-2 text-[19px] font-semibold leading-tight tracking-[-0.025em]">
          {t(site.hero.headline)}
        </h2>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/50">
          <MapPin size={12} strokeWidth={1.8} aria-hidden />
          {contactInfo.location}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {focusTech.map((tech) => (
          <span
            key={tech}
            className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[10px] font-medium text-white/65"
          >
            {tech}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 border-y border-white/10 py-3">
        <div>
          <strong className="block text-[17px] font-semibold tracking-tight">
            5+
          </strong>
          <span className="mt-0.5 block text-[8.5px] leading-tight text-white/40">
            {t(copy.experience)}
          </span>
        </div>
        <div className="border-x border-white/10 px-3">
          <strong className="block text-[17px] font-semibold tracking-tight">
            40k+
          </strong>
          <span className="mt-0.5 block text-[8.5px] leading-tight text-white/40">
            {t(copy.users)}
          </span>
        </div>
        <div className="pl-3">
          <strong className="block text-[17px] font-semibold tracking-tight">
            100+
          </strong>
          <span className="mt-0.5 block text-[8.5px] leading-tight text-white/40">
            {t(copy.screens)}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={(event) =>
          openApp("contact", { x: event.clientX, y: event.clientY })
        }
        className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-[11px] font-semibold text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        {t(ui.actions.writeToMe)}
        <ArrowUpRight size={15} strokeWidth={1.8} aria-hidden />
      </button>
    </motion.aside>
  );
}
