"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, LoaderCircle } from "lucide-react";
import { studioProjects, studioInfo, type StudioProject } from "@/data/projects";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import { UltraStudioLogo } from "@/components/logos";
import { useWindowChrome } from "@/components/desktop/Window";
import { EASE_APPLE } from "@/lib/motion";
import { ScaledFrame } from "./SiteApp";

type Tab = "studio" | "printly" | "alumed" | "live";

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [...EASE_APPLE] },
} as const;

/** Zakładka "Studio" — czym jest pracownia + wyróżniki */
function StudioTab({ onOpenLive }: { onOpenLive: () => void }) {
  const t = useT();
  const studioProject = studioProjects.find((p) => p.slug === "ultrastudio-site");

  return (
    <motion.div {...fade} className="px-8 py-7">
      <span className="flex h-14 w-14 items-center justify-center rounded-[24%] bg-ink ring-1 ring-white/10 shadow-soft">
        <UltraStudioLogo className="h-5 w-9" />
      </span>
      <h1 className="mt-5 text-[24px] font-bold tracking-tight text-ink">
        {t(studioInfo.heading)}
      </h1>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink/80">
        {t(studioInfo.description)}
      </p>

      <div className="mt-7 space-y-6 border-t border-line/60 pt-6">
        {studioProject?.details.map((detail, i) => (
          <div key={i}>
            <h2 className="text-[15px] font-semibold text-ink">{t(detail.title)}</h2>
            <p className="mt-1.5 max-w-[58ch] text-[14px] leading-relaxed text-muted">
              {t(detail.text)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onOpenLive}
          className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent/90"
        >
          {t(ui.desktop.liveTab)}
        </button>
        <a
          href={studioInfo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-black/[0.04]"
        >
          ultrastud.io
          <ArrowUpRight size={14} aria-hidden />
        </a>
      </div>
    </motion.div>
  );
}

/** Zakładka klienta (Printly / Alumed) — case study */
function ProjectTab({ project }: { project: StudioProject }) {
  const t = useT();

  return (
    <motion.div {...fade}>
      <div className="relative aspect-[21/9] w-full overflow-hidden">
        {project.image ? (
          <Image
            src={project.image}
            alt={`${project.client}, ${t(project.tag)}`}
            fill
            sizes="960px"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-full w-full items-center justify-center"
            style={{ background: project.gradient }}
          >
            <span className="select-none text-[40px] font-bold tracking-tight text-white/90">
              {project.client}
            </span>
          </div>
        )}
      </div>
      <div className="px-8 py-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
          {t(project.tag)}
        </p>
        <h1 className="mt-2 text-[24px] font-bold tracking-tight text-ink">
          {project.client}
        </h1>
        <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-ink/80">
          {t(project.description)}
        </p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {project.services.map((service) => (
            <li
              key={service}
              className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink/70"
            >
              {service}
            </li>
          ))}
        </ul>
        <div className="mt-7 space-y-6 border-t border-line/60 pt-6">
          {project.details.map((detail, i) => (
            <div key={i}>
              <h2 className="text-[15px] font-semibold text-ink">{t(detail.title)}</h2>
              <p className="mt-1.5 max-w-[56ch] text-[14px] leading-relaxed text-muted">
                {t(detail.text)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Ultra Studio — kreatywna, kliencka strona profilu. Zakładki:
 * Studio (o pracowni), Printly i Alumed (case studies) oraz podgląd
 * strony studia na żywo w skalowanym iframe.
 */
export default function StudioApp() {
  const t = useT();
  const [tab, setTab] = useState<Tab>("studio");
  const [loaded, setLoaded] = useState(false);
  const { focused, interacting } = useWindowChrome();

  const printly = studioProjects.find((p) => p.slug === "printly")!;
  const alumed = studioProjects.find((p) => p.slug === "alumed")!;

  const tabs: { id: Tab; label: string }[] = [
    { id: "studio", label: "Studio" },
    { id: "printly", label: "Printly" },
    { id: "alumed", label: "Alumed" },
    { id: "live", label: t(ui.desktop.liveTab) },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 select-none items-center gap-1.5 border-b border-black/[0.06] px-3">
        <div className="flex items-center gap-0.5 rounded-[9px] bg-black/[0.05] p-[3px]">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`rounded-[7px] px-3 py-[3px] text-[12px] font-semibold transition-all duration-200 ${
                tab === id
                  ? "bg-white text-ink shadow-sm ring-1 ring-black/[0.06]"
                  : "text-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <a
          href={studioInfo.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(ui.actions.visitStudio)}
          title={t(ui.actions.visitStudio)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-black/[0.06] hover:text-ink"
        >
          <ArrowUpRight size={16} strokeWidth={1.8} />
        </a>
      </div>

      {tab === "live" ? (
        // min-h-0 + overflow-hidden: patrz komentarz w SiteApp (pętla wzrostu)
        <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
          <ScaledFrame
            src={studioInfo.url}
            title="Ultra Studio · live"
            onLoad={() => setLoaded(true)}
          />
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f5f5f7]">
              <span className="flex h-14 w-14 items-center justify-center rounded-[24%] bg-ink ring-1 ring-white/10 shadow-soft">
                <UltraStudioLogo className="h-5 w-9" />
              </span>
              <p className="flex items-center gap-2 text-[13px] text-muted">
                <LoaderCircle size={14} aria-hidden className="animate-spin" />
                {t(ui.desktop.connecting)} ultrastud.io…
              </p>
            </div>
          )}
          {(!focused || interacting) && <div aria-hidden className="absolute inset-0" />}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {tab === "studio" && (
              <StudioTab key="studio" onOpenLive={() => setTab("live")} />
            )}
            {tab === "printly" && <ProjectTab key="printly" project={printly} />}
            {tab === "alumed" && <ProjectTab key="alumed" project={alumed} />}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
