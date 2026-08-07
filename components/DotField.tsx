"use client";

import { useEffect, useRef, type RefObject } from "react";
import { useMediaQuerySafe } from "@/lib/useMediaQuery";

/**
 * Pole kropek — gęsta, regularna matryca punktów na canvasie 2D.
 *
 * Kropki stoją w siatce co 18 px, wszystkie tego samego kalibru, każda
 * szarpnięta o ułamek piksela. To ma czytać się jak drobna, równa faktura
 * papieru, a nie jak żwir rozsypany po ekranie: regularność jest tu cechą,
 * nie brakiem pomysłu. Cała odmiana idzie tonem, nie wielkością.
 *
 * Pole reaguje na dwa gesty i tylko na dwa:
 *
 * 1. NAJECHANIE — kropki rozsuwają się przed kursorem jak tłum robiący
 *    przejście. Siła odpychania gaśnie i przy krawędzi promienia, i w samym
 *    środku, więc nigdzie nie ma skoku; pozycja kursora jest dodatkowo
 *    tłumiona, żeby rozstęp szedł za ręką z lekkim opóźnieniem, a nie skakał.
 * 2. KLIKNIĘCIE — wybuch. Impuls promienisty z punktu kliknięcia: najbliższe
 *    kropki odlatują o 150–250 px z rozbłyskiem, a potem wracają na swoje
 *    miejsca sprężyną z widocznym przeregulowaniem, przez jakieś dwie sekundy.
 *    Kolejne kliknięcia sumują impulsy, więc młócenie myszą daje kaskadę,
 *    a nie kolejkę animacji.
 *
 * ARCHITEKTURA. Przy sześciu tysiącach kropek nie da się co klatkę rysować
 * wszystkiego, więc nie rysuję. Pole dzieli się na dwa zbiory: ŚPIĄCE, które
 * siedzą w domu i są raz wypalone w osobny canvas w pamięci, oraz OBUDZONE,
 * czyli te pod kursorem albo w zasięgu wybuchu. Klatka to jeden `drawImage`
 * z warstwy statycznej plus tyle kropek, ile akurat się rusza. Zasypiając,
 * kropka domalowuje się do warstwy statycznej; budząc się, jest z niej
 * wycierana. W spoczynku pętla po prostu staje.
 *
 * Do tego rysuję tylko PROSTOKĄT, w którym coś się zmieniło — przy samym
 * kursorze to okno jakieś 400 × 400 px, a nie cały ekran.
 *
 * Czytelność treści jest warunkiem, nie życzeniem. Alfy są niskie, a maska CSS
 * ścienia pole w środkowym pasie, przez który biegnie nagłówek. Maska jest
 * gradientem na elemencie, więc nie kosztuje ani jednej klatki. Sam canvas
 * jest `aria-hidden` i `pointer-events-none` — czytnik ekranu go nie widzi,
 * a przyciski nad polem zbierają swoje kliknięcia normalnie.
 */

const TAU = Math.PI * 2;

/** Sufit gęstości pikseli: powyżej 2× kropka nie robi się okrąglejsza, a koszt rośnie kwadratowo. */
const DPR_CAP = 2;

/**
 * Spoczynkowe 30 kl./s; na czas wybuchu przechodzę na 60, bo tam ruch jest
 * szybki i przy 30 widać skoki. Cztery milisekundy zapasu w progu są celowe:
 * bez nich `dt` z rAF-a przy 60 Hz wypada minimalnie poniżej 33,33 ms i pętla
 * gubi co drugą klatkę, schodząc do 20 kl./s.
 */
const FRAME_SLOW = 1000 / 30 - 4;
const FRAME_FAST = 1000 / 60 - 4;

/** Ile milisekund po kliknięciu trzymam wyższą klatkę. */
const FAST_MS = 2600;

/**
 * Fizyka chodzi w krokach stałej długości, niezależnych od tego, ile klatek
 * faktycznie rysuję. Bez tego te same stałe dawałyby inne sprężyny przy 30
 * i przy 60 kl./s, a przejście między nimi w środku wybuchu byłoby widoczne.
 */
const STEP = 1 / 60;
const MAX_STEPS = 4;

/** Sprężyna do domu: okres ~1 s, czyli powrót jest wyraźnym ruchem, nie zaskokiem. */
const STIFF = 0.011;

/**
 * Tłumienie. W spoczynku wyższe (rozsuwanie pod kursorem ma być czyste,
 * bez dzwonienia), po wybuchu niższe — wtedy powrót ma prawo przestrzelić
 * i pokołysać się przez dwie sekundy. Przejście robi `heat` kropki.
 */
const DAMP_CALM = 0.94;
const DAMP_HOT = 0.962;

/**
 * Soczewka kursora. Promień urósł do 190 px, bo matryca jest drobniejsza od
 * poprzedniego pola i szersze przejście lepiej na niej widać. `LENS_CORE` to
 * ułamek promienia, na którym siła narasta od zera w samym punkcie kursora —
 * 0.10 daje 19 px rozbiegu, czyli kropka dokładnie pod strzałką jeszcze się
 * usuwa, a nie ma pod nią dziury. Rozstęp w spoczynku to siła podzielona przez
 * STIFF: przy tych wartościach szczyt wypada ~60 px, czyli ponad trzy oczka
 * siatki, i gaśnie do zera na rancie.
 */
const LENS_R = 190;
const LENS_CORE = 0.1;
const REPEL = 0.85;

/**
 * Wybuch: prędkość początkowa w epicentrum, promień rdzenia i całkowity
 * zasięg. Przeliczone na sprężynie wychodzi 240 px wyrzutu pod kliknięciem,
 * 150 px osiemdziesiąt pikseli dalej, a widoczny ruch kończy się po ~2,4 s.
 * Zasięg 560 px jest dobrany do progu `amp`: dalej impuls i tak byłby poniżej
 * jednego procenta, a każdy dodatkowy piksel promienia to setki obudzonych
 * kropek do policzenia.
 */
const BURST_V = 34;
const BURST_CORE = 130;
const BURST_R = 560;
/** Losowy rozrzut kierunku — bez niego fala jest idealnie promienista i wygląda sztucznie. */
const BURST_SPREAD = 0.5;

const HEAT_DECAY = 0.972;
const FLARE_DECAY = 0.982;
/** O ile rozbłysk podbija alfę i promień kropki na szczycie wybuchu. */
const FLARE_ALPHA = 1.9;
const FLARE_SCALE = 0.35;
/** Poniżej tego rozbłysku kropka wraca do zwykłego sprite'a. */
const FLARE_EPS = 0.01;

/**
 * Progi zaśnięcia: 0,35 px od domu i 0,03 px na krok prędkości. Poniżej tego
 * ruchu nie widać nawet na ekranie 3×, a każda kropka, która zaśnie, znika
 * z kosztu klatki na dobre.
 */
const SLEEP_D2 = 0.35 * 0.35;
const SLEEP_V2 = 0.03 * 0.03;

/**
 * Siatka. 18 px odstępu daje 966 kropek na 390 × 844, 4000 na 1440 × 900
 * i 6360 na 1920 × 1080. Na bardzo dużych kadrach odstęp sam się rozluźnia,
 * żeby nie przekroczyć `MAX_DOTS` — matryca zostaje regularna, tylko rzadsza,
 * bo dosypywanie kropek poza ten pułap kosztuje pamięć i czas przebudowy
 * warstwy statycznej, a na oko nie zmienia nic.
 */
const SPACING = 18;
const MAX_DOTS = 9000;
/** Szarpnięcie pozycji, żeby matryca nie była martwa. Ćwierć oczka to za dużo, 1,2 px w sam raz. */
const JITTER = 1.2;
/** Jeden kaliber. 1,5 px czyta się jako drobna faktura; od 2 px zaczyna się żwir. */
const DOT_R = 1.5;

const INK_RGB = "29, 29, 31"; // ink
const LINE_RGB = "210, 210, 215"; // line
const ACCENT_RGB = "194, 65, 12"; // accent

/**
 * Cztery tony i nic więcej — przy jednym kalibrze to one niosą całą odmianę.
 * Dwa stopnie szarej kreski z tokenów robią masę i jej wewnętrzną głębię,
 * atrament daje rzadkie ciemniejsze punkty, a cynober jest akcentem: dziewięć
 * procent, nitka w tkaninie, nie pomarańczowa płachta.
 *
 * Alfy są policzone pod GĘSTE pole. Kropka o promieniu 1,5 px w oczku 18 px
 * pokrywa 2,2% powierzchni, więc nawet szara masa przy 0,85 przyciemnia
 * papier średnio o niecały poziom jasności — pole zostaje szmerem.
 */
const TONES = [
  { rgb: LINE_RGB, alpha: 0.85 },
  { rgb: LINE_RGB, alpha: 0.6 },
  { rgb: INK_RGB, alpha: 0.13 },
  { rgb: ACCENT_RGB, alpha: 0.34 },
];
const ACCENT_TONE = 3;

/**
 * Maska pola. Pełna siła tylko przy samej górze i w ostatnim pasku przy dolnej
 * krawędzi; strefa treści jest chroniona od nagłówka aż POD pas faktów
 * i przyciski (poprzednio ochrona kończyła się przy 66% i lista dyscyplin
 * z faktami stała na polu o niemal pełnej sile — stąd słaba czytelność).
 * Najciemniejszy przypadek pod tekstem to kropka atramentowa:
 * 0.13 × 0.44 = 0.057 alfy, czyli papier schodzi z #FBFBFD do #EEEEEF, na
 * którym atrament #1D1D1F trzyma ~14:1. Cynober przy 0.34 × 0.44 = 0.15 daje
 * ~13:1. Zapas nad progiem AA pozostaje trzykrotny.
 */
const MASK =
  "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.75) 10%, rgba(0,0,0,0.46) 26%, rgba(0,0,0,0.42) 82%, rgba(0,0,0,0.6) 93%, rgba(0,0,0,0.85) 100%)";

/** Elementy, na których kliknięcie należy do nich, nie do pola. */
const INTERACTIVE = 'a,button,input,textarea,select,label,summary,[role="button"]';

/**
 * Hash pozycji w siatce. Rozsypanie MUSI być funkcją współrzędnych, a nie
 * `Math.random()`: kolumna kropek ma wyglądać tak samo po każdym przeliczeniu
 * i po każdym rerenderze, inaczej zmiana rozmiaru okna przetasowałaby akcenty
 * na oczach patrzącego.
 */
function hash2(x: number, y: number, seed: number): number {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

type Field = {
  cols: number;
  rows: number;
  n: number;
  s: number;
  /** Środek oczka (0,0) bez szarpnięcia — od niego liczę zakresy kolumn i wierszy. */
  ox: number;
  oy: number;
  hx: Float32Array;
  hy: Float32Array;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  heat: Float32Array;
  flare: Float32Array;
  tone: Uint8Array;
  /** 0 = śpi (siedzi w warstwie statycznej), 1 = obudzona (rysowana co klatkę). */
  live: Uint8Array;
  /** Lista indeksów obudzonych; ważne są pierwsze `count` pozycji. */
  awake: Int32Array;
  count: number;
};

type Lens = { x: number; y: number; k: number };

/** Prostokąt brudu w pikselach CSS. Pusty, gdy x1 < x0. */
type Box = { x0: number; y0: number; x1: number; y1: number };

function boxReset(b: Box) {
  b.x0 = Infinity;
  b.y0 = Infinity;
  b.x1 = -Infinity;
  b.y1 = -Infinity;
}

function boxAdd(b: Box, x0: number, y0: number, x1: number, y1: number) {
  if (x0 < b.x0) b.x0 = x0;
  if (y0 < b.y0) b.y0 = y0;
  if (x1 > b.x1) b.x1 = x1;
  if (y1 > b.y1) b.y1 = y1;
}

function boxCopy(dst: Box, src: Box) {
  dst.x0 = src.x0;
  dst.y0 = src.y0;
  dst.x1 = src.x1;
  dst.y1 = src.y1;
}

/**
 * Sprite kropki. Rysowanie sześciu tysięcy łuków co klatkę odpada, więc każdy
 * ton dostaje raz wypalony kółeczko w osobnym canvasie i dalej idzie już tylko
 * `drawImage`. Kółko wypalam w promieniu POWIĘKSZONYM o maksymalny rozbłysk,
 * żeby napęczniała kropka była skalowana w dół, nie w górę — w drugą stronę
 * widać rozmycie.
 */
function sprite(rgb: string, alpha: number, dpr: number) {
  const rMax = DOT_R * (1 + FLARE_SCALE);
  const css = Math.ceil(rMax * 2 + 2);
  const c = document.createElement("canvas");
  c.width = Math.ceil(css * dpr);
  c.height = Math.ceil(css * dpr);
  const g = c.getContext("2d");
  if (g) {
    g.scale(dpr, dpr);
    g.fillStyle = `rgba(${rgb}, ${alpha})`;
    g.beginPath();
    g.arc(css * 0.5, css * 0.5, rMax, 0, TAU);
    g.fill();
  }
  return c;
}

/** Bok sprite'a zaokrąglam w górę do pełnego piksela: przy DPR 1 i 2 bitmapa
 *  wychodzi wtedy równa, bez pół piksela przesunięcia środka kółka. */
const SPRITE_CSS = Math.ceil(DOT_R * (1 + FLARE_SCALE) * 2 + 2);
/** Rozmiar docelowy kropki bez rozbłysku — sprite skalowany do samego DOT_R. */
const BASE_SIZE = (SPRITE_CSS * DOT_R) / (DOT_R * (1 + FLARE_SCALE));
const BASE_HALF = BASE_SIZE * 0.5;
/** Margines wycierania: połowa sprite'a w pełnym rozbłysku plus szarpnięcie. */
const ERASE_M = SPRITE_CSS * 0.5 + JITTER + 1;

/**
 * Zbudowanie matrycy. Odstęp rozluźniam tak długo, aż liczba kropek zejdzie
 * pod pułap — dzięki temu na 5K siatka jest rzadsza, ale nadal równa, zamiast
 * urywać się w połowie kadru.
 */
function build(w: number, h: number): Field {
  let s = SPACING;
  let cols = Math.max(1, Math.floor(w / s));
  let rows = Math.max(1, Math.floor(h / s));
  while (cols * rows > MAX_DOTS) {
    s += 1;
    cols = Math.max(1, Math.floor(w / s));
    rows = Math.max(1, Math.floor(h / s));
  }

  const n = cols * rows;
  const x0 = (w - (cols - 1) * s) * 0.5;
  const y0 = (h - (rows - 1) * s) * 0.5;

  const f: Field = {
    cols,
    rows,
    n,
    s,
    ox: x0,
    oy: y0,
    hx: new Float32Array(n),
    hy: new Float32Array(n),
    x: new Float32Array(n),
    y: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    heat: new Float32Array(n),
    flare: new Float32Array(n),
    tone: new Uint8Array(n),
    live: new Uint8Array(n),
    awake: new Int32Array(n),
    count: 0,
  };

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;

      const jx = (hash2(col, row, 0x9e37) - 0.5) * 2 * JITTER;
      const jy = (hash2(col, row, 0x85eb) - 0.5) * 2 * JITTER;
      const px = x0 + col * s + jx;
      const py = y0 + row * s + jy;
      f.hx[i] = px;
      f.hy[i] = py;
      f.x[i] = px;
      f.y[i] = py;

      // Akcent: co najwyżej JEDEN na blok 3 × 3 oczka, wybrany hashem bloku —
      // i to nie w dowolnym oczku bloku, tylko w jego lewym górnym kwadracie
      // 2 × 2. Ten drugi warunek jest tu po coś: przy wyborze z całych
      // dziewięciu oczek dwa akcenty z SĄSIADUJĄCYCH bloków potrafią wypaść
      // oczko obok oczka, a stykającą się parę cynobru widać natychmiast.
      // Kwadrat 2 × 2 odsuwa je od siebie o co najmniej dwa oczka (36 px)
      // przez samą konstrukcję, nie przez szczęście.
      const bx = Math.floor(col / 3);
      const by = Math.floor(row / 3);
      const pick = Math.floor(hash2(bx, by, 0x27d4) * 4);
      const lc = col - bx * 3;
      const lr = row - by * 3;
      if (
        lr === pick >> 1 &&
        lc === (pick & 1) &&
        hash2(bx, by, 0x1656) < 0.81
      ) {
        f.tone[i] = ACCENT_TONE;
      } else {
        const t = hash2(col, row, 0xc2b2);
        f.tone[i] = t < 0.46 ? 0 : t < 0.74 ? 1 : 2;
      }
    }
  }

  return f;
}

/** Wypalenie całej matrycy w warstwę statyczną (albo wprost w kadr). */
function paintAll(
  g: CanvasRenderingContext2D,
  f: Field,
  sprites: HTMLCanvasElement[],
  w: number,
  h: number
) {
  g.clearRect(0, 0, w, h);
  for (let i = 0; i < f.n; i++) {
    if (f.live[i]) continue;
    g.drawImage(
      sprites[f.tone[i]],
      f.hx[i] - BASE_HALF,
      f.hy[i] - BASE_HALF,
      BASE_SIZE,
      BASE_SIZE
    );
  }
}

export default function DotField({
  target,
  className = "",
}: {
  /** Sekcja hero — z niej biorę ruch kursora i kliknięcia (canvas ich nie łapie). */
  target: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  // Hooki tylko po to, żeby efekt przeliczył się po zmianie ustawień
  // systemowych. Samą decyzję podejmuję niżej synchronicznie, bo wariant
  // SSR-owy obu hooków startuje `false` i bez tego telefon zdążyłby odpalić
  // pętlę na jedną klatkę.
  const reducedPref = useMediaQuerySafe("(prefers-reduced-motion: reduce)");
  const coarsePref = useMediaQuerySafe("(pointer: coarse)");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const host = target.current ?? canvas.parentElement;
    if (!host) return;

    const reduced =
      reducedPref ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = coarsePref || window.matchMedia("(pointer: coarse)").matches;

    let f: Field | null = null;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let left = 0;
    let top = 0;

    /** Warstwa statyczna: wszystkie śpiące kropki, wypalone raz. */
    const stat = document.createElement("canvas");
    const statCtx = stat.getContext("2d");
    if (!statCtx) return;

    let base: HTMLCanvasElement[] = [];
    let full: HTMLCanvasElement[] = [];

    const measure = () => {
      const r = canvas.getBoundingClientRect();
      left = r.left;
      top = r.top;

      const nw = Math.max(1, Math.round(r.width));
      const nh = Math.max(1, Math.round(r.height));
      const ndpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const sizeChanged = nw !== w || nh !== h || ndpr !== dpr;
      if (!sizeChanged && f) return false;

      w = nw;
      h = nh;
      dpr = ndpr;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stat.width = canvas.width;
      stat.height = canvas.height;
      statCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Sprite'y w dwóch kompletach: z wypaloną alfą (zwykła kropka, zero
      // ustawień kontekstu na sztukę) i w pełnej sile, używane razem
      // z `globalAlpha` tylko wtedy, gdy kropka akurat świeci.
      base = TONES.map((t) => sprite(t.rgb, t.alpha, dpr));
      full = TONES.map((t) => sprite(t.rgb, 1, dpr));

      f = build(w, h);
      paintAll(statCtx, f, base, w, h);
      return true;
    };

    // Redukcja ruchu: jeden złożony kadr i koniec. Bez pętli, bez nasłuchów,
    // bez wybuchu — wybuch JEST ruchem, więc komuś, kto poprosił o jego brak,
    // nie mam czego zaoferować poza spokojną matrycą.
    if (reduced) {
      const compose = () => {
        if (measure() && f) paintAll(ctx, f, base, w, h);
      };
      compose();
      const ro = new ResizeObserver(compose);
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    let raf = 0;
    let prev = 0;
    let acc = 0;
    let onScreen = true;
    let rectDirty = false;
    let fastUntil = 0;

    const lens: Lens = { x: 0, y: 0, k: 0 };
    const aim: Lens = { x: 0, y: 0, k: 0 };
    /** Zakres kolumn i wierszy pod soczewką; -1 = soczewka nieaktywna. */
    let lc0 = -1;
    let lc1 = -1;
    let lr0 = -1;
    let lr1 = -1;

    const box: Box = { x0: 0, y0: 0, x1: 0, y1: 0 };
    const painted: Box = { x0: 0, y0: 0, x1: 0, y1: 0 };
    boxReset(box);
    boxReset(painted);

    /**
     * Obudzenie prostokąta siatki. Regularna matryca to jedyny indeks
     * przestrzenny, jakiego tu potrzeba: z promienia i środka wyliczam zakres
     * kolumn i wierszy zwykłym dzieleniem, zamiast przelatywać przez wszystkie
     * kropki. Cały prostokąt wycieram z warstwy statycznej jednym `clearRect`,
     * bo po tej pętli i tak nie ma w nim ani jednej śpiącej kropki.
     */
    const wakeRange = (c0: number, c1: number, r0: number, r1: number) => {
      const field = f;
      if (!field || c1 < c0 || r1 < r0) return;
      const { cols, s, ox, oy } = field;

      const px0 = ox + c0 * s - ERASE_M;
      const py0 = oy + r0 * s - ERASE_M;
      const px1 = ox + c1 * s + ERASE_M;
      const py1 = oy + r1 * s + ERASE_M;
      statCtx.clearRect(px0, py0, px1 - px0, py1 - py0);
      boxAdd(box, px0, py0, px1, py1);

      for (let row = r0; row <= r1; row++) {
        const off = row * cols;
        for (let col = c0; col <= c1; col++) {
          const i = off + col;
          if (field.live[i]) continue;
          field.live[i] = 1;
          field.awake[field.count++] = i;
        }
      }
    };

    const wakeCircle = (cx: number, cy: number, r: number) => {
      const field = f;
      if (!field) return;
      const { cols, rows, s, ox, oy } = field;
      wakeRange(
        Math.max(0, Math.ceil((cx - r - ox) / s)),
        Math.min(cols - 1, Math.floor((cx + r - ox) / s)),
        Math.max(0, Math.ceil((cy - r - oy) / s)),
        Math.min(rows - 1, Math.floor((cy + r - oy) / s))
      );
    };

    /**
     * Zakres soczewki. Po nim poznaję, której kropce nie wolno zasnąć, i on
     * decyduje o budzeniu — ale tylko wtedy, gdy naprawdę się zmienił. Kursor
     * stojący w miejscu nie ma prawa co klatkę wycierać kawałka warstwy
     * statycznej, a przy 30 kl./s przesuwa się o oczko siatki dopiero co jakiś
     * czas, więc ten warunek oszczędza więcej klatek, niż widać.
     */
    const lensRange = () => {
      const field = f;
      if (!field || lens.k <= 0.002) {
        lc0 = lc1 = lr0 = lr1 = -1;
        return;
      }
      const { cols, rows, s, ox, oy } = field;
      const c0 = Math.max(0, Math.ceil((lens.x - LENS_R - ox) / s));
      const c1 = Math.min(cols - 1, Math.floor((lens.x + LENS_R - ox) / s));
      const r0 = Math.max(0, Math.ceil((lens.y - LENS_R - oy) / s));
      const r1 = Math.min(rows - 1, Math.floor((lens.y + LENS_R - oy) / s));
      const moved = c0 !== lc0 || c1 !== lc1 || r0 !== lr0 || r1 !== lr1;
      lc0 = c0;
      lc1 = c1;
      lr0 = r0;
      lr1 = r1;
      if (moved) wakeRange(c0, c1, r0, r1);
    };

    /**
     * Jeden krok fizyki — TYLKO po obudzonych. Kropka, która wróciła do domu,
     * wyhamowała i nie leży pod soczewką, zasypia: domalowuję ją do warstwy
     * statycznej i wypadam z listy przez podmianę z ostatnią.
     */
    const step = () => {
      const field = f;
      if (!field) return;
      const { cols } = field;
      const active = lens.k > 0.002;

      for (let k = 0; k < field.count; ) {
        const i = field.awake[k];

        let ax = (field.hx[i] - field.x[i]) * STIFF;
        let ay = (field.hy[i] - field.y[i]) * STIFF;

        if (active) {
          const dx = field.x[i] - lens.x;
          const dy = field.y[i] - lens.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LENS_R * LENS_R) {
            const d = Math.sqrt(d2) || 0.001;
            const q = d / LENS_R;
            // Zero na krawędzi promienia I zero dokładnie pod kursorem: siła
            // narasta wygładzonym stopniem od środka i gaśnie kwadratowo do
            // rantu, więc nigdzie nie ma progu, na którym kropka by drgnęła.
            const sm = q < LENS_CORE ? q / LENS_CORE : 1;
            const core = sm * sm * (3 - 2 * sm);
            const rim = (1 - q) * (1 - q);
            const fr = (REPEL * lens.k * core * rim) / d;
            ax += dx * fr;
            ay += dy * fr;
          }
        }

        const damp = DAMP_CALM + (DAMP_HOT - DAMP_CALM) * field.heat[i];
        const vx = (field.vx[i] + ax) * damp;
        const vy = (field.vy[i] + ay) * damp;
        field.vx[i] = vx;
        field.vy[i] = vy;
        field.x[i] += vx;
        field.y[i] += vy;
        field.heat[i] *= HEAT_DECAY;
        field.flare[i] *= FLARE_DECAY;

        const ox = field.x[i] - field.hx[i];
        const oy = field.y[i] - field.hy[i];
        const col = i % cols;
        const row = (i / cols) | 0;
        const underLens =
          lc0 >= 0 && col >= lc0 && col <= lc1 && row >= lr0 && row <= lr1;

        if (
          !underLens &&
          field.flare[i] < FLARE_EPS &&
          ox * ox + oy * oy < SLEEP_D2 &&
          vx * vx + vy * vy < SLEEP_V2
        ) {
          field.x[i] = field.hx[i];
          field.y[i] = field.hy[i];
          field.vx[i] = 0;
          field.vy[i] = 0;
          field.heat[i] = 0;
          field.flare[i] = 0;
          field.live[i] = 0;
          statCtx.drawImage(
            base[field.tone[i]],
            field.hx[i] - BASE_HALF,
            field.hy[i] - BASE_HALF,
            BASE_SIZE,
            BASE_SIZE
          );
          field.awake[k] = field.awake[--field.count];
        } else {
          k++;
        }
      }
    };

    /**
     * Wybuch. Impuls prędkości, nie przestawienie pozycji — dzięki temu powrót
     * robi ta sama sprężyna, co zawsze, i nie muszę nigdzie trzymać osobnej
     * animacji. Siła spada z odległością dwoma czynnikami naraz: miękkim
     * rdzeniem (blisko epicentrum prawie płaskim) i twardym oknem, które zeruje
     * wszystko poza zasięgiem.
     */
    const burst = (cx: number, cy: number) => {
      const field = f;
      if (!field) return;
      wakeCircle(cx, cy, BURST_R);

      for (let k = 0; k < field.count; k++) {
        const i = field.awake[k];
        const dx = field.x[i] - cx;
        const dy = field.y[i] - cy;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d > BURST_R) continue;

        let ux: number;
        let uy: number;
        if (d < 1) {
          // Kropka dokładnie pod kliknięciem nie ma kierunku — losuję jej jeden.
          const a = Math.random() * TAU;
          ux = Math.cos(a);
          uy = Math.sin(a);
          d = 1;
        } else {
          ux = dx / d;
          uy = dy / d;
        }

        const core = 1 / (1 + (d / BURST_CORE) * (d / BURST_CORE));
        const amp = core * (1 - d / BURST_R);
        if (amp < 0.01) continue;

        const spread = (Math.random() - 0.5) * BURST_SPREAD;
        const cs = Math.cos(spread);
        const sn = Math.sin(spread);
        const kick = BURST_V * amp;

        field.vx[i] += (ux * cs - uy * sn) * kick;
        field.vy[i] += (ux * sn + uy * cs) * kick;
        field.heat[i] = Math.min(1, field.heat[i] + amp);
        field.flare[i] = Math.min(1, field.flare[i] + amp * 0.9);
      }
    };

    /**
     * Klatka. Sprzątam i odtwarzam tło TYLKO w prostokącie, który tego
     * potrzebuje: sumie tego, co malowałem poprzednio, i tego, co ruszyło się
     * teraz. Przy kursorze to okno kilkuset pikseli, przy wybuchu rośnie do
     * niemal całego kadru — i tak ma być, bo wtedy faktycznie zmienia się
     * niemal cały kadr.
     */
    const paint = () => {
      const field = f;
      if (!field) return;

      for (let k = 0; k < field.count; k++) {
        const i = field.awake[k];
        boxAdd(
          box,
          field.x[i] - ERASE_M,
          field.y[i] - ERASE_M,
          field.x[i] + ERASE_M,
          field.y[i] + ERASE_M
        );
      }

      const ux0 = Math.min(box.x0, painted.x0);
      const uy0 = Math.min(box.y0, painted.y0);
      const ux1 = Math.max(box.x1, painted.x1);
      const uy1 = Math.max(box.y1, painted.y1);
      boxCopy(painted, box);
      boxReset(box);

      if (ux1 <= ux0 || uy1 <= uy0) return;

      // Prostokąt liczę w pikselach URZĄDZENIA i dopiero dzielę przez DPR:
      // przy ułamkowym DPR źródło i cel muszą trafiać w tę samą kratkę, bo
      // inaczej blit resampluje i statyczne kropki lekko drgają.
      const sx = Math.max(0, Math.floor(ux0 * dpr));
      const sy = Math.max(0, Math.floor(uy0 * dpr));
      const sw = Math.min(canvas.width - sx, Math.ceil(ux1 * dpr) - sx);
      const sh = Math.min(canvas.height - sy, Math.ceil(uy1 * dpr) - sy);
      if (sw <= 0 || sh <= 0) return;

      const dx = sx / dpr;
      const dy = sy / dpr;
      const dw = sw / dpr;
      const dh = sh / dpr;

      ctx.clearRect(dx, dy, dw, dh);
      ctx.drawImage(stat, sx, sy, sw, sh, dx, dy, dw, dh);

      for (let k = 0; k < field.count; k++) {
        const i = field.awake[k];
        const fl = field.flare[i];
        if (fl > FLARE_EPS) {
          const size = BASE_SIZE * (1 + fl * FLARE_SCALE);
          const half = size * 0.5;
          ctx.globalAlpha = Math.min(
            1,
            TONES[field.tone[i]].alpha * (1 + fl * FLARE_ALPHA)
          );
          ctx.drawImage(full[field.tone[i]], field.x[i] - half, field.y[i] - half, size, size);
          ctx.globalAlpha = 1;
        } else {
          ctx.drawImage(
            base[field.tone[i]],
            field.x[i] - BASE_HALF,
            field.y[i] - BASE_HALF,
            BASE_SIZE,
            BASE_SIZE
          );
        }
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      const dt = now - prev;
      const budget = now < fastUntil ? FRAME_FAST : FRAME_SLOW;
      if (dt < budget) return;
      prev = now;

      if (rectDirty) {
        const r = canvas.getBoundingClientRect();
        left = r.left;
        top = r.top;
        rectDirty = false;
      }

      acc += Math.min(dt, 200) / 1000;

      lens.x += (aim.x - lens.x) * 0.16;
      lens.y += (aim.y - lens.y) * 0.16;
      lens.k += (aim.k - lens.k) * 0.09;
      lensRange();

      let steps = 0;
      while (acc >= STEP && steps < MAX_STEPS) {
        step();
        acc -= STEP;
        steps++;
      }
      // Po powrocie z uśpienia nadmiar czasu wyrzucam zamiast go odrabiać:
      // pole ma podjąć ruch, a nie przewinąć dwie minuty fizyki naraz.
      if (steps === MAX_STEPS) acc = 0;

      paint();

      // Kiedy nic już nie lata, nie ma kursora nad polem i ostatni brud został
      // zamalowany, pętla po prostu staje. To jest jedyny stan spoczynku,
      // jakiego to tło potrzebuje — i dotyczy tak samo myszy, jak dotyku.
      if (
        f &&
        f.count === 0 &&
        lens.k < 0.002 &&
        aim.k < 0.002 &&
        painted.x1 <= painted.x0
      ) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const start = () => {
      if (raf || !onScreen || document.hidden) return;
      prev = performance.now();
      acc = 0;
      rectDirty = true;
      raf = requestAnimationFrame(tick);
    };

    const sync = () => {
      if (!onScreen || document.hidden) {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
        return;
      }
      // Wracając w kadr, pętlę wznawiam tylko wtedy, gdy jest co dokończyć:
      // coś jeszcze lata, kursor stoi nad polem albo został niezamalowany brud.
      if (f && (f.count > 0 || aim.k > 0.002 || painted.x1 > painted.x0)) start();
    };

    const onScroll = () => {
      rectDirty = true;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      aim.x = e.clientX - left;
      aim.y = e.clientY - top;
      if (aim.k === 0) {
        // Wejście kursora nad pole: soczewkę stawiam od razu na miejscu,
        // inaczej przez pierwsze pół sekundy przejechałaby przez pół kadru,
        // budząc po drodze wszystko, co napotka.
        lens.x = aim.x;
        lens.y = aim.y;
      }
      aim.k = 1;
      start();
    };

    const onLeave = () => {
      aim.k = 0;
    };

    const onClick = (e: MouseEvent) => {
      // Kliknięcie w link, przycisk czy pole formularza należy do nich.
      // Pole jest tłem i tło dopycha się ostatnie.
      const el = e.target;
      if (el instanceof Element && el.closest(INTERACTIVE)) return;

      if (rectDirty) {
        const r = canvas.getBoundingClientRect();
        left = r.left;
        top = r.top;
        rectDirty = false;
      }

      burst(e.clientX - left, e.clientY - top);
      fastUntil = performance.now() + FAST_MS;
      start();
    };

    const compose = () => {
      if (!measure() || !f) return;
      // Po przebudowie matrycy nic nie śpi poza warstwą statyczną, więc kadr
      // jest jej wiernym odbiciem: jeden blit i koniec.
      boxReset(box);
      boxReset(painted);
      // Nowa matryca ma inne oczka, więc stary zakres soczewki jest bez sensu.
      lc0 = lc1 = lr0 = lr1 = -1;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(stat, 0, 0, canvas.width, canvas.height, 0, 0, w, h);
    };

    compose();

    const ro = new ResizeObserver(compose);
    ro.observe(canvas);

    // Poza kadrem nie ma czego animować — hero wyjeżdża w górę po kilku
    // ruchach kółka i od tego momentu pętla stoi.
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? true;
        sync();
      },
      { rootMargin: "80px" }
    );
    io.observe(canvas);

    document.addEventListener("visibilitychange", sync);
    window.addEventListener("scroll", onScroll, { passive: true });
    host.addEventListener("click", onClick);
    if (!coarse) {
      host.addEventListener("pointermove", onMove, { passive: true });
      host.addEventListener("pointerleave", onLeave);
    }

    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("scroll", onScroll);
      host.removeEventListener("click", onClick);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reducedPref, coarsePref, target]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      // Bez JS-a zostaje pusty, przezroczysty element: jasne hero składa się
      // wtedy dokładnie tak samo, tylko bez matrycy.
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ WebkitMaskImage: MASK, maskImage: MASK }}
    />
  );
}
