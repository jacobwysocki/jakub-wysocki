"use client";

import dynamic from "next/dynamic";
import { ArrowUpRight } from "lucide-react";
import { GithubIcon } from "@/components/logos";
import { useLang } from "@/lib/lang-store";
import type { CaseMedia, UxCaseStudy } from "@/data/case-studies";

/**
 * Wspólny korpus case study: jedna implementacja treści dla trasy /work/…
 * (Simple) i dla okna Desktop Mode. Otoczenie dostarcza chrom (ramkę okna,
 * scroll, nawigację), korpus dostarcza wyłącznie udokumentowaną narrację.
 *
 * Sekcje opcjonalne renderują się tylko, gdy dane istnieją: cienki projekt
 * pozostaje uczciwy przez pominięcie sekcji, nie przez wypełniacz.
 */

/**
 * Diagramy interaktywne są komponentami, nie danymi, więc mapowanie
 * nazwa → komponent żyje po stronie klienta. Import dynamiczny trzyma ciężkie
 * wizualizacje poza wspólnym chunkiem case'ów.
 */
const caseDiagrams: Record<string, ReturnType<typeof dynamic>> = {
  VenorPipeline: dynamic(() => import("@/components/VenorPipeline"), {
    ssr: false,
  }),
  VenorConstruction: dynamic(
    () => import("@/components/case-study/VenorConstruction"),
  ),
};

const sectionCopy = {
  role: { pl: "Rola", en: "Role" },
  period: { pl: "Okres", en: "Period" },
  team: { pl: "Zespół", en: "Team" },
  problem: { pl: "Problem", en: "The problem" },
  context: { pl: "Kontekst i ograniczenia", en: "Context & constraints" },
  discovery: { pl: "Rozpoznanie", en: "Discovery" },
  architecture: { pl: "Architektura", en: "Architecture" },
  process: { pl: "Proces", en: "Process" },
  decisions: { pl: "Decyzje projektowe", en: "Design decisions" },
  solution: { pl: "Rozwiązanie", en: "The solution" },
  outcome: { pl: "Wynik", en: "Outcome" },
  reflection: { pl: "Refleksja", en: "Reflection" },
  boundary: {
    pl: "Czego ta praca nie twierdzi",
    en: "What this work does not claim",
  },
  brand: { pl: "Identyfikacja", en: "Identity" },
  explorationsTitle: { pl: "Poszukiwania znaku", en: "Mark explorations" },
  constructionTitle: { pl: "Konstrukcja", en: "Construction" },
  paletteTitle: { pl: "Kolor", en: "Color" },
  finalTag: { pl: "finał", en: "final" },
  visitLive: { pl: "Zobacz na żywo", en: "See it live" },
  viewRepo: { pl: "Kod źródłowy", en: "Source code" },
  logoDark: { pl: "logo (wariant ciemny)", en: "logo (dark variant)" },
} as const;

function MediaFigure({ media }: { media: CaseMedia }) {
  const lang = useLang();
  const callouts = media.callouts ?? [];
  return (
    <figure>
      {media.kind === "video" ? (
        <video
          src={media.src}
          autoPlay
          loop
          muted
          playsInline
          aria-label={media.alt[lang]}
          className="w-full rounded-2xl shadow-soft"
        />
      ) : (
        // Znaczniki i wygaszenie żyją nad obrazem jako warstwa danych,
        // nie wypalone w bitmapie: zostają dwujęzyczne i ostre w każdej skali.
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.src}
            alt={media.alt[lang]}
            loading="lazy"
            className="w-full rounded-2xl shadow-soft"
          />
          {media.excerpt ? (
            // Dół kadru rozpływa się zamiast urywać: to górna część
            // strony, która w oryginale biegnie dalej.
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-28 rounded-b-2xl bg-gradient-to-t from-white via-white/70 to-transparent"
            />
          ) : null}
          {callouts.map((callout, index) => (
            <span
              key={callout.note.en}
              aria-hidden
              className="absolute flex h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] ring-2 ring-white"
              style={{ left: `${callout.x}%`, top: `${callout.y}%` }}
            >
              {index + 1}
            </span>
          ))}
        </div>
      )}
      {callouts.length ? (
        <ol className="mt-3 space-y-1.5">
          {callouts.map((callout, index) => (
            <li
              key={callout.note.en}
              className="flex gap-2 text-[12.5px] leading-snug text-ink/75"
            >
              <span
                aria-hidden
                className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-[9.5px] font-bold text-white"
              >
                {index + 1}
              </span>
              {callout.note[lang]}
            </li>
          ))}
        </ol>
      ) : null}
      {media.caption ? (
        <figcaption className="mt-2.5 text-[12.5px] leading-snug text-muted">
          {media.caption[lang]}
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Nagłówek sekcji w idiomie okien Desktop Mode: kicker, nie tytuł prasowy. */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-11 text-[12px] font-semibold uppercase tracking-[0.07em] text-muted first:mt-0">
      {children}
    </h2>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return (
    <p className="max-w-[64ch] text-[15px] leading-relaxed text-ink/80">
      {children}
    </p>
  );
}

const pillLink =
  "flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-black/[0.04]";

/** Tytuł pod-bloku wewnątrz rozdziału (jak tytuły detali w oknach). */
function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 mt-9 text-[15px] font-semibold text-ink">{children}</h3>
  );
}

/**
 * Rozdział identyfikacji. Powierzchnie plakiet biorą kolory ze świata marki
 * (paper/dark z brandbooka), nie z motywu portfolio: dowodem jest znak na
 * własnym tle, a nie znak przemalowany pod tę stronę.
 */
function BrandChapter({
  brand,
  client,
}: {
  brand: NonNullable<UxCaseStudy["brand"]>;
  client: string;
}) {
  const lang = useLang();
  const surfaces = brand.lockup.surfaces ?? {
    light: "#FCFAFB",
    dark: "#171217",
  };
  const Construction = brand.construction?.component
    ? caseDiagrams[brand.construction.component]
    : null;

  return (
    <>
      <SectionHeading>{sectionCopy.brand[lang]}</SectionHeading>
      <Prose>{brand.intro[lang]}</Prose>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div
          className="flex items-center justify-center rounded-2xl border border-line/70 px-8 py-14"
          style={{ background: surfaces.light }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={brand.lockup.light}
            alt={`${client}: logo`}
            className="h-9 w-auto"
          />
        </div>
        {brand.lockup.dark ? (
          <div
            className="flex items-center justify-center rounded-2xl px-8 py-14"
            style={{ background: surfaces.dark }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brand.lockup.dark}
              alt={`${client}: ${sectionCopy.logoDark[lang]}`}
              className="h-9 w-auto"
            />
          </div>
        ) : null}
      </div>
      {brand.lockup.caption ? (
        <p className="mt-2.5 max-w-[64ch] text-[12.5px] leading-snug text-muted">
          {brand.lockup.caption[lang]}
        </p>
      ) : null}
      {brand.typography ? (
        <p className="mt-1.5 max-w-[64ch] text-[12.5px] leading-snug text-muted">
          {brand.typography[lang]}
        </p>
      ) : null}

      {brand.explorations ? (
        <>
          <SubHeading>{sectionCopy.explorationsTitle[lang]}</SubHeading>
          <Prose>{brand.explorations.note[lang]}</Prose>
          <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {brand.explorations.marks.map((mark) => (
              <li key={mark.src} className="min-w-0">
                <div
                  className={`flex aspect-square items-center justify-center rounded-xl border ${
                    mark.winner ? "border-ink/40" : "border-line/70"
                  }`}
                  style={{ background: "#FCFAFB" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mark.src}
                    alt={mark.caption ? mark.caption[lang] : mark.name}
                    className="h-[52%] w-[52%]"
                  />
                </div>
                <p className="mt-1.5 truncate text-center text-[11px] leading-snug text-muted">
                  {mark.name}
                  {mark.winner ? (
                    <span className="ml-1 font-semibold text-accent">
                      · {sectionCopy.finalTag[lang]}
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {brand.construction ? (
        <>
          <SubHeading>{sectionCopy.constructionTitle[lang]}</SubHeading>
          {Construction ? (
            <div
              className="rounded-2xl border border-line/70 px-8 py-7 sm:px-14"
              style={{ background: "#FCFAFB" }}
            >
              <div className="mx-auto max-w-[380px]">
                <Construction />
              </div>
            </div>
          ) : null}
          <p className="mt-2.5 max-w-[64ch] text-[12.5px] leading-snug text-muted">
            {brand.construction.note[lang]}
          </p>
        </>
      ) : null}

      {brand.palette ? (
        <>
          <SubHeading>{sectionCopy.paletteTitle[lang]}</SubHeading>
          {brand.palette.note ? (
            <Prose>{brand.palette.note[lang]}</Prose>
          ) : null}
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {brand.palette.colors.map((color) => (
              <li
                key={color.value}
                className="overflow-hidden rounded-xl border border-line/70"
              >
                <div className="h-14" style={{ background: color.value }} />
                <div className="bg-white px-3 py-2">
                  <p className="text-[12px] font-semibold leading-snug text-ink">
                    {color.name}
                  </p>
                  <p className="font-mono text-[11px] uppercase text-muted">
                    {color.value}
                  </p>
                  {color.role ? (
                    <p className="mt-0.5 text-[11px] leading-snug text-muted">
                      {color.role[lang]}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          {brand.palette.explored ? (
            <div className="mt-5">
              <p className="max-w-[64ch] text-[12.5px] leading-snug text-muted">
                {brand.palette.explored.note[lang]}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2.5">
                {brand.palette.explored.marks.map((mark) => (
                  <li
                    key={mark.src}
                    className="flex h-14 w-14 items-center justify-center rounded-xl border border-line/60"
                    style={{ background: "#FCFAFB" }}
                    title={mark.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mark.src} alt={mark.name} className="h-8 w-8" />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

/**
 * `chrome` mówi, kto dostarcza nagłówek: trasa /work potrzebuje pełnego
 * nagłówka strony ("page"), a okno Desktop Mode ma już pasek tytułu i wspólny
 * nagłówek okna (CaseWindowContent), więc "window" pomija tytuł i metadane,
 * zostawiając kadr otwierający i sekcje.
 */
export default function CaseStudyBody({
  study,
  chrome = "page",
}: {
  study: UxCaseStudy;
  chrome?: "page" | "window";
}) {
  const lang = useLang();
  const Diagram =
    study.architecture?.diagram && "component" in study.architecture.diagram
      ? caseDiagrams[study.architecture.diagram.component]
      : null;

  const meta: { label: string; value: string }[] = [
    { label: sectionCopy.role[lang], value: study.role[lang] },
    ...(study.period
      ? [{ label: sectionCopy.period[lang], value: study.period[lang] }]
      : []),
    ...(study.team
      ? [{ label: sectionCopy.team[lang], value: study.team[lang] }]
      : []),
  ];

  return (
    <article
      className={
        chrome === "window"
          ? "mx-auto w-full max-w-[760px] px-8 pb-8"
          : "mx-auto w-full max-w-[720px] px-6 py-10 sm:px-8"
      }
    >
      {chrome === "page" ? (
        <header>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
            {study.tag[lang]}
          </p>
          <h1 className="mt-1.5 text-[28px] font-bold tracking-tight text-ink">
            {study.client}
          </h1>
          <dl className="mt-5 flex flex-wrap gap-x-9 gap-y-2">
            {meta.map((item) => (
              <div key={item.label}>
                <dt className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                  {item.label}
                </dt>
                <dd className="mt-0.5 text-[14px] font-medium text-ink">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </header>
      ) : null}

      <div className={chrome === "window" ? "" : "mt-8"}>
        {study.cover ? (
          <MediaFigure media={study.cover} />
        ) : (
          <div
            aria-hidden
            className="flex h-52 w-full items-center justify-center rounded-2xl"
            style={{ background: study.gradient }}
          >
            {study.brand?.lockup.dark ? (
              // Marka z opublikowanym lockupem pokazuje znak, nie sam napis.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={study.brand.lockup.dark}
                alt=""
                className="h-10 w-auto"
              />
            ) : (
              <span className="select-none text-[34px] font-bold tracking-tight text-white/90">
                {study.client}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-11">
        <SectionHeading>{sectionCopy.problem[lang]}</SectionHeading>
        <Prose>{study.problem[lang]}</Prose>

        {study.context?.length ? (
          <>
            <SectionHeading>{sectionCopy.context[lang]}</SectionHeading>
            <ul className="max-w-[64ch] list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink/80 marker:text-muted">
              {study.context.map((item) => (
                <li key={item.en}>{item[lang]}</li>
              ))}
            </ul>
          </>
        ) : null}

        {study.discovery ? (
          <>
            <SectionHeading>{sectionCopy.discovery[lang]}</SectionHeading>
            <p className="max-w-[64ch] text-[15px] font-medium leading-relaxed text-ink">
              {study.discovery.method[lang]}
            </p>
            <ul className="mt-2 max-w-[64ch] list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-ink/80 marker:text-muted">
              {study.discovery.findings.map((item) => (
                <li key={item.en}>{item[lang]}</li>
              ))}
            </ul>
          </>
        ) : null}

        {study.architecture ? (
          <>
            <SectionHeading>{sectionCopy.architecture[lang]}</SectionHeading>
            <Prose>{study.architecture.summary[lang]}</Prose>
            {Diagram ? (
              // Diagramy systemowe żyją na ciemnym tle (wzorzec z okna
              // Venora); poziomy scroll chroni treść pod spodem w wąskim
              // oknie, zamiast ją rozjeżdżać.
              <div className="mt-6 overflow-x-auto rounded-2xl bg-ink p-6 text-white">
                <div className="min-w-[520px]">
                  <Diagram />
                </div>
              </div>
            ) : study.architecture.diagram &&
              "src" in study.architecture.diagram ? (
              <div className="mt-6">
                <MediaFigure media={study.architecture.diagram} />
              </div>
            ) : null}
          </>
        ) : null}

        {study.process ? (
          <>
            <SectionHeading>{sectionCopy.process[lang]}</SectionHeading>
            <Prose>{study.process.note[lang]}</Prose>
            {study.process.media.length ? (
              <div className="mt-6 space-y-7">
                {study.process.media.map((media) => (
                  <MediaFigure key={media.src} media={media} />
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        <SectionHeading>{sectionCopy.decisions[lang]}</SectionHeading>
        <dl className="max-w-[64ch] space-y-6">
          {study.decisions.map((item) => (
            <div key={item.decision.en} className="flex gap-3">
              {/* Ten sam akcentowy punkt, co highlights w oknie Venora. */}
              <span
                aria-hidden
                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              />
              <div>
                <dt className="text-[15px] font-semibold leading-snug text-ink">
                  {item.decision[lang]}
                </dt>
                <dd className="mt-1.5 text-[14.5px] leading-relaxed text-ink/75">
                  {item.rationale[lang]}
                </dd>
              </div>
            </div>
          ))}
        </dl>

        <SectionHeading>{sectionCopy.solution[lang]}</SectionHeading>
        <Prose>{study.solution.summary[lang]}</Prose>
        {study.solution.media.length ? (
          <div className="mt-6 space-y-7">
            {study.solution.media.map((media) => (
              <MediaFigure key={media.src} media={media} />
            ))}
          </div>
        ) : null}

        {/* W oknie te same akcje niesie już nagłówek CaseWindowContent. */}
        {chrome === "page" &&
        (study.links?.live || study.links?.repo || study.links?.external) ? (
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            {study.links.live ? (
              <a
                href={study.links.live}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent/90"
              >
                {sectionCopy.visitLive[lang]}
                <ArrowUpRight size={14} aria-hidden />
              </a>
            ) : null}
            {study.links.repo ? (
              <a
                href={study.links.repo}
                target="_blank"
                rel="noopener noreferrer"
                className={pillLink}
              >
                <GithubIcon size={14} aria-hidden />
                {sectionCopy.viewRepo[lang]}
              </a>
            ) : null}
            {study.links.external ? (
              <a
                href={study.links.external.url}
                target="_blank"
                rel="noopener noreferrer"
                className={pillLink}
              >
                {study.links.external.label[lang]}
                <ArrowUpRight size={14} aria-hidden />
              </a>
            ) : null}
          </div>
        ) : null}

        {study.brand ? (
          <BrandChapter brand={study.brand} client={study.client} />
        ) : null}

        {study.outcome ? (
          <>
            <SectionHeading>{sectionCopy.outcome[lang]}</SectionHeading>
            {study.outcome.narrative ? (
              <Prose>{study.outcome.narrative[lang]}</Prose>
            ) : null}
            {study.outcome.metrics?.length ? (
              <dl className="mt-5 flex flex-wrap gap-x-12 gap-y-5">
                {study.outcome.metrics.map((metric) => (
                  <div key={metric.label.en}>
                    <dd className="text-[26px] font-bold tracking-tight text-ink">
                      {metric.value}
                    </dd>
                    <dt className="mt-0.5 text-[12.5px] leading-snug text-muted">
                      {metric.label[lang]}
                    </dt>
                  </div>
                ))}
              </dl>
            ) : null}
          </>
        ) : null}

        {study.reflection ? (
          <>
            <SectionHeading>{sectionCopy.reflection[lang]}</SectionHeading>
            <Prose>{study.reflection[lang]}</Prose>
          </>
        ) : null}

        {study.boundary ? (
          <>
            <SectionHeading>{sectionCopy.boundary[lang]}</SectionHeading>
            <div className="max-w-[64ch] rounded-2xl border border-line/70 bg-black/[0.02] px-5 py-4">
              <p className="text-[14.5px] leading-relaxed text-ink/80">
                {study.boundary[lang]}
              </p>
            </div>
          </>
        ) : null}
      </div>
    </article>
  );
}
