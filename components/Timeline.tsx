"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import Image from "next/image";
import { ArrowUpRight, Award, Code2, GraduationCap, Monitor } from "lucide-react";
import { engineeringRoles, studioNote, type Role } from "@/data/experience";
import { education } from "@/data/education";
import { contactInfo } from "@/data/site";
import { ui } from "@/data/ui";
import { useT, type L10n } from "@/lib/lang-store";
import { useModeStore } from "@/lib/mode-store";
import { DroneIcon } from "@/components/logos";
import Reveal from "@/components/Reveal";
import LazyVideo from "@/components/LazyVideo";
import { REVEAL_TRANSITION } from "@/lib/motion";

/** Strzałka CTA — animuje się WEWNĄTRZ przycisku (bez skalowania guzika) */
const arrowClass =
  "transition-transform duration-300 ease-apple group-hover:translate-x-[3px] group-hover:-translate-y-[3px]";

function TechPills({ tech }: { tech: string[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-1.5">
      {tech.map((item) => (
        <li
          key={item}
          className="rounded-full border border-line/80 bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink/70"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * Wpis osi czasu: jedna kolumna, wszystko wyrównane do lewej —
 * kropka siedzi na szynie, treść czyta się naturalnie z góry na dół.
 */
function TimelineItem({ entry }: { entry: Role }) {
  const reduced = useReducedMotion();
  const t = useT();

  return (
    <li className="relative pl-10 md:pl-14">
      {/* Kropka na szynie — zapala się, gdy mija linię 75% viewportu (tam gdzie
          właśnie dociera wypełnienie). Strefa 0–75% zamiast wąskiego pasma,
          żeby szybki scroll nie przeskoczył triggera. Centrowanie przez -ml
          zamiast -translate-x-1/2: animacja scale nadpisałaby transform z klasy. */}
      <motion.span
        aria-hidden
        className="absolute left-[7px] top-[7px] -ml-1.5 h-3 w-3 rounded-full ring-4 ring-white"
        initial={{ backgroundColor: "#D2D2D7", scale: 0.6 }}
        whileInView={{ backgroundColor: "#C2410C", scale: 1 }}
        viewport={{ once: true, margin: "0px 0px -25% 0px" }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />

      <motion.div
        initial={{ opacity: 0, x: reduced ? 0 : -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={reduced ? { duration: 0.2 } : REVEAL_TRANSITION}
      >
        <p className="text-caption uppercase text-muted">
          {t(entry.period)} · {t(entry.location)}
        </p>
        <h3 className="mt-2 text-h3 text-ink">
          {t(entry.role)}
          <span className="text-muted"> · {entry.company}</span>
        </h3>
        <p className="mt-3 max-w-prose text-body text-muted">{t(entry.summary)}</p>
        <ul className="mt-4 max-w-prose space-y-2 text-[15px] leading-relaxed text-ink/75">
          {entry.highlights.map((highlight, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                aria-hidden
                className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-accent"
              />
              {t(highlight)}
            </li>
          ))}
        </ul>
        <TechPills tech={entry.tech} />
      </motion.div>
    </li>
  );
}

/** Edukacja i badania — domknięcie ścieżki inżynierskiej (koniec sekcji B) */
function Education() {
  const t = useT();

  return (
    <div className="mx-auto mt-16 max-w-4xl md:mt-32">
      <Reveal className="text-center">
        <h3 className="text-h3 text-ink">{t(ui.sections.educationTitle)}</h3>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-[0.9fr_1.1fr]">
        {/* Dyplom i bootcamp — dwie osobne karty w lewej kolumnie */}
        <div className="flex flex-col gap-6">
          <Reveal className="flex-1">
            <div className="flex h-full flex-col rounded-card bg-white p-7 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <GraduationCap size={22} strokeWidth={1.7} aria-hidden />
              </span>
              <h4 className="mt-5 text-[19px] font-semibold tracking-tight text-ink">
                {t(education.degree.title)}
              </h4>
              <p className="mt-1 flex items-center gap-1.5 text-[14px] font-medium text-accent">
                <Award size={14} strokeWidth={2} aria-hidden />
                {t(education.degree.grade)}
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                {education.degree.school} · {t(education.degree.place)}
                <br />
                {t(education.degree.period)}
              </p>
              <p className="mt-4 border-t border-line/60 pt-4 text-caption uppercase text-muted">
                {t(education.degree.projectsLabel)}
              </p>
              <ul className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-ink/75">
                {education.degree.keyProjects.map((project, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent"
                    />
                    {t(project)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.05} className="flex-1">
            <div className="flex h-full flex-col rounded-card bg-white p-7 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Code2 size={22} strokeWidth={1.7} aria-hidden />
              </span>
              <h4 className="mt-5 text-[19px] font-semibold tracking-tight text-ink">
                {t(education.bootcamp.title)}
              </h4>
              <p className="mt-3 text-[14px] leading-relaxed text-muted">
                {education.bootcamp.school} · {t(education.bootcamp.period)}
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                {t(education.bootcamp.scope)}
              </p>
            </div>
          </Reveal>
        </div>

        {/* Dysertacja + link do żywej symulacji */}
        <Reveal delay={0.1} className="h-full">
          <div className="flex h-full flex-col rounded-card bg-ink p-7 text-white shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-accent-bright">
              <DroneIcon className="h-6 w-6" />
            </span>
            <p className="mt-5 text-caption uppercase text-white/40">
              {t(education.dissertation.label)}
            </p>
            <h4 className="mt-2 text-[16px] font-semibold leading-snug tracking-tight">
              {t(education.dissertation.title)}
            </h4>
            <p className="mt-3 text-[14px] leading-relaxed text-white/65">
              {t(education.dissertation.scope)}
            </p>
            {/* Pętla/kadr z symulacji — renderuje się po podmianie media w data/education.ts */}
            {education.dissertation.media &&
              (/\.(webm|mp4)$/.test(education.dissertation.media) ? (
                <LazyVideo
                  src={education.dissertation.media}
                  className="mt-4 aspect-video w-full rounded-xl ring-1 ring-white/10"
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
            <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
              <a
                href={contactInfo.droneLive}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-white/85"
              >
                {t(ui.actions.openDroneSim)}
                <ArrowUpRight size={14} aria-hidden className={arrowClass} />
              </a>
              <a
                href={contactInfo.droneRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 text-[13px] font-semibold text-white/85 transition-colors hover:bg-white/10"
              >
                GitHub
                <ArrowUpRight size={14} aria-hidden className={arrowClass} />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/** Media do sekcji Interactive OS — podmień na ścieżkę do pliku wideo/screena */
const OS_MEDIA: string | null = "/images/DemoOS.mp4";

function PersonalProjects() {
  const t = useT();

  const osHighlights = [
    {
      pl: "Pełny menedżer okien z przeciąganiem, skalowaniem krawędzi, minimalizacją i maksymalizacją, animowany sprężyną Framer Motion.",
      en: "Full window manager with drag, edge resize, minimise and maximise, spring-animated by Framer Motion.",
    },
    {
      pl: "Dock z magnifikacją ikon w stylu macOS: fizyczna odległość kursora steruje skalą i unoszeniem każdej ikony.",
      en: "macOS-style dock with icon magnification: cursor distance physically drives the scale and lift of each icon.",
    },
    {
      pl: "7 wbudowanych aplikacji, od live preview stron w iframe po experience timeline i kontakt, z sidebarami, zakładkami i podglądem na żywo.",
      en: "7 built-in apps, from live site previews in iframes to an experience timeline and contact, with sidebars, tabs and live previews.",
    },
    {
      pl: "Pasek menu z zegarem, menu kontekstowe z wyborem tapety oraz ekran startowy z progress barem: detale, które domykają wrażenie systemu.",
      en: "Menu bar with a live clock, right-click context menu with wallpaper picker, and a boot screen with a progress bar: details that sell the OS feel.",
    },
  ] as L10n[];

  return (
    // scroll-mt-24 — zapas na przyklejony pasek przy natywnym skoku po
    // kotwicy (dotyk, gdzie Lenis nie działa)
    <div id="personal-projects" className="mx-auto mt-16 max-w-4xl scroll-mt-24 md:mt-32">
      <Reveal className="text-center">
        <h3 className="text-h3 text-ink">{t(ui.sections.personalProjectsTitle)}</h3>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <Reveal className="h-full">
          <div className="flex h-full flex-col rounded-card bg-ink p-7 text-white shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-accent-bright">
              <Monitor className="h-6 w-6" />
            </span>
            <p className="mt-5 text-caption uppercase text-white/40">
              {t({ pl: "Eksperyment UI", en: "UI Experiment" })}
            </p>
            <h4 className="mt-2 text-[16px] font-semibold leading-snug tracking-tight">
              Interactive OS
            </h4>
            <p className="mt-3 text-[14px] leading-relaxed text-white/65">
              {t({
                pl: "Webowy system operacyjny jako alternatywny sposób eksploracji mojego portfolio. Okna, dock, pasek menu, tapety, boot screen: kompletne doświadczenie budowane komponent po komponencie w React.",
                en: "A web-based operating system as an alternative way to explore my portfolio. Windows, dock, menu bar, wallpapers, boot screen: a complete experience built component by component in React.",
              })}
            </p>

            {/* Pętla/kadr z OS — renderuje się po podmianie OS_MEDIA */}
            {OS_MEDIA &&
              (/\.(webm|mp4)$/.test(OS_MEDIA) ? (
                <LazyVideo
                  src={OS_MEDIA}
                  className="mt-4 aspect-video w-full rounded-xl ring-1 ring-white/10"
                />
              ) : (
                <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl ring-1 ring-white/10">
                  <Image
                    src={OS_MEDIA}
                    alt="Interactive OS"
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-cover"
                  />
                </div>
              ))}

            <ul className="mt-4 flex flex-wrap gap-1.5">
              {["Next.js", "React", "TypeScript", "Zustand", "Framer Motion"].map((tech) => (
                <li
                  key={tech}
                  className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white/75"
                >
                  {tech}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
              <button
                type="button"
                onClick={() => useModeStore.getState().setMode("desktop")}
                className="group flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-white/85"
              >
                {t(ui.actions.openDesktop)}
                <ArrowUpRight size={14} aria-hidden className={arrowClass} />
              </button>
            </div>
          </div>
        </Reveal>
        <div className="flex flex-col gap-6">
          {/* Highlights — osobna karta obok, powtarza styl "sekcji case study" z Dissertation */}
          <Reveal delay={0.1} className="flex-1">
            <div className="flex h-full flex-col rounded-card bg-surface p-7 shadow-soft ring-1 ring-line/50">
              <h4 className="text-[19px] font-semibold tracking-tight text-ink">
                {t({ pl: "Co jest w środku", en: "What's inside" })}
              </h4>
              <ul className="mt-4 flex flex-1 flex-col space-y-3 text-[13px] leading-relaxed text-ink/75">
                {osHighlights.map((highlight, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span
                      aria-hidden
                      className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent"
                    />
                    {t(highlight)}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

export default function Timeline() {
  const ref = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();
  const t = useT();

  // Wypełnienie liczone wprost z geometrii: wysokość = odległość od góry
  // szyny do linii 75% viewportu (tam zapalają się kropki — margin -25%).
  // Pomiar co scroll/resize zamiast mapowania progressu useScroll, więc
  // czubek Z DEFINICJI styka się z każdą kulką w momencie jej zapłonu
  // i żadne przesunięcia layoutu nie rozstrajają synchronizacji.
  const fillHeight = useMotionValue(0);
  const smoothHeight = useSpring(fillHeight, { stiffness: 380, damping: 44 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const line = window.innerHeight * 0.75;
      // 8px / 16px — szyna ma top-2 i bottom-2 względem <ol>
      fillHeight.set(Math.min(Math.max(line - rect.top - 8, 0), rect.height - 16));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [fillHeight]);

  // Ultra Studio otwiera oś jako najświeższe, potem historia zawodowa
  const entries = [studioNote, ...engineeringRoles];

  return (
    <section
      id="engineering"
      aria-label={t(ui.sections.engineering)}
      // scroll-mt-24 — zapas na przyklejony pasek przy natywnym skoku po
      // kotwicy (dotyk, gdzie Lenis nie działa)
      className="scroll-mt-24 bg-white py-16 md:py-32"
    >
      <div className="mx-auto max-w-content px-6">
        <Reveal className="mx-auto max-w-prose text-center">
          <p className="text-caption uppercase text-muted">
            {t(ui.sections.engineering)}
          </p>
          <h2 className="mt-4 text-h2">{t(ui.sections.engineeringTitle)}</h2>
          <p className="mt-6 text-body text-muted">{t(ui.sections.engineeringSub)}</p>
        </Reveal>

        {/* Jedna szyna po lewej — kropki na linii, treść zawsze od lewej.
            Odstępy przez flex+gap, NIE space-y: space-y daje margin-top także
            absolutnie pozycjonowanym szynom i spycha wypełnienie 64px w dół */}
        <ol
          ref={ref}
          className="relative mx-auto mt-14 flex max-w-3xl flex-col gap-16 md:mt-28 md:gap-20"
        >
          {/* Centrowanie szyn przez -ml zamiast -translate-x-1/2 — inline'owe
              transformy Framera nadpisują klasy transformujące Tailwinda */}
          <div
            aria-hidden
            className="absolute bottom-2 left-[7px] top-2 -ml-px w-0.5 rounded-full bg-line"
          />
          <motion.div
            aria-hidden
            style={reduced ? undefined : { height: smoothHeight }}
            className={`absolute left-[7px] top-2 -ml-px w-0.5 rounded-full bg-accent ${reduced ? "bottom-2" : ""
              }`}
          />
          {entries.map((entry) => (
            <TimelineItem key={entry.id} entry={entry} />
          ))}
        </ol>

        <Education />
        <PersonalProjects />
      </div>
    </section>
  );
}
