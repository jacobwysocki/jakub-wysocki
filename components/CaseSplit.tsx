"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Transition,
} from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ui } from "@/data/ui";
import { useT, type L10n } from "@/lib/lang-store";
import { useMediaQuerySafe } from "@/lib/useMediaQuery";
import { EASE_APPLE } from "@/lib/motion";
import Reveal from "@/components/Reveal";
import { CaseImage } from "./CaseShowcase";
import LiveSite from "./LiveSite";
import MacWindow, { displayUrl } from "./MacWindow";
import SiteOverlay from "./SiteOverlay";
import type { FeaturedCase } from "@/data/cases";

/**
 * Drugi case study sekcji Studio.
 *
 * Powód, dla którego to nie jest drugi pinned scrub: dwa razy pod rząd
 * przejęty scroll czyta się jak powtórka i kosztuje 320vh za każdym razem.
 * Tutaj scroll zostaje u użytkownika. Okno produktu trzyma się lewej kolumny,
 * a obok niego przesuwa się oś pięciu kroków: szyna z wypełnieniem prowadzonym
 * postępem scrolla i numer kroku, który zapala się dokładnie jeden na raz.
 * To ta sama figura, co oś doświadczenia niżej na stronie, więc mechanizm
 * jest dla oka znajomy, a nie kolejny efekt do rozgryzienia.
 *
 * Gramatyka zostaje bez zmian: rounded-card, shadow-lift, skala
 * text-h3/text-body, reveal na EASE_APPLE, akcentowe kafelki numerów.
 */

type Step = { title: string; text: string };

/** Zapłon kroku jest krótszy od revealu: ma nadążać za ręką na scrollu */
const ACTIVATE: Transition = { duration: 0.4, ease: [...EASE_APPLE] };

/** Współrzędna środka kafelka numeru (h-9 = 36px), na niej stoi szyna */
const RAIL_X = "left-[18px]";

/**
 * Szyna kroków. Ta sama geometria, co oś doświadczenia: cienka linia w
 * kolorze `line`, a na niej wypełnienie w akcencie.
 *
 * Odstępy przez flex + gap, NIE space-y: `space-y` dokłada margin-top także
 * absolutnie pozycjonowanym szynom i spycha wypełnienie o cały gap w dół.
 * Dzieci absolutne wypadają z układu flexa, więc gap ich nie dotyczy.
 */
function Rail({ scaleY }: { scaleY?: MotionValue<number> }) {
  const base = `absolute bottom-1 top-1 ${RAIL_X} -ml-px w-0.5 rounded-full`;
  return (
    <>
      <div aria-hidden className={`${base} bg-line`} />
      {scaleY && (
        <motion.div
          aria-hidden
          style={{ scaleY }}
          className={`${base} origin-top bg-accent`}
        />
      )}
    </>
  );
}

/**
 * Pojedynczy krok. Kafelek numeru siedzi NA szynie, więc dostaje
 * nieprzezroczystą płytkę w kolorze tła sekcji: bez niej linia
 * przechodziłaby przez półprzezroczysty akcent.
 *
 * Aktywny krok zmienia tylko kafelek, nigdy kontrast tekstu. Przygaszanie
 * nieaktywnych akapitów byłoby najtańszym sposobem na „jeden na raz" i
 * jednocześnie najszybszym sposobem na zjechanie poniżej AA.
 */
function StepRow({
  step,
  index,
  active,
}: {
  step: Step;
  index: number;
  active: boolean;
}) {
  return (
    <li className="relative pl-14">
      <span
        aria-hidden
        className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl bg-surface"
      >
        <motion.span
          className="absolute inset-0 rounded-xl bg-accent"
          initial={false}
          animate={{ opacity: active ? 1 : 0.1 }}
          transition={ACTIVATE}
        />
        <motion.span
          className="relative text-caption font-semibold tabular-nums text-accent"
          initial={false}
          animate={{ color: active ? "#FFFFFF" : "#C2410C" }}
          transition={ACTIVATE}
        >
          {String(index + 1).padStart(2, "0")}
        </motion.span>
      </span>
      <Reveal>
        <h4 className="text-h3 text-ink">{step.title}</h4>
        <p className="mt-3 max-w-prose text-body text-muted">{step.text}</p>
      </Reveal>
    </li>
  );
}

/**
 * Oś kroków sterowana scrollem.
 *
 * Postęp liczy się względem linii 62% wysokości okna: zero, gdy tę linię
 * mija góra listy, jeden, gdy mija ją dół. Numer zapala się dokładnie wtedy,
 * gdy czubek wypełnienia dochodzi do jego kafelka, bo indeks liczymy z
 * realnych offsetów kroków, nie z równego podziału postępu na równe części: kroki
 * mają różne wysokości i przy równym podziale zapłon rozjeżdżałby się z
 * szyną o kilkadziesiąt pikseli.
 *
 * Świeci zawsze dokładnie jeden, także w świetle między krokami. Zwykły
 * `whileInView` z wąskim marginesem gubiłby aktywność właśnie tam.
 */
function ScrollSteps({ steps }: { steps: Step[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 62%", "end 62%"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 260,
    damping: 40,
    restDelta: 0.001,
  });
  // Sprężyna potrafi przestrzelić poza 0..1, a scaleY > 1 wypuściłoby
  // wypełnienie poza szynę.
  const scaleY = useTransform(smooth, (v) => Math.min(Math.max(v, 0), 1));

  // Środki kafelków względem góry listy. Mierzone po layoucie i po każdej
  // jego zmianie (resize, przełączenie języka, doczytanie fontu).
  const centers = useRef<number[]>([]);
  const syncActive = useCallback((progress: number) => {
    const el = ref.current;
    const tops = centers.current;
    if (!el || tops.length === 0) return;
    // Szyna ma top-1/bottom-1, więc czubek startuje 4px pod górą listy
    const tip = 4 + progress * (el.offsetHeight - 8);
    let next = 0;
    for (let i = 0; i < tops.length; i += 1) if (tip >= tops[i]) next = i;
    setActive(next);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      centers.current = Array.from(el.children)
        .filter(
          (child): child is HTMLLIElement => child instanceof HTMLLIElement,
        )
        .map((li) => li.offsetTop + 18);
      syncActive(scrollYProgress.get());
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollYProgress, syncActive]);

  useMotionValueEvent(scrollYProgress, "change", syncActive);

  return (
    // Odstęp zjechał z clamp(104,18vh,208) na clamp(88,13vh,160), bo kroków
    // jest teraz pięć, a nie trzy. Przy starych przerwach oś rosłaby do
    // dwóch i pół ekranu treści na jeden case i z prowadzenia zrobiłaby się
    // droga przez mękę. Krótsze przerwy trzymają tempo, a przypięte okno
    // i tak ma na czym jechać.
    <ol
      ref={ref}
      className="relative flex flex-col gap-14 md:gap-16 lg:gap-[clamp(88px,13vh,160px)]"
    >
      <Rail scaleY={scaleY} />
      {steps.map((step, i) => (
        <StepRow key={step.title} step={step} index={i} active={i === active} />
      ))}
    </ol>
  );
}

/**
 * Wersja bez ruchu: reduced motion i dotyk. Ten sam materiał i ta sama
 * szyna, tylko bez zapłonu i bez przypięcia kadru. Szyna zostaje, bo tutaj
 * nie jest paskiem postępu, tylko linijką spinającą kroki w jedną oś.
 */
function StaticSteps({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative flex flex-col gap-14 md:gap-16">
      <Rail />
      {steps.map((step, i) => (
        <StepRow key={step.title} step={step} index={i} active={false} />
      ))}
    </ol>
  );
}

/**
 * Kadr case'a: produkt w ramce okna przeglądarki.
 *
 * Zdjęcie laptopa mówi „istnieje jakiś ekran". Okno z prawdziwym adresem na
 * pasku mówi „to jest ta strona, pod tym adresem, dzisiaj" i jednym gestem
 * daje drogę do niej. Dlatego pigułka adresu jest linkiem, a spod okna znika
 * dawne „Zobacz squizzu.com": ta sama etykieta dwa razy w jednej kolumnie to
 * dwa razy ta sama informacja, nie dwa razy większa szansa na kliknięcie.
 *
 * Kadr w kolumnie jest plakatem, nie czytelnią: nawet po poszerzeniu kolumny
 * strona schodzi tu do niespełna połowy swojej wielkości. Czytanie zaczyna się
 * dopiero w nakładce, którą otwiera kliknięcie w szybę.
 *
 * Na żywo tylko tam, gdzie to ma sens: precyzyjny wskaźnik, zgoda na ruch i
 * serwer, który pozwala się osadzić. Dotyk i reduced motion dostają ten sam
 * kadr statycznie, w identycznej ramce. To nie jest wersja gorsza, tylko
 * wersja bez iframe'a: bez czekania na obcą stronę i bez sekundy pustego pola
 * na łączu komórkowym.
 */
function ProductWindow({
  preview,
  live,
  stacked,
}: {
  preview: NonNullable<FeaturedCase["preview"]>;
  /** Czy w tym kontekście wolno osadzić stronę na żywo */
  live: boolean;
  stacked: boolean;
}) {
  const t = useT();
  const alt = t(preview.alt);
  const label = displayUrl(preview.url);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Kadr wypełnia pole treści okna co do piksela: jego proporcje są tymi
  // samymi, z których zbudowane jest to pole, więc nic nie trzeba przycinać.
  // `sizes` liczę osobno dla kolumny i dla nakładki, bo to ten sam plik raz
  // w 677px, a raz w 1440px.
  const still = (sizes: string) => (
    <Image
      src={preview.image}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover object-top"
    />
  );

  return (
    <figure className="m-0">
      <MacWindow href={preview.url}>
        {live ? (
          <LiveSite
            src={preview.url}
            label={label}
            still={still(
              stacked
                ? "(max-width: 1288px) 100vw, 1192px"
                : "(max-width: 1023px) 100vw, 680px",
            )}
            onOpen={() => setOpen(true)}
            triggerRef={triggerRef}
          />
        ) : (
          still(
            stacked
              ? "(max-width: 1288px) 100vw, 1192px"
              : "(max-width: 1023px) 100vw, 680px",
          )
        )}
      </MacWindow>

      {live && (
        <SiteOverlay
          open={open}
          onClose={() => {
            setOpen(false);
            // Fokus wraca tam, skąd wyszedł. Bez tego ląduje na <body>
            // i klawiatura zaczyna stronę od nowa.
            triggerRef.current?.focus();
          }}
          url={preview.url}
          label={label}
          still={still("(max-width: 1565px) 92vw, 1440px")}
        />
      )}
    </figure>
  );
}

export default function CaseSplit({
  project,
  lead,
}: {
  project: FeaturedCase;
  /** Zdanie otwierające rozdział; pełni tu rolę nagłówka case'a */
  lead: L10n;
}) {
  const reduced = useReducedMotion();
  // Przypięcie kolumny ma sens tylko tam, gdzie obie kolumny stoją obok
  // siebie i gdzie ruch jest mile widziany. Reszta dostaje ten sam materiał
  // ułożony pionowo: bez pinningu, nie bez treści.
  const coarse = useMediaQuerySafe("(pointer: coarse)");
  const stacked = Boolean(reduced) || coarse;
  const t = useT();
  const steps = project.steps.map((step) => ({
    title: t(step.title),
    text: t(step.text),
  }));

  // Wysokość przypiętej kolumny, żeby wyliczyć z niej offset środkujący.
  // Mierzę samo pudełko sticky: `top` nie wpływa na jego wysokość, więc
  // pomiar nie może się tu zapętlić z własnym skutkiem.
  const stickyRef = useRef<HTMLDivElement>(null);
  const [frameH, setFrameH] = useState(0);

  useEffect(() => {
    const el = stickyRef.current;
    if (!el || stacked) return;
    const observer = new ResizeObserver(([entry]) => {
      const h = Math.round(entry.contentRect.height);
      setFrameH((prev) => (prev === h ? prev : h));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [stacked]);

  return (
    // Rozdział zaczyna samo światło. Wcześniej granicę case'ów rysowała
    // pionowa kreska z etykietą nad nagłówkiem, czyli jakieś 114px wysokości
    // razem z odstępami. Po ich zdjęciu oddaję do odstępu 64px z tego, co
    // zajmowały: puste światło czyta się jako większe niż to samo światło
    // zapełnione znakiem, więc jeden do jednego byłoby już przepaścią.
    // Szerszy stelaż niż reszta strony (1240 zamiast 1120). Rozdział i tak
    // jest ustawiony w kontrze do case'a #1, więc własna, szersza scena tylko
    // to podkreśla, a okno produktu zyskuje 120px, których nie ma skąd wziąć
    // wewnątrz siatki bez ścieśnienia kroków poniżej sensownej miary.
    <div className="mx-auto mt-40 max-w-content px-6 md:mt-48 lg:max-w-[1240px]">
      {/* Otwarcie jest wyrównane do lewej, w kontrze do wyśrodkowanego
          case'a #1: to pierwszy sygnał, że ten rozdział działa inaczej. */}
      <Reveal className="max-w-prose">
        <h3 className="text-h3 text-ink">{t(lead)}</h3>
      </Reveal>

      {/* Układ split tylko tam, gdzie kadr faktycznie się przypina. W wersji
          ułożonej pionowo dwie kolumny dałyby wysoką kolumnę tekstu obok
          niskiego kadru, czyli pół ekranu pustki. */}
      <div
        className={
          stacked
            ? "mt-12 md:mt-16"
            : "mt-12 grid grid-cols-1 gap-12 lg:mt-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-16"
        }
      >
        {/*
         * Okno trzyma pionowy środek ekranu, a kroki przesuwają się obok.
         *
         * Pierwsze podejście robiło to sticky o wysokości ekranu z zawartością
         * wyśrodkowaną flexem. Liczyło się samo, ale miało wadę widoczną od
         * razu: dopóki pudełko nie zdąży się przykleić, okno stoi 50vh poniżej
         * góry siatki, czyli przy pierwszym i drugim kroku ląduje na dole
         * ekranu. Tak nie wygląda kadr, który towarzyszy opowieści.
         *
         * Teraz pudełko ma wysokość okna i normalny `top`, więc okno startuje
         * równo z pierwszym krokiem i podjeżdża na środek dopiero wtedy, gdy
         * ma się tam zatrzymać. `top` liczę z realnej wysokości okna, bo ta
         * zmienia się razem z szerokością kolumny: 2rem dokładam za pasek
         * nawigacji, żeby środek wypadał w tym, co widać, a max() pilnuje,
         * by przy niskim ekranie okno nie weszło pasek nawigacji.
         */}
        <div
          ref={stickyRef}
          className={stacked ? "" : "lg:sticky lg:top-24"}
          style={
            stacked || !frameH
              ? undefined
              : { top: `max(6rem, calc(50vh + 2rem - ${frameH / 2}px))` }
          }
        >
          <Reveal className="w-full">
            {project.preview ? (
              <ProductWindow
                preview={project.preview}
                live={!stacked && project.preview.embed}
                stacked={stacked}
              />
            ) : (
              <>
                {/* Ścieżka dla case'a bez podglądu produktu: kadr fotograficzny.
                    Fotografia mockupu znosi kadrowanie, ale tylko do 16:9,
                    bo laptop siedzi w kadrze wyżej niż w połowie i przy
                    ciaśniejszej ramie ucinałoby mu klapę. */}
                <div
                  className={`relative overflow-hidden rounded-card shadow-lift ring-1 ring-ink/5 ${
                    stacked
                      ? "aspect-[4/3] sm:aspect-[16/9]"
                      : "aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3]"
                  }`}
                >
                  <CaseImage
                    project={project}
                    fill
                    sizes={
                      stacked
                        ? "(max-width: 1168px) 100vw, 1072px"
                        : "(max-width: 1023px) 100vw, 560px"
                    }
                    objectClass="object-center"
                  />
                </div>
                {project.link && (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-1.5 text-[15px] font-semibold text-accent transition-colors hover:text-ink"
                  >
                    {t(project.linkLabel ?? ui.actions.openSite)}
                    <ArrowUpRight size={15} aria-hidden />
                  </a>
                )}
              </>
            )}
          </Reveal>
        </div>

        {stacked ? (
          <div className="mt-12 max-w-3xl md:mt-16">
            <StaticSteps steps={steps} />
          </div>
        ) : (
          <ScrollSteps steps={steps} />
        )}
      </div>
    </div>
  );
}
