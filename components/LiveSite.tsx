"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { LoaderCircle, MousePointerClick } from "lucide-react";
import { ui } from "@/data/ui";
import { useT, type L10n } from "@/lib/lang-store";

/**
 * Żywy podgląd strony w kadrze okna.
 *
 * Ten sam mechanizm, co mini-przeglądarka w trybie pulpitu: strona renderuje
 * się w wirtualnej szerokości desktopu i dopiero potem zjeżdża transformem do
 * rozmiaru kadru. Bez tego iframe o szerokości 677px dostałby od strony układ
 * mobilny, czyli dowód na coś, czego w produkcie nie ma.
 *
 * Warstwą bazową jest zawsze statyczny kadr, a iframe wjeżdża nad niego
 * dopiero po `load`. Dzięki temu nie ma stanu, w którym w oknie nie ma nic:
 * ani przed zamontowaniem, ani bez JS-a, ani gdy serwer odmówi osadzenia.
 *
 * Dwa tryby pracy:
 *
 * - w kolumnie (domyślny) podgląd jest „za szybą": nie łapie wskaźnika, więc
 *   scroll strony nigdy nie wpada do obcego dokumentu. Szyba jest przyciskiem
 *   i prowadzi do widoku rozłożonego, bo czytanie strony pomniejszonej do
 *   niespełna połowy to nie jest oferta, którą warto komuś składać;
 * - w nakładce (`interactive`) wskaźnik należy do strony od pierwszej klatki.
 *   Po to się ją otwiera, więc pytanie o zgodę drugi raz byłoby zbędne.
 *
 * Trzy rzeczy, które ten komponent musi trzymać w ryzach:
 *
 * 1. Pętla wzrostu. Przeskalowany iframe jest layoutowo wyższy od swojego
 *    kadru. Gdyby kadr mógł rosnąć za treścią, ResizeObserver zmierzyłby
 *    większy box, powiększył iframe, znowu zmierzył i tak aż do limitu
 *    przeglądarki. Kadrem jest tu pudełko o stałych proporcjach z MacWindow,
 *    a host siedzi w nim na inset-0, więc rozmiar płynie tylko z góry na dół.
 *    Do tego zaokrąglam pomiar i ignoruję zmiany poniżej piksela, żeby nawet
 *    drgnięcie subpikselowe nie odpaliło kolejnego renderu.
 * 2. Ucieczka scrolla. Fokus w cross-origin iframie woła scrollIntoView, a to
 *    przesuwa nawet box z overflow-hidden. Zeruję scroll hosta w reakcji na
 *    zdarzenie.
 * 3. Koszt. Iframe montuje się dopiero, gdy kadr jest blisko ekranu.
 */

/**
 * Domyślna wirtualna szerokość okna.
 *
 * Szedłem tu w dwie strony, więc zapisuję, dlaczego stanęło na 1440. Przy
 * 1024px skala rosła i litery były większe, ale strona Squizzu jest wtedy
 * u siebie ciasna: bańki z ikonami technologii mają w dużej mierze stały
 * rozmiar, więc przy węższym oknie puchną względem hasła i rozwalają kadr,
 * który miał być dowodem na dobry układ. 1440 to szerokość, w której ta
 * strona jest projektowana i w której zrobiony jest kadr zastępczy, więc
 * kompozycja zgadza się z tym, co zatwierdzone.
 *
 * Za to płacę skalą: w kolumnie wychodzi około 0,47 i tekst jest tam mały.
 * Świadomie, bo kadr w kolumnie jest plakatem. Czytanie zaczyna się
 * w nakładce, gdzie ta sama strona dochodzi do skali 1:1.
 */
const DEFAULT_VIRTUAL_W = 1440;

/**
 * Ile czekam na `load`, zanim zostawię kadr statyczny. Serwer, który odmawia
 * osadzenia, potrafi nie odpalić `error` w ogóle, więc sam handler błędu to
 * za mało.
 */
const LOAD_TIMEOUT = 8000;

/** Zapas montowania: iframe startuje, gdy kadr jest jeszcze pod ekranem */
const NEAR_MARGIN = "200px 0px";

/** Teksty tego podglądu; nigdzie indziej nie występują, więc żyją tutaj */
const COPY = {
  open: {
    pl: "Kliknij, aby przeglądać",
    en: "Click to interact",
  },
} satisfies Record<string, L10n>;

export default function LiveSite({
  src,
  label,
  still,
  virtualWidth = DEFAULT_VIRTUAL_W,
  interactive = false,
  onOpen,
  triggerRef,
}: {
  /** Adres osadzanej strony */
  src: string;
  /** Domena do komunikatu ładowania i tytułu ramki */
  label: string;
  /** Kadr statyczny: warstwa bazowa i jednocześnie plan awaryjny */
  still: ReactNode;
  /** Szerokość, w jakiej renderuje się osadzona strona przed przeskalowaniem */
  virtualWidth?: number;
  /** Strona dostaje wskaźnik i klawiaturę od razu (widok w nakładce) */
  interactive?: boolean;
  /** Klik w szybę; bez tego kadr jest tylko do oglądania */
  onOpen?: () => void;
  /** Szyba jako element wywołujący, żeby fokus miał dokąd wrócić */
  triggerRef?: RefObject<HTMLButtonElement | null>;
}) {
  const t = useT();
  const hostRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Montowanie na podejściu do ekranu
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setNear(true);
        observer.disconnect();
      },
      { rootMargin: NEAR_MARGIN }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Pomiar kadru. Zaokrąglony i z progiem piksela: patrz punkt 1 wyżej
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const w = Math.round(entry.contentRect.width);
      const h = Math.round(entry.contentRect.height);
      setBox((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Strażnik ciszy: brak `load` w rozsądnym czasie traktuję jak odmowę
  useEffect(() => {
    if (!near || loaded || failed) return;
    const id = window.setTimeout(() => setFailed(true), LOAD_TIMEOUT);
    return () => window.clearTimeout(id);
  }, [near, loaded, failed]);

  // Nigdy nie powiększam ponad 1:1: strona szersza od swojego kadru schodzi
  // do jego rozmiaru, węższemu kadrowi oddaję po prostu naturalną wielkość
  const scale = box ? Math.min(1, box.w / virtualWidth) : 1;
  const mounted = near && !failed && box !== null && box.w > 50;
  // Szyba pojawia się dopiero nad gotową stroną: zaproszenie do przeglądania
  // czegoś, co się jeszcze ładuje, jest zaproszeniem na pusty ekran
  const showGlass = Boolean(onOpen) && !interactive && mounted && loaded;

  return (
    <div
      ref={hostRef}
      // Lenis ma trzymać ręce przy sobie, kiedy kółko należy do strony.
      // Ten sam atrybut, co na modalu projektu.
      data-lenis-prevent={interactive ? "" : undefined}
      className="absolute inset-0 overflow-hidden"
      onScroll={(e) => {
        e.currentTarget.scrollTop = 0;
        e.currentTarget.scrollLeft = 0;
      }}
    >
      {/* Warstwa bazowa. Niesie też opis kadru dla czytnika ekranu: żywa
          strona nad nią jest tym samym widokiem, tylko odświeżonym. */}
      {still}

      {mounted && box && (
        <iframe
          src={src}
          title={label}
          loading="lazy"
          // Bez allow-popups: osadzona strona nie ma prawa otwierać kart
          sandbox="allow-scripts allow-same-origin allow-forms"
          // Za szybą treść kadru opisuje warstwa bazowa, a nie cała obca
          // strona, i klawiatura nie ma po co w nią wchodzić. W nakładce
          // ramka jest treścią właściwą, więc oba zastrzeżenia znikają.
          aria-hidden={interactive ? undefined : true}
          tabIndex={interactive ? 0 : -1}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`absolute left-0 top-0 border-0 transition-opacity duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          } ${interactive ? "" : "pointer-events-none"}`}
          style={{
            width: box.w / scale,
            height: box.h / scale,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      )}

      {/* Szyba. Prawdziwy przycisk, nie nakładka z onClickiem: to jedyny
          sposób, żeby ten sam gest dało się wykonać Enterem. Nazwę bierze
          z widocznego napisu, więc etykieta i treść nie mogą się rozjechać. */}
      {showGlass && (
        <button
          ref={triggerRef}
          type="button"
          onClick={onOpen}
          className="group absolute inset-0 z-10 flex cursor-pointer items-center justify-center"
        >
          <span className="flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 text-[12px] font-semibold text-ink opacity-0 ring-1 ring-ink/10 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            <MousePointerClick size={13} aria-hidden />
            {t(COPY.open)}
          </span>
        </button>
      )}

      {/* Znacznik doładowywania siedzi w rogu, bo pod nim jest już co oglądać */}
      <div
        aria-hidden
        className={`absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-ink/70 ring-1 ring-ink/10 backdrop-blur-sm transition-opacity duration-500 ${
          mounted && !loaded ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <LoaderCircle size={11} aria-hidden className="animate-spin" />
        {t(ui.desktop.connecting)} {label}…
      </div>
    </div>
  );
}
