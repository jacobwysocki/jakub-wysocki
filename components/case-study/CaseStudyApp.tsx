"use client";

import type { ReactNode } from "react";
import { HeartPulse } from "lucide-react";
import CaseWindowContent from "@/components/case-study/CaseWindowContent";
import { PrintlyMark } from "@/components/logos";
import {
  caseStudies,
  parseProjectId,
  type ProjectId,
} from "@/data/case-studies";
import { studioProjects } from "@/data/projects";

/** Znaki jak na kafelkach pulpitu: prawdziwy logotyp, gdy klient go ma. */
const PROJECT_GLYPHS: Partial<Record<ProjectId, ReactNode>> = {
  alumed: <HeartPulse size={24} strokeWidth={2} aria-hidden />,
  printly: <PrintlyMark className="h-[22px] w-[22px]" />,
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

  const glyph = PROJECT_GLYPHS[projectId];
  const project = studioProjects.find(
    (candidate) => parseProjectId(candidate.slug) === projectId,
  );

  return (
    <CaseWindowContent
      study={study}
      icon={
        glyph ? (
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[24%] text-white shadow-soft"
            style={{ background: study.gradient }}
          >
            {glyph}
          </span>
        ) : undefined
      }
      tech={project?.services}
    />
  );
}
