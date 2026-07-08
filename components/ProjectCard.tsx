"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import type { StudioProject } from "@/data/projects";
import { useT } from "@/lib/lang-store";
import { SPRING, revealVariants } from "@/lib/motion";

export default function ProjectCard({
  project,
  onOpen,
}: {
  project: StudioProject;
  onOpen: () => void;
}) {
  const reduced = useReducedMotion();
  const t = useT();

  return (
    <motion.article variants={revealVariants} className="h-full">
      <motion.button
        type="button"
        onClick={onOpen}
        aria-label={`${project.client} — ${t(project.tag)}`}
        whileHover={reduced ? undefined : { scale: 1.02, y: -4 }}
        whileTap={reduced ? undefined : { scale: 0.99 }}
        transition={SPRING}
        className="group flex h-full w-full cursor-pointer flex-col rounded-card bg-white p-3 text-left shadow-soft transition-shadow duration-500 ease-apple hover:shadow-lift"
      >
        <div className="relative aspect-[4/3] shrink-0 overflow-hidden rounded-[14px]">
          {project.image ? (
            <motion.div
              className="h-full w-full"
              whileHover={reduced ? undefined : { scale: 1.06 }}
              transition={SPRING}
            >
              <Image
                src={project.image}
                alt={`${project.client} — ${t(project.tag)}`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </motion.div>
          ) : (
            /* Placeholder do czasu dostarczenia realnych okładek */
            <motion.div
              aria-hidden
              className="flex h-full w-full items-center justify-center"
              style={{ background: project.gradient }}
              whileHover={reduced ? undefined : { scale: 1.06 }}
              transition={SPRING}
            >
              <span className="select-none text-h3 font-bold tracking-tight text-white/90">
                {project.client}
              </span>
            </motion.div>
          )}
          {/* Znacznik "otwiera się" — plus w rogu */}
          <span
            aria-hidden
            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100"
          >
            <Plus size={16} strokeWidth={2.2} />
          </span>
        </div>

        <div className="flex-1 px-3 pb-3 pt-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted">
            {t(project.tag)}
          </p>
          <h3 className="mt-1.5 text-[19px] font-semibold tracking-tight text-ink">
            {project.client}
          </h3>
          <p className="mt-1 text-[14px] leading-relaxed text-muted">
            {t(project.description)}
          </p>
        </div>
      </motion.button>
    </motion.article>
  );
}
