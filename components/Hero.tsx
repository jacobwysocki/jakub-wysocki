"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { person, site } from "@/data/site";
import { useT } from "@/lib/lang-store";
import StableText from "@/components/StableText";
import { staggerContainer, wordVariants, EASE_APPLE } from "@/lib/motion";

/**
 * Slot na portret: ścieżka z person.portrait (data/site.ts), jedno źródło
 * prawdy wspólne z wizytówkami i Person.image w danych strukturalnych.
 * Gdy pliku nie ma, onError przełącza na placeholder: duotone'owa poświata
 * plus monogram. Obie wersje wtapiają się w czarne tło maską.
 */
function Portrait() {
  const [missing, setMissing] = useState(false);

  // Dwie warstwy maski przecięte zamiast jednej elipsy. Elipsa gasiła
  // wszystkie cztery krawędzie tak samo mocno, więc góra kadru rozpływała
  // się razem z bokami. Rozdzielenie osi pozwala dobrać siłę osobno:
  //  - poziomo: delikatne zejście, ledwie zmiękczające pionowe krawędzie,
  //  - pionowo: góra zostaje ostra (tam jest twarz, nie ma czego gasić),
  //    dół rozpuszcza się w tle sekcji.
  // Bez `mask-composite` warstwy sumowałyby się zamiast przecinać i maska
  // wyszłaby niemal całkiem krystaliczna, stąd obie własności naraz.
  const maskLayers = [
    "linear-gradient(to right, transparent 0%, #000 13%, #000 87%, transparent 100%)",
    "linear-gradient(to bottom, #000 0%, #000 68%, transparent 100%)",
  ].join(", ");
  const maskStyle = {
    WebkitMaskImage: maskLayers,
    maskImage: maskLayers,
    WebkitMaskComposite: "source-in",
    maskComposite: "intersect",
  } as const;

  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-[220px] md:max-w-[520px]">
      {/* Dociemnienie górnej krawędzi i narożników — tło zdjęcia jest tam
          jaśniejsze niż czerń hero, a maska nie może gasić głowy */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(50% 44% at 0% 0%, rgba(0,0,0,0.92) 0%, transparent 100%), radial-gradient(50% 44% at 100% 0%, rgba(0,0,0,0.92) 0%, transparent 100%), linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 14%)",
        }}
      />
      {missing ? (
        <div
          aria-hidden
          className="flex h-full w-full items-end justify-center overflow-hidden"
          style={{
            ...maskStyle,
            background:
              "radial-gradient(120% 90% at 50% 20%, #5F2E1D 0%, #101012 60%, #050507 100%)",
          }}
        >
          <span className="pb-14 text-[96px] font-bold tracking-tight text-white/[0.13]">
            JW
          </span>
        </div>
      ) : (
        <Image
          src={person.portrait}
          alt={`${person.fullName}, portret`}
          fill
          priority
          sizes="(max-width: 768px) 80vw, 520px"
          onError={() => setMissing(true)}
          className="object-cover object-top"
          style={maskStyle}
        />
      )}
    </div>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const t = useT();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Subtelna paralaksa: treść odpływa wolniej niż scroll i gaśnie
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 120]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const headline = t(site.hero.headline);

  return (
    <section
      ref={ref}
      id="top"
      aria-label="Intro"
      className="relative flex min-h-screen items-center overflow-hidden bg-black text-white"
    >
      {/* Delikatna poświata w tle */}
      {/* Poświata bez filtra blur — miękkość daje sam gradient (rasteryzacja
          120px blura na GPU telefonu obciąża pierwszy paint i LCP) */}
      <div
        aria-hidden
        // Tylko od `md`: w układzie dwukolumnowym poświata trzyma lewą stronę
        // nagłówka. Na mobile lewa strona kadru jest pusta, więc świeciłaby
        // w nic — tam żyje druga kopia, zakotwiczona przy pasie faktów.
        className="pointer-events-none absolute left-[20%] top-1/3 hidden h-[75vmin] w-[75vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 md:block"
        style={{
          background: "radial-gradient(circle, rgba(255,106,61,0.55) 0%, transparent 60%)",
        }}
      />

      <motion.div
        style={{ y, opacity }}
        // minmax(0, …) zamiast gołych fr: samo `1.02fr` znaczy
        // `minmax(auto, 1.02fr)`, więc kolumna nie schodziła poniżej swojego
        // min-content i przyklejała się do najdłuższego słowa nagłówka.
        // Polskie „oprogramowanie." rozpychało ją do 593px i odbierało tę
        // szerokość zdjęciu, przez co zdjęcie zmieniało rozmiar przy każdej
        // zmianie języka. Teraz podział jest czysto proporcjonalny.
        className="relative mx-auto grid w-full max-w-content grid-cols-1 items-center gap-10 px-6 pb-24 pt-28 md:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] md:gap-6 md:pb-16 md:pt-16"
      >
        <div className="text-center md:text-left">
          {/* overflow-wrap to zabezpieczenie ostatniej szansy: rozmiar
              nagłówka jest dobrany tak, by długie słowa się mieściły, ale
              gdyby kiedyś doszło dłuższe, ma złamać wyraz zamiast wejść
              na zdjęcie. */}
          <h1
            aria-label={headline}
            className="mx-auto max-w-[14ch] text-display [overflow-wrap:break-word] md:mx-0"
          >
            <StableText l10n={site.hero.headline}>
              {(text) => (
                <motion.span
                  key={text}
                  className="block"
                  variants={staggerContainer(0.08)}
                  initial="hidden"
                  animate="visible"
                >
                  {text.split(" ").map((word, i, arr) => (
                    <motion.span
                      key={`${word}-${i}`}
                      variants={wordVariants}
                      className="inline-block whitespace-pre"
                    >
                      {word}
                      {i < arr.length - 1 ? " " : ""}
                    </motion.span>
                  ))}
                </motion.span>
              )}
            </StableText>
          </h1>

          {/* Transform-only: tekst maluje się od razu (też bez JS), bez
              bramkowania opacity — spójnie z portretem i pod kątem LCP */}
          <motion.p
            className="mx-auto mt-7 max-w-prose text-body text-white/60 md:mx-0"
            initial={reduced ? false : { y: 24 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: [...EASE_APPLE], delay: 0.2 }}
          >
            <StableText l10n={site.hero.subline} />
          </motion.p>

          {/* Szybkie fakty — cichy dowód zamiast pustego sloganu */}
          <div className="relative mt-9">
            {/*
              Poświata mobilna, zakotwiczona do samego pasa faktów, a nie do
              procentu wysokości sekcji ani stałej odległości od jej środka.
              Obie te kotwice dryfują, bo wysokość treści zależy od szerokości
              ekranu: przy węższym kadrze nagłówek łamie się na więcej linii
              i pille zjeżdżają niżej. Kotwica na elemencie trzyma się ich
              zawsze. Od `md` gasimy ją, bo tam poświata wraca na lewą stronę.

              Bez ujemnego z-index: wrapper ma samo `relative`, więc nie tworzy
              kontekstu układania i `-z-10` przebijało się w górę drzewa aż pod
              czarne tło sekcji, czyli poświata znikała całkowicie. Wystarczy
              kolejność w DOM — poświata jest przed listą, więc pille malują
              się na niej.
            */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[75vmin] w-[75vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 md:hidden"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,106,61,0.55) 0%, transparent 60%)",
              }}
            />
            <motion.ul
              className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-2 md:justify-start"
              initial={reduced ? false : { y: 16 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: [...EASE_APPLE], delay: 0.3 }}
            >
              {site.hero.facts.map((fact, i) => (
                <li
                  key={i}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-1.5 text-[12px] font-medium text-white/70 backdrop-blur-sm"
                >
                  <StableText l10n={fact} className="whitespace-nowrap text-center" />
                </li>
              ))}
            </motion.ul>
          </div>
        </div>

        <motion.div
          initial={reduced ? false : { scale: 0.98, y: 16 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 1.1, ease: [...EASE_APPLE], delay: 0.1 }}
          className="order-first md:order-none"
        >
          <Portrait />
        </motion.div>
      </motion.div>

      {/* Wskaźnik scrolla — pulsująca linia */}
      <motion.div
        aria-hidden
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
      >
        <motion.span
          className="block h-12 w-px bg-gradient-to-b from-white/0 via-white/50 to-white/0"
          animate={
            reduced ? undefined : { scaleY: [1, 0.6, 1], opacity: [0.7, 0.3, 0.7] }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
