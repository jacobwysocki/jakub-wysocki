"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  PROJECT_IDS,
  caseStudies,
  designProcess,
  type UxCaseStudy,
} from "@/data/case-studies";
import { useLang } from "@/lib/lang-store";

/**
 * Indeks case studies pod /work: jedno miejsce, które można wysłać
 * rekruterowi. Karty idą w ustalonej kolejności priorytetów (PROJECT_IDS),
 * a sekcja „Jak pracuję" odpowiada wprost na pytanie o proces projektowy.
 */

const indexCopy = {
  kicker: { pl: "Case studies", en: "Case studies" },
  title: { pl: "Wybrane realizacje", en: "Selected work" },
  lead: {
    pl: "Sześć projektów opisanych tak, jak powstawały: problem, decyzje z uzasadnieniem, rozwiązanie i uczciwy wynik.",
    en: "Six projects told the way they were built: the problem, the decisions with their rationale, the solution and an honest outcome.",
  },
  read: { pl: "Zobacz case study", en: "Read the case study" },
} as const;

function CardCover({ study }: { study: UxCaseStudy }) {
  const lang = useLang();
  if (!study.cover) {
    return (
      <div
        aria-hidden
        className="flex h-full w-full items-center justify-center"
        style={{ background: study.gradient }}
      >
        {study.brand?.lockup.dark ? (
          // Marka z opublikowanym lockupem pokazuje znak, nie sam napis.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={study.brand.lockup.dark} alt="" className="h-9 w-auto" />
        ) : (
          <span className="select-none text-[28px] font-bold tracking-tight text-white/90">
            {study.client}
          </span>
        )}
      </div>
    );
  }
  if (study.cover.kind === "video") {
    return (
      <video
        src={study.cover.src}
        autoPlay
        loop
        muted
        playsInline
        aria-label={study.cover.alt[lang]}
        className="h-full w-full object-cover"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={study.cover.src}
      alt={study.cover.alt[lang]}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );
}

export default function WorkIndex() {
  const lang = useLang();
  const studies = PROJECT_IDS.flatMap((id) => {
    const study = caseStudies[id];
    return study ? [study] : [];
  });

  return (
    <div className="mx-auto w-full max-w-[1040px] px-6 py-14 sm:px-8">
      <header className="max-w-[64ch]">
        <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
          {indexCopy.kicker[lang]}
        </p>
        <h1 className="mt-2 text-[34px] font-bold tracking-tight text-ink">
          {indexCopy.title[lang]}
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink/80">
          {indexCopy.lead[lang]}
        </p>
      </header>

      <ul className="mt-12 grid gap-7 sm:grid-cols-2">
        {studies.map((study) => (
          <li key={study.slug}>
            <Link
              href={`/work/${study.slug}`}
              className="group block overflow-hidden rounded-2xl border border-line/70 bg-white shadow-soft transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="aspect-[16/10] w-full overflow-hidden">
                <CardCover study={study} />
              </div>
              <div className="px-6 py-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                  {study.tag[lang]}
                </p>
                <h2 className="mt-1.5 text-[19px] font-bold tracking-tight text-ink">
                  {study.client}
                </h2>
                <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-ink/75">
                  {study.problem[lang]}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-accent">
                  {indexCopy.read[lang]}
                  <ArrowUpRight
                    size={14}
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-16 border-t border-line/60 pt-12">
        <h2 className="text-[24px] font-bold tracking-tight text-ink">
          {designProcess.title[lang]}
        </h2>
        <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-ink/80">
          {designProcess.intro[lang]}
        </p>
        <ol className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {designProcess.steps.map((step, index) => (
            <li key={step.title.en} className="flex gap-4">
              <span
                aria-hidden
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[13px] font-bold text-accent"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-ink">
                  {step.title[lang]}
                </h3>
                <p className="mt-1 max-w-[52ch] text-[14px] leading-relaxed text-ink/75">
                  {step.text[lang]}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
