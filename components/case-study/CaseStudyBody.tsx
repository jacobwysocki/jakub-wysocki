"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { GithubIcon } from "@/components/logos";
import { useLang } from "@/lib/lang-store";
import type {
  CaseMedia,
  CaseMetric,
  IterationFrame,
  UxCaseStudy,
} from "@/data/case-studies";
import IterationLightbox from "@/components/case-study/IterationLightbox";

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
 *
 * `loading` jest obowiązkowe: bez niego zawieszenie importu nie ma lokalnej
 * granicy i React chowa całą zawartość aż do granicy pulpitu — ekran mruga
 * bielą tła strony przy pierwszym otwarciu okna z diagramem.
 */
const diagramFallback = () => (
  <div aria-hidden className="h-72 w-full animate-pulse rounded-2xl bg-ink/5" />
);

const caseDiagrams: Record<string, ReturnType<typeof dynamic>> = {
  VenorPipeline: dynamic(() => import("@/components/VenorPipeline"), {
    ssr: false,
    loading: diagramFallback,
  }),
  VenorConstruction: dynamic(
    () => import("@/components/case-study/VenorConstruction"),
    { loading: diagramFallback },
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
  iterationsTitle: { pl: "Iteracje", en: "Iterations" },
  enlargeIteration: { pl: "Powiększ", en: "Enlarge" },
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

/** Stabilny klucz kadru niezależny od języka czytelnika. */
function mediaKey(media: CaseMedia) {
  return typeof media.src === "string" ? media.src : media.src.pl;
}

/**
 * Oś czasu iteracji: kompaktowa siatka jako przegląd, pełny ekran na klik.
 * Miniatury pokazują CAŁĄ klatkę (object-contain na białym polu — same
 * makiety mają białe tło, więc margines jest niewidoczny) zamiast kadru
 * przyciętego do sztywnych proporcji; czytelność w naturalnej skali
 * dostarcza nakładka.
 */
function IterationHistory({ frames }: { frames: IterationFrame[] }) {
  const lang = useLang();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ol className="mt-5 grid gap-5 sm:grid-cols-2">
        {frames.map((frame, index) => (
          <li key={`${frame.src}-${index}`} className="min-w-0">
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              aria-haspopup="dialog"
              aria-label={`${sectionCopy.enlargeIteration[lang]}: ${frame.alt[lang]}`}
              className="group relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-line/70 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-accent hover:shadow-soft"
            >
              <div className="relative aspect-[4/3] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.src}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-contain transition-transform duration-300 ease-apple group-hover:scale-[1.015]"
                />
                <span
                  aria-hidden
                  className="absolute left-2 top-2 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white ring-2 ring-white"
                >
                  {index + 1}
                </span>
              </div>
            </button>
            {frame.note || frame.final ? (
              <p className="mt-2 text-[12.5px] leading-snug text-ink/75">
                {frame.note?.[lang]}
                {frame.final ? (
                  <span className="ml-1 font-semibold text-accent">
                    · {sectionCopy.finalTag[lang]}
                  </span>
                ) : null}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
      <IterationLightbox
        frames={frames}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </>
  );
}

function MediaFigure({ media }: { media: CaseMedia }) {
  const lang = useLang();
  const callouts = media.callouts ?? [];
  const src = typeof media.src === "string" ? media.src : media.src[lang];
  return (
    <figure>
      {media.kind === "video" ? (
        <video
          src={src}
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
            src={src}
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

/**
 * Animowany licznik figury wyniku. Warstwa wizualna pokazuje prawdziwą
 * wartość od pierwszego renderu aż do wejścia w viewport; zero istnieje
 * wyłącznie jako klatki biegnącej animacji. Równoległy tekst sr-only trzyma
 * stałą, sformatowaną wartość, więc czytniki ekranu i roboty renderujące JS
 * nigdy nie czytają zera.
 */
function AnimatedFigure({
  target,
  prefix,
  suffix,
  lang,
}: {
  target: number;
  prefix: string;
  suffix: string;
  lang: "pl" | "en";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // Dodatni margines startuje licznik, ZANIM figura wjedzie w kadr:
  // czytelnik nigdy nie widzi prawdziwej wartości resetującej się do zera,
  // tylko bieg już w toku. Ujemny margines robił dokładnie odwrotnie.
  //
  // rootMargin działa wyłącznie na roocie obserwatora, nigdy na przodkach
  // przycinających (spec Intersection Observer), więc w oknie pulpitu
  // rootem musi być scroller okna, nie viewport. Ten efekt jest
  // zadeklarowany PRZED useInView, więc wypełnia ref, zanim framer
  // zarejestruje obserwatora.
  const scrollRootRef = useRef<Element | null>(null);
  useEffect(() => {
    let el: HTMLElement | null = ref.current?.parentElement ?? null;
    while (el && el !== document.body) {
      const { overflowY } = getComputedStyle(el);
      if (overflowY === "auto" || overflowY === "scroll") {
        scrollRootRef.current = el;
        return;
      }
      el = el.parentElement;
    }
    scrollRootRef.current = null;
  }, []);
  const inView = useInView(ref, {
    once: true,
    margin: "0px 0px 25% 0px",
    root: scrollRootRef as React.RefObject<Element>,
  });
  const reduced = useReducedMotion();
  // Prawdziwa wartość od pierwszego renderu po obu stronach; zero istnieje
  // wyłącznie jako klatki animacji już w viewporcie. Stan zmienia się tylko
  // w callbackach requestAnimationFrame, nie synchronicznie w efekcie.
  const [display, setDisplay] = useState(target);
  const started = useRef(false);
  const format = (n: number) =>
    n.toLocaleString(lang === "pl" ? "pl-PL" : "en-GB");

  useEffect(() => {
    if (!inView || reduced || started.current) return;
    started.current = true;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      // Sześcienny ease-out w krótszym oknie: kwartowy przy 1800ms kończył
      // pełzaniem po jednej cyfrze co ~150ms i licznik wyglądał na zacięty.
      const t = Math.min((now - start) / 1100, 1);
      setDisplay(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, target]);

  return (
    <span ref={ref}>
      <span
        aria-hidden
        className="inline-block whitespace-nowrap tabular-nums"
        style={{
          minWidth: `${prefix.length + format(target).length + suffix.length}ch`,
        }}
      >
        {prefix}
        {format(display)}
        {suffix}
      </span>
      <span className="sr-only">
        {prefix}
        {format(target)}
        {suffix}
      </span>
    </span>
  );
}

/**
 * Wynik jako figura, nie wiersz tekstu. Metryka z polem `from` opowiada
 * drogę: wyszarzony punkt startu, akcentowa strzałka i wartość docelowa.
 * Jedna zmierzona liczba to jedna figura; wykresu z jednego punktu uczciwie
 * zrobić się nie da. Wartość bez cyfr (np. beta → live) zostaje statyczną
 * drogą bez licznika. DOM trzyma porządek dt → dd (wymóg listy definicji),
 * a wartość idzie nad etykietę odwróconą kolumną flex.
 */
function MetricFigure({ metric }: { metric: CaseMetric }) {
  const lang = useLang();
  // Prefiks i sufiks przeżywają w całości (waluty, procenty, jednostki);
  // animowana i formatowana per język jest wyłącznie CAŁKOWITA liczba
  // (goła albo z grupowaniem przecinkami). Wartość dziesiętna renderuje
  // się statycznie, bo licznik zgubiłby kropkę (12.5% to nie 125%).
  let parsed = metric.value.match(/^(\D*?)((?:\d{1,3}(?:,\d{3})+)|\d+)(.*)$/);
  if (parsed && /^[.,]\d/.test(parsed[3])) parsed = null;
  const target = parsed
    ? Number.parseInt(parsed[2].replace(/,/g, ""), 10)
    : null;
  const prefix = parsed ? parsed[1] : "";
  const suffix = parsed ? parsed[3] : "";
  const journey = metric.from !== undefined;

  return (
    <div
      data-testid="metric-figure"
      className={`flex flex-col-reverse rounded-2xl border border-line/70 bg-black/[0.02] ${
        journey
          ? "w-full min-w-0 px-6 py-5 sm:w-auto sm:min-w-[260px] sm:px-7 sm:py-6"
          : "min-w-[160px] px-6 py-5"
      }`}
    >
      <dt
        className={`text-[12.5px] leading-snug text-muted ${journey ? "mt-2" : "mt-0.5"}`}
      >
        {metric.label[lang]}
      </dt>
      {journey ? (
        <dd className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          {/* Punkt startu skaluje się razem z celem (ok. 0,63 jego rozmiaru):
              wyraźny stopień hierarchii zamiast liczby wyglądającej na
              pomniejszoną przez pomyłkę. Wagę różnicuje kolor, nie krój. */}
          <span className="text-[clamp(21px,5vw,34px)] font-bold leading-none tracking-tight text-muted">
            {metric.from}
          </span>
          <ArrowRight
            size={24}
            strokeWidth={2.5}
            aria-hidden
            className="self-center text-accent"
          />
          <span className="sr-only">{lang === "pl" ? "do" : "to"}</span>
          <span className="text-[clamp(34px,8vw,54px)] font-bold leading-none tracking-tight text-ink">
            {target !== null ? (
              <AnimatedFigure
                target={target}
                prefix={prefix}
                suffix={suffix}
                lang={lang}
              />
            ) : (
              metric.value
            )}
          </span>
        </dd>
      ) : (
        <dd className="text-[30px] font-bold tracking-tight text-ink">
          {metric.value}
        </dd>
      )}
    </div>
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
          : // Szeroka kolumna dla mediów; tekst i tak trzyma miarę 64ch,
            // więc szerokość strony rośnie tylko na korzyść kadrów.
            "mx-auto w-full max-w-[940px] px-6 py-10 sm:px-8"
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
                  <MediaFigure key={mediaKey(media)} media={media} />
                ))}
              </div>
            ) : null}
            {study.process.iterations ? (
              <div>
                <SubHeading>{sectionCopy.iterationsTitle[lang]}</SubHeading>
                <Prose>{study.process.iterations.note[lang]}</Prose>
                <IterationHistory frames={study.process.iterations.frames} />
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
              <MediaFigure key={mediaKey(media)} media={media} />
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
              <dl className="mt-6 flex flex-wrap gap-4">
                {study.outcome.metrics.map((metric) => (
                  <MetricFigure key={metric.label.en} metric={metric} />
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
