"use client";

import { HeartPulse, Printer, type LucideIcon } from "lucide-react";
import CaseWindowContent from "@/components/case-study/CaseWindowContent";
import {
  caseStudies,
  parseProjectId,
  type ProjectId,
} from "@/data/case-studies";
import { studioProjects } from "@/data/projects";

const PROJECT_GLYPHS: Partial<Record<ProjectId, LucideIcon>> = {
  alumed: HeartPulse,
  printly: Printer,
};

/**
 * Aplikacja okienkowa case study: cienki adapter między katalogiem aplikacji
 * a wspólną prezentacją case'a. Ramka okna/sheeta jest właścicielem scrolla
 * (wpis w katalogu ma scroll: true), więc tu nie ma własnych kontenerów
 * przewijania.
 *
 * Nieopublikowany rekord nie renderuje pustki: rejestr nie powinien w ogóle
 * zarejestrować takiej aplikacji, a ten strażnik zamyka lukę defensywnie.
 */
export default function CaseStudyApp({ projectId }: { projectId: ProjectId }) {
  const study = caseStudies[projectId];
  if (!study) return null;

  const Icon = PROJECT_GLYPHS[projectId];
  const project = studioProjects.find(
    (candidate) => parseProjectId(candidate.slug) === projectId,
  );

  return (
    <CaseWindowContent
      study={study}
      icon={
        Icon ? (
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[24%] text-white shadow-soft"
            style={{ background: study.gradient }}
          >
            <Icon size={24} strokeWidth={2} />
          </span>
        ) : undefined
      }
      tech={project?.services}
    />
  );
}
