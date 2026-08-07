"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { contactInfo, person, site } from "@/data/site";
import { ui } from "@/data/ui";
import { useT, type L10n } from "@/lib/lang-store";
import { useMediaQuerySafe } from "@/lib/useMediaQuery";
import Reveal from "@/components/Reveal";
import CountUp from "@/components/CountUp";
import StableText from "@/components/StableText";

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
 *
 * Jedyna różnica wobec wersji produkcyjnej: akapit nie jest wyśrodkowany,
 * bo stoi teraz w kolumnie obok portretu i musi trzymać tę samą lewą
 * krawędź co reszta sekcji.
 */
function HighlightedParagraph({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.3"],
  });

  const words = text.split(" ");

  return (
    <p ref={ref} className="max-w-prose text-h3 font-medium leading-snug">
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

/** Etykiety wierszy metryczki przy portrecie — tylko ten układ ich używa. */
const metaLabels = {
  profession: { pl: "Zawód", en: "Profession" },
  location: { pl: "Lokalizacja", en: "Location" },
  founder: { pl: "Współzałożyciel", en: "Co-founder of" },
} satisfies Record<string, L10n>;

/**
 * Portret z sekcji „O mnie". Ścieżka z person.portrait (data/site.ts), to samo
 * źródło co Person.image w danych strukturalnych. Gdy pliku nie ma, onError
 * przełącza na monogram na jasnej płycie — kadr zostaje na swoim miejscu
 * i układ się nie sypie.
 */
function Portrait() {
  const [missing, setMissing] = useState(false);

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-line/50">
      {missing ? (
        <div
          aria-hidden
          className="flex h-full w-full items-center justify-center bg-gradient-to-b from-white to-surface"
        >
          <span className="text-[64px] font-bold tracking-tight text-ink/10">
            JW
          </span>
        </div>
      ) : (
        <Image
          src={person.portrait}
          alt={`${person.fullName}, portret`}
          fill
          sizes="(max-width: 768px) 92vw, 420px"
          onError={() => setMissing(true)}
          // object-top: kadr jest pionowy, więc przy przycięciu ma zniknąć
          // dół klatki, nigdy głowa.
          className="object-cover object-top"
        />
      )}
    </div>
  );
}

/**
 * Sekcja „O mnie" konceptu 01.
 *
 * Mechanizmy są produkcyjne co do znaku: akapit podświetlany scrollem
 * i licznikowe metryki z CV. Zmienia się kompozycja — zdjęcie zeszło
 * z pierwszego ekranu i pracuje tutaj, przy biografii: lewa kolumna to
 * portret plus trzy wiersze twardych danych (zawód, miasto, firmy), prawa
 * to zdanie o warsztacie. Na wąskim ekranie kolumny układają się w jedną,
 * portretem do góry — jest wtedy wejściem w sekcję, nie ozdobnikiem na jej
 * końcu.
 */
export default function About() {
  const reduced = useReducedMotion();
  // Podświetlanie słowo-po-słowie to ~45 useTransform liczonych na każdej
  // klatce scrolla — na dotyku dajemy statyczny akapit (jak przy reduced).
  const coarse = useMediaQuerySafe("(pointer: coarse)");
  const plain = reduced || coarse;
  const t = useT();

  const paragraph = t(site.about.paragraph);

  const metaRows: { label: L10n; value: string }[] = [
    { label: metaLabels.profession, value: t(person.jobTitle) },
    { label: metaLabels.location, value: contactInfo.location },
    { label: metaLabels.founder, value: `${site.studio} · Squizzu` },
  ];

  return (
    <section id="about" aria-label={t(ui.sections.about)} className="bg-surface py-16 md:py-32">
      <div className="mx-auto max-w-content px-6">
        <Reveal>
          <p className="text-caption uppercase text-muted">{t(ui.sections.about)}</p>
          <h2 className="mt-4 max-w-[16ch] text-h2">{t(ui.sections.aboutTitle)}</h2>
        </Reveal>

        <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] md:gap-14">
          <Reveal className="mx-auto w-full max-w-[340px] md:mx-0 md:max-w-none">
            <Portrait />
          </Reveal>

          <div className="md:pt-2">
            {plain ? (
              <Reveal>
                <p className="max-w-prose text-h3 font-medium leading-snug">{paragraph}</p>
              </Reveal>
            ) : (
              <HighlightedParagraph key={paragraph} text={paragraph} />
            )}

            {/* Twarde dane pod zdaniem o warsztacie, nie pod portretem:
                portret 4:5 jest wyższy niż akapit i to tutaj kolumna miała
                pustkę do zagospodarowania. Kreski trzymają szerokość akapitu
                (max-w-prose), więc pion lewej krawędzi zostaje wspólny. */}
            <Reveal delay={0.1}>
              <dl className="mt-9 max-w-prose border-t border-line/70 md:mt-11">
                {metaRows.map((row, i) => (
                  <div
                    key={i}
                    className="flex items-baseline justify-between gap-6 border-b border-line/70 py-3"
                  >
                    <dt className="shrink-0 text-[12px] font-medium uppercase tracking-[0.06em] text-ink/55">
                      <StableText l10n={row.label} />
                    </dt>
                    <dd className="text-right text-[14px] font-medium leading-snug text-ink">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </div>

        {/* Metryki z CV — count-up. Flex-wrap + justify-center: ostatni
            (nieparzysty) wiersz sam się centruje, zamiast wisieć przy lewej. */}
        <div className="mt-16 flex flex-wrap justify-center gap-x-6 gap-y-12 text-center md:mt-28">
          {site.metrics.map((metric, i) => (
            <Reveal
              key={i}
              delay={i * 0.08}
              className="basis-[calc(50%-0.75rem)] sm:basis-[calc(33.333%-1rem)] lg:basis-[calc(20%-1.2rem)]"
            >
              <p className="text-h2 tabular-nums text-ink">
                <CountUp value={metric.value} suffix={t(metric.suffix)} />
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
