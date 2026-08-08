"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { useLang, useT, type L10n } from "@/lib/lang-store";

/**
 * Mapa systemu Venora: co działa lokalnie, a co jest wdrożone.
 *
 * Diagram jest tu jedynym dopuszczalnym materiałem. Panel Venora pokazuje
 * nazwy realnych firm, ich kontakty i automatyczne oceny stron, więc żaden
 * jego zrzut nie może trafić na publiczną stronę. Rysunek opisuje metodę,
 * nie konkretne firmy.
 */

type Node = {
  id: string;
  label: L10n;
  /** Łamane na wiersze, żeby kolumna węzła była wąska i czytelna */
  items: string[];
};

const LOCAL_NODES: Node[] = [
  {
    id: "sources",
    label: { pl: "Źródła", en: "Sources" },
    items: ["Google Places", "UPRP · CSV"],
  },
  {
    id: "analysis",
    label: { pl: "Analiza", en: "Analysis" },
    items: ["Playwright · Lighthouse", "Claude"],
  },
  {
    id: "store",
    label: { pl: "Magazyn", en: "Store" },
    items: ["Prisma · SQLite"],
  },
];

const PANEL_NODE: Node = {
  id: "panel",
  label: { pl: "Panel", en: "Panel" },
  items: ["Next.js · React", "Turso"],
};

/**
 * Ruch: jeden przebieg sygnału, gdy sekcja wchodzi w kadr.
 *
 * Wszystko wisi na jednej wartości `progress` z zakresu 0..1, dzięki czemu
 * szyna, poświata, granica i zapłony kropek nie mogą się rozjechać.
 */
const HOT = "#FF6A3D";
const COLD = "rgba(255,255,255,0.22)";
const SEAM_COLD = "rgba(255,255,255,0.40)";
const EASE = [0.16, 1, 0.3, 1] as const;

/** Poświata czoła. Statyczny gradient, rastruje się raz. */
const BLOOM =
  "radial-gradient(closest-side, rgba(255,106,61,0.55), rgba(255,106,61,0.18) 46%, rgba(255,106,61,0) 78%)";

/** Fazy przebiegu w postępie 0..1 */
const RAIL_END = 0.62; // szyna lokalna dobija do granicy
const SEAM_IN = 0.62;
const SEAM_LIT = 0.74;
const PANEL_AT = 0.8;

/**
 * Klatki i `times` są rozjechane celowo: pierwsze 55% czasu idzie na 62%
 * postępu, więc szyna rysuje się przez niecałą sekundę i to ona jest głównym
 * gestem, a Panel odpowiada dopiero po zapłonie granicy. Przy jednym `ease`
 * na całości fazy zlałyby się w jeden rozbłysk.
 */
const RUN = { keys: [0, RAIL_END, PANEL_AT, 1], times: [0, 0.55, 0.78, 1] };
const DURATION = 1.9;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Granica wdrożenia opowiedziana ruchem. Węzły lokalne emitują: halo rozchodzi
 * się na zewnątrz, a kropka podskakuje, bo tam coś się liczy. Panel przyjmuje:
 * pierścień zaciska się do środka i nie ma podskoku, bo tam nic nie chodzi,
 * tam wylądował gotowy plik.
 */
type Ignition = "emit" | "arrive";

function MapNode({
  node,
  lit,
  kind,
}: {
  node: Node;
  lit: boolean;
  kind: Ignition;
}) {
  const t = useT();

  return (
    // flex, nie blok: margines górny etykiety zwijałby się z rodzicem
    // i spychał cały węzeł w dół razem z kropką
    <div data-node className="relative flex min-w-0 flex-col">
      {lit && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-[-4px] top-[-4px] h-4 w-4 rounded-full"
          style={{ border: `1px solid ${HOT}` }}
          initial={
            kind === "emit"
              ? { scale: 0.4, opacity: 0.7 }
              : { scale: 2.1, opacity: 0 }
          }
          animate={
            kind === "emit"
              ? { scale: 1.8, opacity: 0 }
              : { scale: 1, opacity: [0, 0.6, 0] }
          }
          transition={
            kind === "emit"
              ? { duration: 0.7, ease: "easeOut" }
              : { duration: 0.55, ease: EASE }
          }
        />
      )}
      {/* Kolor także w klasie, nie tylko w `animate`: bez JS-u kropki mają
          zostać widoczne, choćby wygaszone. */}
      <motion.span
        aria-hidden
        className="absolute left-0 top-0 h-2 w-2 rounded-full bg-white/[0.22]"
        initial={false}
        animate={{
          backgroundColor: lit ? HOT : COLD,
          scale: lit && kind === "emit" ? [1, 1.55, 1] : 1,
        }}
        transition={{ duration: kind === "emit" ? 0.45 : 0.5, ease: EASE }}
      />
      <p className="mt-[18px] text-[11px] font-semibold uppercase tracking-[0.09em] text-white/50">
        {t(node.label)}
      </p>
      {node.items.map((line) => (
        <p key={line} className="mt-[3px] text-[12.5px] leading-snug text-white/80">
          {line}
        </p>
      ))}
    </div>
  );
}

export default function VenorPipeline() {
  const t = useT();
  const lang = useLang();
  const reduced = useReducedMotion();

  const ref = useRef<HTMLDivElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  // `once`: przebieg gra raz i zostaje, scroll w górę nie rozbiera rysunku
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  /** Jedna wartość napędza wszystko: szynę, poświatę, granicę i zapłony. */
  const progress = useMotionValue(0);

  const [stage, setStage] = useState(0);
  const geom = useRef({ width: 1, dots: [] as number[] });

  const railScale = useTransform(progress, [0, RAIL_END], [0, 1], { clamp: true });

  /** Nośnik ma szerokość szyny, więc przy `x = (fill - 1) * 100%` jego prawa
   *  krawędź leży dokładnie na czole sygnału i poświata nie potrzebuje
   *  własnego pomiaru. */
  const bloomX = useTransform(railScale, (v) => `${(v - 1) * 100}%`);
  const bloomOpacity = useTransform(
    progress,
    [0, 0.04, RAIL_END, RAIL_END + 0.06],
    [0, 1, 1, 0],
    { clamp: true }
  );

  const seamColor = useTransform(progress, [SEAM_IN, SEAM_LIT], [SEAM_COLD, HOT], {
    clamp: true,
  });
  const seamX = useTransform(progress, [SEAM_IN, SEAM_LIT], [-6, 0], {
    clamp: true,
  });
  /** Granica rozświetla się na moment styku i wraca do chłodu: to, że coś ją
   *  raz przekroczyło, jej nie kasuje. */
  const seamGlow = useTransform(
    progress,
    [SEAM_IN, SEAM_IN + 0.05, SEAM_LIT + 0.06],
    [0, 1, 0],
    { clamp: true }
  );

  /**
   * Jedyna praca na klatce scrolla: arytmetyka na wcześniej zmierzonych
   * liczbach. Zero odczytów layoutu, geometria siedzi w `geom` i uzupełnia ją
   * tylko ResizeObserver. `stage` jest monotoniczny, a updater zwraca `prev`,
   * gdy nic się nie zmieniło, więc React nie rerenderuje co klatkę.
   */
  /**
   * Zapłony liczone geometrycznie: czoło sygnału kontra zmierzone środki
   * kropek, a nie równy podział postępu. Dzięki temu dłuższe etykiety po
   * przełączeniu języka nie rozjeżdżają synchronizacji. `stage` rośnie
   * monotonicznie, a updater zwraca `prev`, gdy nic się nie zmieniło, więc
   * React nie rerenderuje co klatkę.
   */
  const sync = useCallback((v: number) => {
    const p = clamp01(v);
    const { width, dots } = geom.current;
    const tip = (p >= RAIL_END ? 1 : p / RAIL_END) * width;
    let next = 0;
    for (let i = 0; i < dots.length; i += 1) if (tip >= dots[i]) next = i + 1;
    if (p >= PANEL_AT) next = dots.length + 1;
    setStage((prev) => (next > prev ? next : prev));
  }, []);

  useMotionValueEvent(progress, "change", sync);

  /**
   * Pomiar po layoucie, nigdy w trakcie animacji. `lang` w zależnościach, bo
   * przełącznik PL/EN zmienia szerokości kolumn; ResizeObserver łapie jeszcze
   * doczytanie fontu i zmianę rozmiaru okna.
   */
  useEffect(() => {
    const el = zoneRef.current;
    if (!el) return;
    const measure = () => {
      geom.current = {
        width: Math.max(el.offsetWidth, 1),
        // kropka: left-0, w-2 → środek na +4
        dots: Array.from(el.querySelectorAll<HTMLElement>("[data-node]")).map(
          (c) => c.offsetLeft + 4
        ),
      };
      sync(progress.get());
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [lang, progress, sync]);

  /** Przy `prefers-reduced-motion` od razu stan końcowy: bez ruchu i bez halo. */
  useEffect(() => {
    if (reduced) {
      progress.set(1);
      setStage(LOCAL_NODES.length + 1);
      return;
    }
    if (!inView) return;
    const controls = animate(progress, RUN.keys, {
      duration: DURATION,
      times: RUN.times,
      ease: ["easeOut", "easeInOut", "easeOut"],
    });
    return () => controls.stop();
  }, [inView, reduced, progress]);

  return (
    <div ref={ref} className="text-white">
      {/* Nagłówki stref niosą runtime i hosting: to część stacku, nie ozdoba */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
          {t({ pl: "Lokalnie", en: "Local" })}
          <span className="ml-2.5 font-medium normal-case tracking-normal text-white/55">
            Node.js · TypeScript
          </span>
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
          {t({ pl: "Wdrożone", en: "Deployed" })}
          <span className="ml-2.5 font-medium normal-case tracking-normal text-white/55">
            Vercel
          </span>
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-stretch md:gap-7">
        {/* STREFA LOKALNA: trzy węzły na wspólnej szynie */}
        <div ref={zoneRef} className="relative flex-1">
          {/* Szyna wygaszona: widoczna także bez JS-u. Biegnie od pierwszej
              kropki do granicy, więc sygnał widocznie w nią uderza. */}
          <div
            aria-hidden
            className="absolute left-[4px] right-0 top-[3.5px] hidden h-px bg-white/[0.13] md:block"
          >
            <motion.span
              aria-hidden
              className="absolute inset-0 origin-left bg-accent-bright"
              style={{
                scaleX: railScale,
                boxShadow: `0 0 10px 0 ${HOT}`,
                opacity: 0.9,
              }}
            />
          </div>

          {/* Bez przycinania: poświata musi wychodzić poza włos szyny */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[4px] right-0 top-[4px] hidden h-0 md:block"
          >
            <motion.div className="absolute inset-0" style={{ x: bloomX }}>
              <motion.div
                className="absolute right-0 top-0 -mr-[14px] -mt-[14px] h-7 w-7 rounded-full"
                style={{ background: BLOOM, opacity: bloomOpacity }}
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 md:gap-x-7">
            {LOCAL_NODES.map((node, i) => (
              <MapNode key={node.id} node={node} kind="emit" lit={stage > i} />
            ))}
          </div>

          {/* Etykieta dosunięta do granicy, bo to ona jest tym, co ją przekracza */}
          <motion.p
            className="mt-4 text-[10.5px] font-medium md:text-right"
            style={{ color: seamColor, x: seamX }}
          >
            results.json + {t({ pl: "miniatury", en: "thumbnails" })}
          </motion.p>
        </div>

        {/* Granica wdrożenia: pionowa na szerokim ekranie, pozioma na wąskim.
            Rozbłysk jest osobną warstwą, więc sama kreska zostaje chłodna. */}
        <div aria-hidden className="relative shrink-0">
          <div className="h-px w-full border-t border-dashed border-white/25 md:h-full md:w-px md:border-l md:border-t-0" />
          <motion.div
            className="absolute inset-0 h-px w-full border-t border-dashed md:h-full md:w-px md:border-l md:border-t-0"
            style={{ borderColor: HOT, opacity: seamGlow }}
          />
        </div>

        {/* Strefa wdrożona nie ma szyny i nie dostanie jej: nic tam nie płynie.
            Plik zostaje zapisany, a potem czyta go inny runtime. Ciągła linia
            przez granicę byłaby ładniejsza i nieprawdziwa. */}
        <div className="md:w-[22%] md:shrink-0">
          <MapNode
            node={PANEL_NODE}
            kind="arrive"
            lit={stage > LOCAL_NODES.length}
          />
        </div>
      </div>

      <p className="mt-7 max-w-[72ch] text-[11.5px] leading-relaxed text-white/50">
        {t({
          pl: "Chromium, pamięć i długie zadania kończą się na kresce. Po drugiej stronie zostaje już tylko lekki CRUD.",
          en: "Chromium, memory and long-running jobs stop at the line. Past it, nothing but light CRUD.",
        })}
      </p>
    </div>
  );
}
