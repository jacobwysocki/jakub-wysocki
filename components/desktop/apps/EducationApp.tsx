"use client";

import Image from "next/image";
import { ArrowUpRight, Award, GraduationCap } from "lucide-react";
import { education } from "@/data/education";
import { contactInfo } from "@/data/site";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import { DroneIcon } from "@/components/logos";
import { useDesktop } from "@/components/desktop/DesktopContext";

/**
 * Edukacja — dyplom z wyróżnieniem, dysertacja o optymalizacji tras
 * dronów (z przejściem do żywej symulacji), bootcamp, certyfikaty
 * i języki.
 */
export default function EducationApp() {
  const t = useT();
  const { openApp } = useDesktop();

  return (
    <div className="px-8 py-7">
      {/* Dyplom + portret */}
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[24%] bg-accent/10 text-accent">
          <GraduationCap size={24} strokeWidth={1.7} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[19px] font-bold tracking-tight text-ink">
            {t(education.degree.title)}
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-semibold text-accent">
            <Award size={13} strokeWidth={2.2} aria-hidden />
            {t(education.degree.grade)}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {education.degree.school} · {t(education.degree.place)} ·{" "}
            {t(education.degree.period)}
          </p>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
            {t(education.degree.projectsLabel)}
          </p>
          <ul className="mt-1.5 space-y-1.5 text-[13px] leading-relaxed text-ink/75">
            {education.degree.keyProjects.map((project, i) => (
              <li key={i} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-accent"
                />
                {t(project)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Dysertacja — wizytówka projektu algorytmicznego */}
      <div className="mt-6 rounded-2xl bg-ink p-6 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-bright">
            <DroneIcon className="h-6 w-6" />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/45">
            {t(education.dissertation.label)}
          </p>
        </div>
        <h2 className="mt-4 text-[15px] font-semibold leading-snug tracking-tight">
          {t(education.dissertation.title)}
        </h2>
        <p className="mt-2.5 text-[13px] leading-relaxed text-white/65">
          {t(education.dissertation.scope)}
        </p>
        <p className="mt-2.5 text-[13px] leading-relaxed text-white/65">
          {t(education.dissertation.platformNote)}
        </p>
        {/* Pętla/kadr z symulacji — renderuje się po podmianie media w data/education.ts */}
        {education.dissertation.media &&
          (/\.(webm|mp4)$/.test(education.dissertation.media) ? (
            <video
              src={education.dissertation.media}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
              className="mt-4 aspect-video w-full rounded-xl object-cover ring-1 ring-white/10"
            />
          ) : (
            <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl ring-1 ring-white/10">
              <Image
                src={education.dissertation.media}
                alt={t(education.dissertation.title)}
                fill
                sizes="(max-width: 768px) 100vw, 480px"
                className="object-cover"
              />
            </div>
          ))}
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {education.dissertation.algorithms.map((algo) => (
            <li
              key={algo}
              className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white/75"
            >
              {algo}
            </li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openApp("site:drone-path")}
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:bg-white/85"
          >
            {t(ui.actions.openDroneSim)}
          </button>
          <a
            href={contactInfo.droneRepo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-1.5 text-[12.5px] font-semibold text-white/85 transition-colors hover:bg-white/10"
          >
            GitHub
            <ArrowUpRight size={13} aria-hidden />
          </a>
        </div>
      </div>

      {/* Bootcamp + języki obok siebie — krótsza, mniej monotonna kolumna */}
      <div className="mt-6 grid gap-x-10 gap-y-5 border-t border-line/60 pt-5 sm:grid-cols-2">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
            Bootcamp
          </h2>
          <p className="mt-2.5 text-[14px] font-semibold text-ink">
            {education.bootcamp.school}
          </p>
          <p className="mt-0.5 text-[13px] text-muted">
            {t(education.bootcamp.title)} · {t(education.bootcamp.period)}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
            {t(education.bootcamp.scope)}
          </p>
        </div>
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
            {t(ui.sections.languages)}
          </h2>
          <ul className="mt-2.5 space-y-2.5">
            {education.languages.map((language, i) => (
              <li key={i} className="text-[13px] leading-snug">
                <span className="font-semibold capitalize text-ink">
                  {t(language.name)}
                </span>
                <span className="text-muted"> — {t(language.level)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Certyfikaty — kompaktowe chipy zamiast pionowej listy */}
      <div className="mt-5 border-t border-line/60 pt-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
          {t(ui.sections.certifications)}
        </h2>
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {education.certifications.map((cert) => (
            <li
              key={cert.code}
              className="flex items-center gap-1.5 rounded-full border border-line bg-white py-1 pl-1.5 pr-3 text-[12px]"
            >
              <span className="rounded-full bg-ink px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-white">
                {cert.code}
              </span>
              <span className="text-ink/80">{cert.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
