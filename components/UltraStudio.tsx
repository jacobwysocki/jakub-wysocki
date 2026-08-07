"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { studioProjects, studioInfo, type StudioProject } from "@/data/projects";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import { UltraStudioLogo } from "@/components/logos";
import Reveal from "@/components/Reveal";
import ProjectCard from "@/components/ProjectCard";
import ProjectModal from "@/components/ProjectModal";
import { staggerContainer } from "@/lib/motion";
import CaseShowcase from "./CaseShowcase";
import CaseSplit from "./CaseSplit";
import { caseBridge, squizzuCase, ultraCase } from "@/data/cases";

/**
 * Sekcja Studio.
 *
 * Opowiada cztery takty: opis studia → siatka projektów → dowód pierwszy
 * (Ultra Studio) → dowód drugi (Squizzu).
 *
 * Dwa dowody z rzędu tym samym mechanizmem byłyby powtórką, więc pierwszy
 * zostaje przy przypiętym scrubie (wyśrodkowany, scroll przejęty), a drugi
 * dostaje układ split z osią kroków (CaseSplit): do lewej, scroll
 * u użytkownika, ta sama gramatyka.
 */
export default function UltraStudio() {
  const t = useT();
  const [openProject, setOpenProject] = useState<StudioProject | null>(null);

  return (
    <section
      id="studio"
      aria-label="Ultra Studio"
      // scroll-mt-24 — zapas na przyklejony pasek przy natywnym skoku po
      // kotwicy (dotyk, gdzie Lenis nie działa)
      className="scroll-mt-24 bg-surface py-16 md:py-32"
    >
      <div className="mx-auto max-w-content px-6">
        <Reveal className="mx-auto max-w-prose text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-ink ring-1 ring-white/10 shadow-soft">
            <UltraStudioLogo className="h-4 w-8" />
          </span>
          <p className="mt-5 text-caption uppercase text-muted">
            {t(ui.sections.studio)}
          </p>
          <h2 className="mt-4 text-h2">{t(studioInfo.heading)}</h2>
          <p className="mt-6 text-body text-muted">{t(studioInfo.description)}</p>
          <p className="mt-3 text-[14px] text-muted">{t(ui.sections.studioSub)}</p>
          <a
            href={studioInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-accent transition-colors hover:text-ink"
          >
            {t(ui.actions.visitStudio)}
            <ArrowUpRight size={15} aria-hidden />
          </a>
        </Reveal>

        <motion.div
          className="mt-16 grid grid-cols-1 gap-8 md:mt-24 md:grid-cols-2"
          variants={staggerContainer(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
        >
          {studioProjects.map((project) => (
            <ProjectCard
              key={project.slug}
              project={project}
              onOpen={() => setOpenProject(project)}
            />
          ))}
        </motion.div>
      </div>

      {/* Dowód pierwszy: przypięty showcase (Ultra Studio) */}
      <CaseShowcase project={ultraCase} />

      {/* Dowód drugi: Squizzu. Zdanie otwierające jest częścią tego
          komponentu, żeby cały rozdział miał jeden rytm i żeby nazwa
          projektu padała raz, a nie dwa razy z rzędu. */}
      <CaseSplit project={squizzuCase} lead={caseBridge.line} />

      <AnimatePresence>
        {openProject && (
          <ProjectModal
            project={openProject}
            onClose={() => setOpenProject(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
