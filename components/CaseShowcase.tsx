"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { useT } from "@/lib/lang-store";
import { useMediaQuerySafe } from "@/lib/useMediaQuery";
import Reveal from "@/components/Reveal";
import type { FeaturedCase } from "@/data/cases";

/**
 * Pojedynczy krok narracji: wjeżdża i wyjeżdża w swoim oknie postępu
 * scrolla (scrub), pozycjonowany absolutnie nad przypiętym obrazem.
 */
function Step({
  title,
  text,
  progress,
  index,
  total,
}: {
  title: string;
  text: string;
  progress: MotionValue<number>;
  index: number;
  total: number;
}) {
  const slice = 1 / total;
  const start = index * slice;
  const end = start + slice;
  // Krok jest w pełni widoczny w środku swojego okna, na brzegach gaśnie
  const opacity = useTransform(
    progress,
    [start, start + slice * 0.25, end - slice * 0.25, end],
    [0, 1, 1, index === total - 1 ? 1 : 0]
  );
  const y = useTransform(progress, [start, start + slice * 0.25], [32, 0]);

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-x-0 bottom-0 px-8 pb-10 text-center md:px-16 md:pb-14"
    >
      <h3 className="text-h3 text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-[46ch] text-body text-white/60">{text}</p>
    </motion.div>
  );
}

/**
 * Pinned showcase: obraz projektu przypięty na środku ekranu
 * (position: sticky), nad nim scrub-owane kolejne detale case study.
 * Bez GSAP: sticky + useScroll dają ten sam mechanizm i bezproblemowo
 * współpracują z Lenisem.
 *
 * Jedyna różnica względem wersji live: case jest parametrem, nie importem.
 * Sekcja Studio pokazuje tu dwa projekty, więc mechanizm musiał przestać
 * wiedzieć, o którym z nich opowiada.
 */
export default function CaseShowcase({ project }: { project: FeaturedCase }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // Pinned scrub = useScroll + ~9 useTransform + warstwa sticky na klatkę.
  // Na dotyku dajemy prostą, ułożoną wersję (jak przy reduced motion).
  const coarse = useMediaQuerySafe("(pointer: coarse)");
  const t = useT();
  const steps = project.steps.map((step) => ({
    title: t(step.title),
    text: t(step.text),
  }));

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const imageScale = useTransform(scrollYProgress, [0, 0.4], [1.06, 1]);

  // Reduced motion / dotyk: zwykła sekcja bez pinningu
  if (reduced || coarse) {
    return (
      <div className="mx-auto mt-16 max-w-content px-6 md:mt-24">
        <CaseImage project={project} />
        <div className="mt-10 space-y-10 text-center">
          {steps.map((step) => (
            <Reveal key={step.title}>
              <h3 className="text-h3 text-ink">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-prose text-body text-muted">
                {step.text}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    );
  }

  return (
    // Wysokość kontenera wyznacza długość scrub-a: ~1 ekran na krok.
    // Na mobile mniej (120vh/krok byłoby męczące przy czytaniu).
    <div
      ref={ref}
      className="relative mt-16 md:mt-32"
      style={{ height: `${(steps.length + 1) * 80}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center justify-center px-6">
        <div className="relative aspect-[4/5] w-full max-w-content overflow-hidden rounded-card shadow-lift sm:aspect-[16/10]">
          <motion.div
            style={{ scale: imageScale }}
            className="h-full w-full will-change-transform"
          >
            <CaseImage project={project} fill />
          </motion.div>
          {/* Gradient dociążający dół, żeby tekst kroków był czytelny */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
          />
          <div className="absolute left-8 top-8 md:left-16 md:top-12">
            <p className="text-caption uppercase text-white/50">
              {t(project.tag)}
            </p>
            <p className="mt-1 text-h3 text-white">{project.client}</p>
          </div>
          {steps.map((step, i) => (
            <Step
              key={step.title}
              {...step}
              progress={scrollYProgress}
              index={i}
              total={steps.length}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Obraz wyróżnionego case'a albo gradientowy placeholder.
 *
 * `sizes` i kadrowanie są parametrami, bo ten sam kadr trafia raz w szeroką
 * ramę na pełną szerokość treści, a raz w wąską kolumnę układu split:
 * przy stałym `sizes` ta druga pobierałaby dwa razy za duży plik.
 *
 * Opis alternatywny bierzemy z danych case'a, gdy tam jest. Etykieta z nazwy
 * klienta zostaje jako awaryjna: mówi, co to za projekt, ale nie mówi, co
 * widać na zdjęciu.
 */
export function CaseImage({
  project,
  fill = false,
  sizes = "(max-width: 1120px) 100vw, 1120px",
  // Kadr przypięty wyżej: mockup siedzi nad strefą tekstu kroków
  objectClass = "object-bottom",
}: {
  project: FeaturedCase;
  fill?: boolean;
  sizes?: string;
  objectClass?: string;
}) {
  const t = useT();
  const label = project.alt ? t(project.alt) : `${project.client}, case study`;
  if (project.image) {
    return (
      <Image
        src={project.image}
        alt={label}
        fill={fill}
        width={fill ? undefined : 1600}
        height={fill ? undefined : 1000}
        sizes={sizes}
        className={
          fill
            ? `object-cover ${objectClass}`
            : "w-full rounded-card object-cover"
        }
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={label}
      className={
        fill ? "h-full w-full" : "aspect-[16/10] w-full rounded-card shadow-lift"
      }
      style={{ background: project.gradient }}
    />
  );
}
