"use client";

import {
  BadgeCheck,
  Earth,
  Languages,
  Mountain,
  Waves,
  Zap,
  Footprints,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { education, hobbies } from "@/data/education";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import Reveal from "@/components/Reveal";

const HOBBY_ICONS: Record<string, LucideIcon> = {
  hiking: Mountain,
  diving: Waves,
  running: Footprints,
  racket: Trophy,
  travel: Earth,
};

/** Sekcja D: certyfikaty, języki i pasje — bento z drobnych kart. */
export default function Extras() {
  const t = useT();

  return (
    <section
      id="extras"
      aria-label={t(ui.sections.extras)}
      className="bg-white py-16 md:py-32"
    >
      <div className="mx-auto max-w-content px-6">
        <Reveal className="mx-auto max-w-prose text-center">
          <p className="text-caption uppercase text-muted">{t(ui.sections.extras)}</p>
          <h2 className="mt-4 text-h2">{t(ui.sections.extrasTitle)}</h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 md:mt-20 lg:grid-cols-3">
          {/* Wiersze list mają flex-1 — treść rozkłada się równomiernie
              na całą wysokość karty, zamiast zbijać się u góry */}
          <Reveal className="h-full">
            <div className="flex h-full flex-col rounded-card bg-surface p-7 ring-1 ring-line/50">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <BadgeCheck size={22} strokeWidth={1.7} aria-hidden />
              </span>
              <h3 className="mt-5 text-[19px] font-semibold tracking-tight text-ink">
                {t(ui.sections.certifications)}
              </h3>
              <ul className="mt-3 flex flex-1 flex-col divide-y divide-line/60">
                {education.certifications.map((cert) => (
                  <li key={cert.code} className="flex flex-1 items-center gap-3 py-2.5 text-[14px]">
                    <span className="w-14 shrink-0 rounded-md bg-ink py-0.5 text-center text-[10px] font-bold tracking-wide text-white">
                      {cert.code}
                    </span>
                    <span className="text-ink/80">{cert.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="h-full">
            <div className="flex h-full flex-col rounded-card bg-surface p-7 ring-1 ring-line/50">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Languages size={22} strokeWidth={1.7} aria-hidden />
              </span>
              <h3 className="mt-5 text-[19px] font-semibold tracking-tight text-ink">
                {t(ui.sections.languages)}
              </h3>
              <ul className="mt-3 flex flex-1 flex-col divide-y divide-line/60">
                {education.languages.map((language, i) => (
                  <li key={i} className="flex flex-1 flex-col justify-center py-3">
                    <p className="text-[15px] font-semibold capitalize text-ink">
                      {t(language.name)}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted">
                      {t(language.level)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.16} className="h-full">
            <div className="flex h-full flex-col rounded-card bg-ink p-7 text-white">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-bright">
                <Zap size={22} strokeWidth={1.7} aria-hidden />
              </span>
              <h3 className="mt-5 text-[19px] font-semibold tracking-tight">
                {t(ui.sections.hobbies)}
              </h3>
              <ul className="mt-3 flex flex-1 flex-col divide-y divide-white/10">
                {hobbies.map((hobby) => {
                  const Icon = HOBBY_ICONS[hobby.id] ?? Zap;
                  return (
                    <li key={hobby.id} className="flex flex-1 items-center gap-3 py-2.5">
                      <Icon
                        size={17}
                        strokeWidth={1.7}
                        aria-hidden
                        className="shrink-0 text-white/50"
                      />
                      <p className="text-[13.5px] leading-relaxed text-white/80">
                        <span className="font-semibold text-white">
                          {t(hobby.title)}.
                        </span>{" "}
                        {t(hobby.text)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
