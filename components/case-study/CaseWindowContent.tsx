"use client";

import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import CaseStudyBody from "@/components/case-study/CaseStudyBody";
import { GithubIcon } from "@/components/logos";
import { ui } from "@/data/ui";
import { useLang, useT } from "@/lib/lang-store";
import type { UxCaseStudy } from "@/data/case-studies";

/**
 * Jedna prezentacja case'a wewnątrz okna Desktop Mode, wspólna dla wszystkich
 * aplikacji projektowych. Zastępuje dawną parę „Przegląd + Case study", która
 * dublowała rolę, opis i nazwę: zwarty nagłówek okna niesie fakty przeglądu
 * (kafelek, tag, rola, technologie, akcje), a korpus case'a wchodzi bez
 * własnego tytułu (chrome="window").
 */
export default function CaseWindowContent({
  study,
  icon,
  tech,
  onOpenLive,
}: {
  study: UxCaseStudy;
  /** Kafelek marki aplikacji; bez niego nagłówek zaczyna się od tekstu. */
  icon?: ReactNode;
  /** Chipy technologii z danych przeglądu (showcase/personal). */
  tech?: readonly string[];
  /** Obecne tylko, gdy okno ma zakładkę „Na żywo". */
  onOpenLive?: () => void;
}) {
  const lang = useLang();
  const t = useT();

  const meta = [
    study.role[lang],
    ...(study.period ? [study.period[lang]] : []),
  ].join(" · ");

  const pill =
    "flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:bg-black/[0.04]";

  return (
    <div>
      <header className="mx-auto w-full max-w-[760px] px-8 pb-6 pt-7">
        <div className="flex items-center gap-4">
          {icon}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
              {study.tag[lang]}
            </p>
            <h1 className="mt-0.5 text-[19px] font-bold tracking-tight text-ink">
              {study.client}
            </h1>
            <p className="mt-0.5 truncate text-[12.5px] text-muted">{meta}</p>
          </div>
        </div>

        {tech?.length ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {tech.map((item) => (
              <li
                key={item}
                className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink/70"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-line/60 pb-6">
          {onOpenLive ? (
            <button
              type="button"
              onClick={onOpenLive}
              className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-accent/90"
            >
              {t(ui.desktop.liveTab)}
            </button>
          ) : null}
          {study.links?.live ? (
            <a
              href={study.links.live}
              target="_blank"
              rel="noopener noreferrer"
              className={pill}
            >
              {t(ui.actions.openSite)}
              <ArrowUpRight size={13} aria-hidden />
            </a>
          ) : null}
          {study.links?.repo ? (
            <a
              href={study.links.repo}
              target="_blank"
              rel="noopener noreferrer"
              className={pill}
            >
              <GithubIcon size={13} aria-hidden />
              {t(ui.actions.sourceCode)}
            </a>
          ) : null}
          {study.links?.external ? (
            <a
              href={study.links.external.url}
              target="_blank"
              rel="noopener noreferrer"
              className={pill}
            >
              {study.links.external.label[lang]}
              <ArrowUpRight size={13} aria-hidden />
            </a>
          ) : null}
        </div>
      </header>

      <CaseStudyBody study={study} chrome="window" />
    </div>
  );
}
