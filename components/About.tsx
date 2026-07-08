"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { site } from "@/data/site";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import { useMediaQuerySafe } from "@/lib/useMediaQuery";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";

/**
 * Pojedyncze słowo akapitu: przechodzi z szarego (muted) do czarnego
 * w wąskim oknie postępu scrolla — efekt „podświetlania" tekstu.
 */
function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.25, 1]);
  return (
    <motion.span style={{ opacity }} className="text-ink">
      {children}{" "}
    </motion.span>
  );
}

/**
 * Akapit z podświetlaniem — osobny komponent, żeby useScroll montował się
 * NA NOWO po zmianie języka (rodzic renderuje go z key={paragraph}).
 * Bez tego hook zostaje przypięty do usuniętego elementu i animacja gaśnie.
 */
function HighlightedParagraph({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.3"],
  });

  const words = text.split(" ");

  return (
    <p
      ref={ref}
      className="mx-auto mt-10 max-w-prose text-center text-h3 font-medium leading-snug"
    >
      {words.map((word, i) => {
        const start = i / words.length;
        const end = (i + 1) / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        );
      })}
    </p>
  );
}

export default function About() {
  const reduced = useReducedMotion();
  // Podświetlanie słowo-po-słowie to ~45 useTransform liczonych na każdej
  // klatce scrolla — na dotyku dajemy statyczny akapit (jak przy reduced).
  const coarse = useMediaQuerySafe("(pointer: coarse)");
  const plain = reduced || coarse;
  const t = useT();

  const paragraph = t(site.about.paragraph);

  return (
    <section id="about" aria-label={t(ui.sections.about)} className="bg-surface py-16 md:py-32">
      <div className="mx-auto max-w-content px-6">
        <Reveal className="text-center">
          <p className="text-caption uppercase text-muted">{t(ui.sections.about)}</p>
          <h2 className="mt-4 text-h2">{t(ui.sections.aboutTitle)}</h2>
        </Reveal>

        {plain ? (
          <Reveal className="mx-auto mt-10 max-w-prose">
            <p className="text-center text-h3 font-medium leading-snug">{paragraph}</p>
          </Reveal>
        ) : (
          <HighlightedParagraph key={paragraph} text={paragraph} />
        )}

        {/* Metryki z CV — count-up. Flex-wrap + justify-center: ostatni
            (nieparzysty) wiersz sam się centruje, zamiast wisieć przy lewej. */}
        <div className="mx-auto mt-16 flex max-w-5xl flex-wrap justify-center gap-x-6 gap-y-12 text-center md:mt-28">
          {site.metrics.map((metric, i) => (
            <Reveal
              key={i}
              delay={i * 0.08}
              className="basis-[calc(50%-0.75rem)] sm:basis-[calc(33.333%-1rem)] lg:basis-[calc(20%-1.2rem)]"
            >
              <p className="text-h2 tabular-nums text-ink">
                <CountUp value={metric.value} suffix={metric.suffix} />
              </p>
              <p className="mx-auto mt-2 max-w-[22ch] text-[14px] leading-snug text-muted">
                {t(metric.label)}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
