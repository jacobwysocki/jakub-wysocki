"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, X } from "lucide-react";
import type { StudioProject } from "@/data/projects";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import { EASE_APPLE } from "@/lib/motion";

/**
 * Detal projektu Ultra Studio — modal:
 * okładka, opis, sekcje case study i galeria. Zamykanie: Esc, backdrop, X.
 */
export default function ProjectModal({
  project,
  onClose,
}: {
  project: StudioProject;
  onClose: () => void;
}) {
  const t = useT();
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    // Blokada scrolla tła na czas modala
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
      />
      <motion.article
        role="dialog"
        aria-modal="true"
        aria-label={project.client}
        data-lenis-prevent
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.45, ease: [...EASE_APPLE] }}
        className="relative max-h-full w-full max-w-4xl overflow-y-auto overscroll-contain rounded-card bg-white shadow-lift"
      >
        <button
          ref={closeRef}
          type="button"
          aria-label={t(ui.actions.close)}
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-black/55"
        >
          <X size={17} aria-hidden />
        </button>

        {/* Niższa okładka (21:9) — więcej treści mieści się bez scrollowania */}
        <div className="relative aspect-[16/9] w-full overflow-hidden sm:aspect-[21/9]">
          {project.image ? (
            <Image
              src={project.image}
              alt={`${project.client} — ${t(project.tag)}`}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-full w-full items-center justify-center"
              style={{ background: project.gradient }}
            >
              <span className="select-none text-h2 font-bold tracking-tight text-white/90">
                {project.client}
              </span>
            </div>
          )}
        </div>

        <div className="px-7 py-7 sm:px-10 sm:py-9">
          {/* Nagłówek z CTA po prawej — przycisk widać od razu, bez scrollowania */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-caption uppercase text-muted">{t(project.tag)}</p>
              <h2 className="mt-2 text-[28px] font-bold tracking-tight text-ink">
                {project.client}
              </h2>
            </div>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-accent px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-accent/90"
              >
                {t(project.linkLabel ?? ui.actions.openSite)}
                <ArrowUpRight size={15} aria-hidden />
              </a>
            )}
          </div>
          <p className="mt-3 max-w-prose text-body text-muted">
            {t(project.description)}
          </p>

          <ul className="mt-5 flex flex-wrap gap-1.5">
            {project.services.map((service) => (
              <li
                key={service}
                className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium text-ink/70"
              >
                {service}
              </li>
            ))}
          </ul>

          {/* Sekcje case study w dwóch kolumnach — krótszy modal, mniej scrolla */}
          <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-7 border-t border-line/60 pt-7 sm:grid-cols-2">
            {project.details.map((detail, i) => (
              <div key={i}>
                <h3 className="text-[16px] font-semibold text-ink">
                  {t(detail.title)}
                </h3>
                <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
                  {t(detail.text)}
                </p>
              </div>
            ))}
          </div>

          {/* Galeria — realne kadry po dodaniu plików do /public/projects */}
          {project.gallery.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-3">
              {project.gallery.map((src) => (
                <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image
                    src={src}
                    alt={project.client}
                    fill
                    sizes="(max-width: 768px) 50vw, 380px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.article>
    </motion.div>
  );
}
