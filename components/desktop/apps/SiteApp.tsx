"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Lock,
  RotateCw,
} from "lucide-react";
import { GithubIcon } from "@/components/logos";
import type { ShowcaseSite } from "@/data/showcase";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { useWindowChrome } from "@/components/desktop/Window";
import { SITE_GLYPHS } from "@/components/desktop/siteGlyphs";

/** Kafelek z brandowym znakiem strony; litera tylko awaryjnie */
function SiteTile({ site }: { site: ShowcaseSite }) {
  return (
    <div
      aria-hidden
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24%] text-xl font-bold text-white shadow-soft"
      style={{ background: site.gradient }}
    >
      {SITE_GLYPHS[site.slug] ?? site.name.charAt(0).toUpperCase()}
    </div>
  );
}

/** URL bez protokołu i końcowego slasha — do pola adresu */
function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/**
 * Iframe "desktop w miniaturze": strona renderuje się w wirtualnej
 * szerokości desktopowej (1366 px) i jest skalowana transformem do
 * rozmiaru okna — zawsze widać prawdziwy układ desktop, nie tablet.
 */
const VIRTUAL_W = 1366;

export function ScaledFrame({
  src,
  title,
  reloadKey = 0,
  onLoad,
}: {
  src: string;
  title: string;
  reloadKey?: number;
  onLoad?: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Nie powiększamy ponad 1:1 — tylko zmniejszamy do szerokości okna
  const scale = box ? Math.min(1, box.w / VIRTUAL_W) : 1;

  return (
    <div
      ref={ref}
      className="h-full w-full overflow-hidden"
      // Fokus w cross-origin iframe wywołuje scrollIntoView — cofamy je,
      // żeby przeskalowana treść nie "uciekała" wewnątrz przyciętego boxu
      onScroll={(e) => {
        e.currentTarget.scrollTop = 0;
        e.currentTarget.scrollLeft = 0;
      }}
    >
      {box && box.w > 50 && (
        <iframe
          key={reloadKey}
          src={src}
          title={title}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
          onLoad={onLoad}
          className="border-0"
          style={{
            width: box.w / scale,
            height: box.h / scale,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      )}
    </div>
  );
}

/** Chipy technologii — wspólny drobiazg przeglądu */
function TechChips({ tech }: { tech: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tech.map((item) => (
        <li
          key={item}
          className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink/70"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Zakładka Przegląd: czym jest projekt, jak powstał, rola, technologie. */
function Overview({
  site,
  onOpenLive,
}: {
  site: ShowcaseSite;
  onOpenLive?: () => void;
}) {
  const t = useT();

  const block = (heading: string, text: string) => (
    <div>
      <h2 className="text-[12px] font-semibold uppercase tracking-[0.07em] text-muted">
        {heading}
      </h2>
      <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-ink/80">
        {text}
      </p>
    </div>
  );

  return (
    <div className="px-8 py-7">
      <div className="flex items-center gap-4">
        <SiteTile site={site} />
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold tracking-tight text-ink">
            {site.name}
          </h1>
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-muted">
            {t(site.tag)}
          </p>
        </div>
      </div>

      <div className="mt-7 space-y-6">
        {block(t(ui.desktop.whatIsIt), t(site.overview.what))}
        {block(t(ui.desktop.howItWasBuilt), t(site.overview.how))}
        {block(t(ui.desktop.myRole), t(site.overview.role))}
        <div>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.07em] text-muted">
            {t(ui.desktop.techStack)}
          </h2>
          <div className="mt-2">
            <TechChips tech={site.overview.tech} />
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2.5 border-t border-line/60 pt-6">
        {onOpenLive && (
          <button
            type="button"
            onClick={onOpenLive}
            className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-accent/90"
          >
            {t(ui.desktop.liveTab)}
          </button>
        )}
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-black/[0.04]"
        >
          {t(ui.actions.openSite)}
          <ArrowUpRight size={14} aria-hidden />
        </a>
        {site.repo && (
          <a
            href={site.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-black/[0.04]"
          >
            <GithubIcon size={14} aria-hidden />
            {t(ui.actions.sourceCode)}
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Aplikacja projektu: zakładka Przegląd (opis + technologie) i Na żywo
 * (mini-przeglądarka ze skalowanym iframe'em w układzie desktopowym).
 */
export default function SiteApp({ site }: { site: ShowcaseSite }) {
  const { selectionFor } = useDesktop();
  const { focused, interacting } = useWindowChrome();
  const t = useT();
  // Na dotyku/małym ekranie (sheet) nie osadzamy — przegląd z linkiem
  const isSmall = useMediaQuery("(max-width: 767px)");
  const launchSelection = selectionFor(`site:${site.slug}`);
  const launchView =
    launchSelection?.area === "showcase" &&
    launchSelection.slug === site.slug &&
    launchSelection.view
      ? launchSelection.view
      : undefined;
  const [view, setView] = useState(() => ({
    launchSelection,
    tab: launchView ?? ("overview" as "overview" | "live"),
  }));
  const [loaded, setLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  if (launchView && view.launchSelection !== launchSelection) {
    setView({ launchSelection, tab: launchView });
  }

  const tab = view.tab;
  const selectTab = (nextTab: "overview" | "live") =>
    setView({ launchSelection, tab: nextTab });

  if (isSmall || !site.embed) {
    return <Overview site={site} />;
  }

  const toolbarBtn =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-black/[0.06] hover:text-ink";

  const segment = (value: "overview" | "live", label: string) => (
    <button
      type="button"
      onClick={() => selectTab(value)}
      aria-pressed={tab === value}
      className={`rounded-[7px] px-3 py-[3px] text-[12px] font-semibold transition-all duration-200 ${
        tab === value
          ? "bg-white text-ink shadow-sm ring-1 ring-black/[0.06]"
          : "text-muted hover:text-ink"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Pasek narzędzi: segmenty zakładek + adres + akcje */}
      <div className="flex h-11 shrink-0 select-none items-center gap-1.5 border-b border-black/[0.06] px-2.5">
        <div className="flex items-center gap-0.5 rounded-[9px] bg-black/[0.05] p-[3px]">
          {segment("overview", t(ui.desktop.overviewTab))}
          {segment("live", t(ui.desktop.liveTab))}
        </div>

        {tab === "live" ? (
          <>
            <span
              aria-hidden
              className={`${toolbarBtn} !cursor-default opacity-40`}
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </span>
            <span
              aria-hidden
              className={`${toolbarBtn} !cursor-default opacity-40`}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </span>
            <button
              type="button"
              aria-label={t(ui.actions.reload)}
              className={toolbarBtn}
              onClick={() => {
                setLoaded(false);
                setReloadKey((k) => k + 1);
              }}
            >
              <RotateCw size={13.5} strokeWidth={2} />
            </button>
            <div className="mx-1 flex h-7 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg bg-black/[0.05] px-3">
              <Lock size={11} aria-hidden className="shrink-0 text-muted" />
              <span className="truncate text-[12px] font-medium text-ink/75">
                {displayUrl(site.url)}
              </span>
            </div>
          </>
        ) : (
          <div className="flex-1" />
        )}

        {site.repo && (
          <a
            href={site.repo}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${site.name} · GitHub`}
            title="GitHub"
            className={toolbarBtn}
          >
            <GithubIcon size={15} strokeWidth={1.8} />
          </a>
        )}
        <a
          href={site.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${t(ui.actions.openInNewTab)}: ${site.name}`}
          title={t(ui.actions.openInNewTab)}
          className={toolbarBtn}
        >
          <ArrowUpRight size={16} strokeWidth={1.8} />
        </a>
      </div>

      {tab === "overview" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Overview site={site} onOpenLive={() => selectTab("live")} />
        </div>
      ) : (
        // min-h-0: iframe (wyższy layoutowo od kontenera przez skalowanie)
        // nie może rozpychać flex itemu — inaczej pętla wzrostu z ResizeObserverem
        <div className="relative min-h-0 flex-1 overflow-hidden bg-white">
          <ScaledFrame
            src={site.url}
            title={`${site.name} · live`}
            reloadKey={reloadKey}
            onLoad={() => setLoaded(true)}
          />
          {/* Ekran ładowania, dopóki iframe nie zgłosi load */}
          {!loaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f5f5f7]">
              <SiteTile site={site} />
              <p className="flex items-center gap-2 text-[13px] text-muted">
                <LoaderCircle size={14} aria-hidden className="animate-spin" />
                {t(ui.desktop.connecting)} {displayUrl(site.url)}…
              </p>
            </div>
          )}
          {/*
           * Nakładka nad iframe'em:
           * - okno nieaktywne → pierwszy klik fokusuje okno zamiast ginąć
           *   w cross-origin iframe;
           * - drag/resize → iframe nie połyka pointermove.
           */}
          {(!focused || interacting) && (
            <div aria-hidden className="absolute inset-0" />
          )}
        </div>
      )}
    </div>
  );
}
