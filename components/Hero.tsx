"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { contactInfo, site } from "@/data/site";
import { ui } from "@/data/ui";
import { useLang, useT, type L10n } from "@/lib/lang-store";
import StableText from "@/components/StableText";
import { EASE_APPLE, staggerContainer } from "@/lib/motion";
import { useAnchorNav } from "@/components/SmoothScrollProvider";
import DotField from "./DotField";

/**
 * Ten sam easing co w reszcie repo, ale jako krotka. Rozpakowanie
 * `[...EASE_APPLE]` w zmiennej (a nie prosto w propie JSX) traci kontekst
 * typu i schodzi do `number[]`, którego framer nie przyjmuje jako krzywej.
 */
const EASE: [number, number, number, number] = [
  EASE_APPLE[0],
  EASE_APPLE[1],
  EASE_APPLE[2],
  EASE_APPLE[3],
];

/**
 * Dyscypliny — trzy rzeczy, które faktycznie robię. Nie wymyślam ich tutaj:
 * to rozpisany na wiersze `person.jobTitle` plus branding, który jest
 * w `person.knowsAbout` i w opisie Ultra Studio. Tekst mieszka lokalnie,
 * bo to element kompozycji tego hero, a nie fakt o osobie — data/site.ts
 * zostaje źródłem prawdy dla faktów, nie dla układu.
 */
const disciplines: L10n[] = [
  { pl: "Inżynieria oprogramowania", en: "Software Engineering" },
  { pl: "Projektowanie UX/UI", en: "UX/UI Design" },
  { pl: "Branding", en: "Branding" },
];

/** Nagłówki dostępnościowe obu list hero. */
const listLabels = {
  disciplines: { pl: "Czym się zajmuję", en: "What I do" },
  facts: { pl: "W skrócie", en: "At a glance" },
} satisfies Record<string, L10n>;

/** Zegar lokalny Krakowa — ten sam mechanizm co w stopce produkcyjnej. */
function useLocalTime(lang: string) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const format = () =>
      setTime(
        new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: contactInfo.timezone,
        }).format(new Date()),
      );
    format();
    const id = setInterval(format, 30_000);
    return () => clearInterval(id);
  }, [lang]);
  return time;
}

/**
 * Wejście słowa nagłówka: SAM transform, bez opacity.
 *
 * Wariant produkcyjny (lib/motion.ts) gasi słowa do zera i podnosi je
 * dopiero po hydratacji. Tam ma to sens, bo nagłówek stoi w kolumnie obok
 * zdjęcia. Tutaj nagłówek jest całym pierwszym kadrem i jednocześnie
 * kandydatem na LCP — nie może zależeć od tego, czy JavaScript dojedzie.
 * Przy samym przesunięciu HTML z serwera ma tekst widoczny od pierwszej
 * klatki, a animacja tylko go dostawia na miejsce.
 */
const wordRise: Variants = {
  hidden: { y: "38%" },
  visible: { y: 0, transition: { duration: 0.9, ease: EASE } },
};

/**
 * Łamanie nagłówka zostawiam przeglądarce, ale z jednym twardym zakazem:
 * wiersz nie może kończyć się jednoliterowym słowem. Bez tej reguły polski
 * nagłówek łamie się na „Buduję marki i / oprogramowanie." — najrówniej
 * matematycznie i nie do przyjęcia typograficznie. Sklejam więc takie słowo
 * z następnym twardą spacją: reguła jest językowo neutralna, więc PL i EN
 * przechodzą tą samą ścieżką, bez listy spójników.
 */
function typeset(text: string): string[] {
  const out: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const prev = out[out.length - 1];
    // Twarda spacja zapisana kodem, nie znakiem: w źródle jest nieodróżnialna
    // od zwykłej i pierwsza porządkująca zmiana skasowałaby ją bez śladu.
    if (prev && prev.length === 1) out[out.length - 1] = `${prev}\u00A0${word}`;
    else out.push(word);
  }
  return out;
}

/**
 * Strzałka w przyciskach. Jedzie w prawo O CZTERY PIKSELE WEWNĄTRZ pudełka
 * przycisku, którego geometria się nie rusza — cały ruch dzieje się pod
 * kursorem, nie pod nim uciekając.
 */
function Arrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="relative h-4 w-4 shrink-0 transition-transform duration-500 ease-apple group-hover:translate-x-1 group-focus-visible:translate-x-1"
    >
      <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" />
    </svg>
  );
}

/**
 * Nagłówek hero — jedno zdanie przez całą szerokość kolumny treści.
 *
 * Skala: produkcja trzyma 72 px, bo tam zdanie dzieli kadr ze zdjęciem.
 * Tutaj ma całą kolumnę, więc idzie wyżej. Granicę wyznacza najdłuższe
 * nierozrywalne słowo, polskie „oprogramowanie.": zmierzone na produkcji ma
 * 524 px przy 72 px i zerowym trackingu, czyli ~7,28 px na każdy piksel
 * rozmiaru. Przy 104 px to 757 px w kolumnie 1072 px (max-w-content minus
 * px-6 z obu stron) — mieści się z zapasem. Przy 390 px okna clamp schodzi
 * do 40 px, słowo ma 291 px w kolumnie 342 px. Poniżej 360 px podłoga spada
 * do 34 px: sklejka „i oprogramowanie.” ma wtedy około 251 px i mieści się
 * także w 257 px realnej kolumny Chrome przy viewportcie 320 px. Podnosząc
 * rozmiar albo rozluźniając tracking, przelicz wszystkie trzy końce.
 */
function Headline() {
  const reduced = useReducedMotion();
  const t = useT();

  return (
    <h1
      // Nazwa dostępna z pełnego zdania: wizualnie słowa są osobnymi
      // elementami, a twarda spacja w sklejce nie należy do treści.
      aria-label={t(site.hero.headline)}
      className="text-[clamp(34px,8vw,104px)] font-bold leading-[1.02] tracking-[-0.018em] text-ink [overflow-wrap:break-word] min-[360px]:text-[clamp(40px,8vw,104px)]"
    >
      <span className="block">
        <StableText l10n={site.hero.headline}>
          {(text) => (
            <motion.span
              key={text}
              className="block"
              variants={staggerContainer(0.07)}
              initial={reduced ? false : "hidden"}
              animate="visible"
            >
              {typeset(text).map((word, i, arr) => (
                <motion.span
                  key={`${word}-${i}`}
                  variants={wordRise}
                  className="inline-block whitespace-pre"
                >
                  {word}
                  {i < arr.length - 1 ? " " : ""}
                </motion.span>
              ))}
            </motion.span>
          )}
        </StableText>
      </span>
    </h1>
  );
}

/**
 * Hero konceptu 01 — kadr zbudowany ze zdania, nie z obrazu.
 *
 * Pierwszy ekran jest jasny i tekstowy: nad zdaniem cienki wiersz miejsca
 * i godziny, pod nim podpis, pas faktów, a niżej ponumerowana lista
 * dyscyplin z wezwaniami do działania. Cała hierarchia siedzi w skali
 * i w kreskach, nie w dekoracji.
 *
 * Za tym wszystkim pracuje pole kropek (DotField): gęsta, regularna matryca
 * punktów na canvasie, która rozsuwa się przed kursorem, a po kliknięciu w tło
 * rozlatuje się wybuchem i wraca sprężyną. Pole daje pierwszemu ekranowi
 * fakturę i jeden powód, żeby w nim pogrzebać, nie odbierając ani jednego
 * punktu kontrastu tekstowi.
 *
 * Dwa systemy kresek, dwie osie. Dyscypliny są rozdzielone poziomo, fakty
 * pionowo — ta sama waga i ten sam kolor linii, inny kierunek. To jest
 * ta sama gramatyka, nie dwie kopie tej samej listy.
 *
 * Portretu tu nie ma świadomie — zdjęcie pracuje w sekcji „O mnie", gdzie
 * jest przy biografii, a nie zamiast niej.
 *
 * Warunek brzegowy: to musi się bronić także wtedy, gdy nic z tego nie
 * działa. Bez JS-a nagłówek, podpis, fakty, dyscypliny i oba przyciski są
 * w HTML-u z serwera; znika tylko godzina, której serwer nie ma prawa znać,
 * i pole kropek, które jest dodatkiem, nie warunkiem.
 */
export default function Hero() {
  const t = useT();
  const lang = useLang();
  const anchor = useAnchorNav();
  const reduced = useReducedMotion();
  const localTime = useLocalTime(lang);
  /**
   * Cała obsługa wskaźnika dla pola kropek wisi na tej sekcji, nie na canvasie:
   * canvas jest `pointer-events-none`, bo inaczej zjadałby kliknięcia
   * w przyciski. Sekcja łapie ruch i kliknięcia za niego, a pole samo odsiewa
   * te, które trafiły w link albo przycisk.
   */
  const stage = useRef<HTMLElement>(null);

  /** Jedno wejście na całą sekcję: sam transform, wspólna krzywa, drabinka opóźnień */
  const rise = (delay: number) => ({
    initial: reduced ? false : { y: 22 },
    animate: { y: 0 },
    transition: { duration: 0.8, ease: EASE, delay },
  });

  /**
   * Wspólna podstawa obu CTA. Magnetyzmu tu nie ma i nie będzie: przycisk,
   * który ucieka spod kursora, wygląda efektownie na filmiku i przeszkadza
   * przy każdym kliknięciu. Zamiast ruchu pudełka jest ruch WEWNĄTRZ pudełka
   * — wypełnienie wjeżdża od lewej, strzałka przesuwa się o cztery piksele,
   * a geometria przycisku stoi w miejscu. Ten sam gest dostaje `:hover`
   * i `:focus-visible`, więc klawiatura widzi dokładnie to samo co mysz.
   *
   * Poniżej `sm` oba przyciski idą na pełną szerokość, jeden pod drugim.
   * Przy polskich podpisach zawijały się w dwie postrzępione pigułki
   * (196 i 193 px w kolumnie 342 px); przy okazji rośnie pole dotyku.
   */
  const pill =
    "group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-8 py-3 text-center text-[16px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:w-auto sm:py-3.5 sm:text-left";

  /** Warstwa wypełnienia: skalowanie od lewej krawędzi, przycięte do pigułki. */
  const sweep =
    "absolute inset-0 origin-left scale-x-0 transition-transform duration-500 ease-apple group-hover:scale-x-100 group-focus-visible:scale-x-100";

  return (
    <section
      ref={stage}
      id="top"
      aria-label="Intro"
      // Kreska na dole zamiast zmiany tła: sekcja „O mnie" niżej jest w tym
      // samym tonie (bg-surface), a produkcyjna naprzemienność surface/white
      // zaczyna się dopiero od niej. Gdyby hero było białe albo About
      // przeszło na biel, rytm rozjechałby się o jedną sekcję dalej.
      // pt-16 to podłoga, nie wybór stylistyczny: pasek nawigacji ma
      // dokładnie 64 px i wiersz stanu ma się zaczynać pod nim, nie za nim.
      // Na wysokim telefonie hero kończy się po 700 px, zamiast pompować
      // pustą przestrzeń do pełnego 100svh. Desktop zachowuje pełny kadr.
      className="relative flex min-h-[min(100svh,700px)] scroll-mt-24 flex-col justify-center overflow-hidden border-b border-line/60 bg-surface pb-12 pt-16 text-ink md:min-h-[100svh] md:pb-28 md:pt-32"
    >
      <DotField target={stage} />

      <div className="relative z-10 mx-auto w-full max-w-content px-6">
        {/* Wiersz stanu — tylko to, co jest prawdą w tej sekundzie: miasto
            i godzina u mnie. Komunikat o statusie systemów mieszka w stopce,
            przy linkach i danych kontaktowych, i tam jest na miejscu. */}
        <motion.div
          className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium tabular-nums text-ink/70"
          {...rise(0.05)}
        >
          <span>{contactInfo.location}</span>
          {/* Godzina dochodzi dopiero w efekcie: serwer nie zna strefy
              odwiedzającego, a różnica w HTML-u byłaby błędem hydratacji */}
          {localTime && (
            <>
              <span aria-hidden className="text-ink/30">
                ·
              </span>
              <span>
                {localTime} {t(ui.footer.localTime)}
              </span>
            </>
          )}
        </motion.div>

        <div className="mt-6 md:mt-9">
          <Headline />
        </div>

        <motion.p
          className="mt-5 max-w-prose text-body text-ink/70 md:mt-6"
          {...rise(0.24)}
        >
          <StableText l10n={site.hero.subline} />
        </motion.p>

        {/* Mobile prowadzi od dowodów przez działanie do zakresu usług.
            Od `md` grid wraca do zatwierdzonej kompozycji desktopowej:
            fakty zajmują pierwszy rząd, a dyscypliny i CTA drugi. */}
        <div className="mt-6 grid md:mt-10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.82fr)] md:items-end md:gap-x-14">
          {/* Fakty — pas dowodów na kreskach zamiast w pigułkach. Na
              desktopie i telefonie siedzi bezpośrednio pod obietnicą. */}
          <motion.ul
            aria-label={t(listLabels.facts)}
            className="order-1 grid grid-cols-3 border-y border-line/70 bg-surface/75 supports-[backdrop-filter]:backdrop-blur-[2px] md:col-span-2 md:row-start-1"
            {...rise(0.32)}
          >
            {site.hero.facts.map((fact, i) => {
              const compactLabel = t(fact.compactLabel);
              const desktopLabel = t(fact.label);

              return (
                <li
                  key={i}
                  className="flex min-w-0 flex-col items-center justify-center border-l border-line/70 px-1.5 py-3 text-center first:border-l-0 sm:px-2 md:flex-row md:items-baseline md:justify-start md:gap-3 md:px-0 md:py-3.5 md:pl-5 md:text-left md:first:pl-0"
                >
                  <span
                    aria-hidden
                    className="mb-2 block h-px w-5 shrink-0 bg-accent/70 md:mb-0 md:h-[0.85em] md:w-px"
                  />
                  <span className="flex min-w-0 flex-col items-center md:flex-row md:items-baseline md:gap-1">
                    <strong
                      className={`min-w-0 font-semibold leading-none text-ink/85 md:text-[15px] md:font-medium md:leading-snug md:text-ink/75 ${
                        i === 1 ? "text-[12px] sm:text-[14px]" : "text-[18px]"
                      }`}
                    >
                      {t(fact.value)}
                    </strong>
                    {compactLabel === desktopLabel ? (
                      <span className="mt-1 min-w-0 text-[10px] font-medium leading-[1.15] text-ink/60 md:mt-0 md:text-[15px] md:leading-snug md:text-ink/75">
                        {compactLabel}
                      </span>
                    ) : (
                      <>
                        <span className="mt-1 min-w-0 text-[10px] font-medium leading-[1.15] text-ink/60 md:hidden">
                          {compactLabel}
                        </span>
                        {desktopLabel && (
                          <span className="hidden min-w-0 text-[15px] leading-snug text-ink/75 md:inline">
                            {desktopLabel}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </motion.ul>

          <motion.div
            className="order-2 mt-6 flex flex-wrap items-center gap-3 md:order-3 md:col-start-2 md:row-start-2 md:mt-14"
            {...rise(0.48)}
          >
            <a
              href="#studio"
              onClick={(e) => anchor(e, "#studio")}
              className={`${pill} bg-ink text-white`}
            >
              {/* Cynober na atramencie: biel na #C2410C daje 5,2:1, więc
                  podpis zostaje czytelny przez cały przejazd wypełnienia. */}
              <span aria-hidden className={`${sweep} bg-accent`} />
              <span className="relative">{t(ui.actions.viewWork)}</span>
              <Arrow />
            </a>
            <a
              href="#contact"
              onClick={(e) => anchor(e, "#contact")}
              // Opóźnienie przy zmianie koloru tekstu wisi WYŁĄCZNIE na
              // `:hover`/`:focus-visible`. Dzięki temu przy wejściu litery
              // czekają, aż wypełnienie je dogoni, a przy wyjściu wracają
              // do atramentu natychmiast — biała treść nigdy nie zostaje
              // na jasnym tle.
              className={`${pill} border border-line text-ink transition-colors duration-200 hover:border-ink hover:text-white hover:delay-[90ms] focus-visible:border-ink focus-visible:text-white focus-visible:delay-[90ms]`}
            >
              <span aria-hidden className={`${sweep} bg-ink`} />
              <span className="relative">{t(ui.actions.writeToMe)}</span>
              <Arrow />
            </a>
          </motion.div>

          {/* Dyscypliny — trzy równe, numerowane wiersze. Ten sam system na
              telefonie i desktopie nie zostawia samotnego „Branding” po
              zawinięciu, a na dużym ekranie zachowuje zatwierdzoną skalę. */}
          <motion.ol
            className="order-3 mt-7 block border-t border-line/70 bg-surface/75 supports-[backdrop-filter]:backdrop-blur-[2px] md:order-2 md:col-start-1 md:row-start-2 md:mt-14"
            aria-label={t(listLabels.disciplines)}
            {...rise(0.4)}
          >
            {disciplines.map((discipline, i) => (
              <li
                key={i}
                className="flex items-baseline gap-4 border-b border-line/70 py-2.5 md:py-4"
              >
                <span
                  aria-hidden
                  className="block w-6 shrink-0 text-[11px] font-semibold tabular-nums text-ink/55 md:text-[12px]"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <StableText
                  l10n={discipline}
                  className="text-[15px] font-medium leading-snug md:text-[19px]"
                />
              </li>
            ))}
          </motion.ol>
        </div>
      </div>

      {/* Wskaźnik scrolla — pulsująca linia, jak na stronie. Na niskim
          oknie znika: tam każdy piksel wysokości jest potrzebny treści,
          a linia i tak wchodziłaby w przyciski. */}
      <motion.div
        aria-hidden
        // Znika na wąskim i na niskim oknie: tam treść hero i tak sięga
        // poniżej krawędzi ekranu, więc linia nie zapraszałaby do niczego,
        // czego nie widać, a na dole wchodziłaby w przyciski.
        className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 [@media(min-width:768px)_and_(min-height:760px)]:block"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.8 }}
      >
        <motion.span
          className="block h-12 w-px bg-gradient-to-b from-ink/0 via-ink/35 to-ink/0"
          animate={
            reduced
              ? undefined
              : { scaleY: [1, 0.6, 1], opacity: [0.8, 0.35, 0.8] }
          }
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
