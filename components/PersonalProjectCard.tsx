"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Monitor, Radar } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PersonalProject } from "@/data/personal";
import { useT } from "@/lib/lang-store";
import LazyVideo from "@/components/LazyVideo";

/**
 * Ikony trzymamy tu, nie w pliku danych: ten sam wzorzec co HOBBY_ICONS
 * w Extras.tsx. Dzięki temu data/personal.ts zostaje czystym TypeScriptem,
 * bez importu komponentów.
 */
const PROJECT_ICONS: Record<string, LucideIcon> = {
  "interactive-os": Monitor,
  venor: Radar,
};

/**
 * Karta projektu osobistego, w dwóch układach o wspólnej kolejności czytania.
 *
 * Domyślny jest wąską kolumną i stoi w siatce obok drugiej karty. Szeroki
 * włącza `visual` i dokłada pod tekstem materiał na pełną szerokość.
 *
 * Stopka jest slotem, bo jedna karta prowadzi do trybu pulpitu przyciskiem,
 * a druga nie ma dokąd prowadzić i niesie samą notkę. `mt-auto` dosuwa ją do
 * dołu, więc karty w jednym rzędzie kończą się na tej samej linii.
 *
 * Uwaga na pułapkę opisaną w Timeline.tsx: na elemencie oddawanym do <Reveal>
 * nie wolno stawiać klas transformujących, bo framer-motion je nadpisuje.
 */
export default function PersonalProjectCard({
  project,
  footer,
  visual,
  showHighlights = true,
}: {
  project: PersonalProject;
  footer?: ReactNode;
  /** Materiał pod tekstem. Gdy jest, karta przechodzi w układ pełnej szerokości. */
  visual?: ReactNode;
  /**
   * Punkty wewnątrz karty. Wyłączamy je tam, gdzie sekcja trzyma je nadal
   * w osobnej karcie obok, żeby ta sama treść nie padła dwa razy.
   */
  showHighlights?: boolean;
}) {
  const t = useT();
  const Icon = PROJECT_ICONS[project.id] ?? Monitor;
  const media = project.media;

  const head = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-accent-bright">
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-5 text-caption uppercase text-white/40">
        {t(project.label)}
      </p>
      <h4 className="mt-2 text-[16px] font-semibold leading-snug tracking-tight">
        {project.name}
      </h4>
      {/* Miara wiersza: pełna szerokość karty dałaby ok. 110 znaków */}
      <p
        className={`mt-3 text-[14px] leading-relaxed text-white/65 ${
          visual ? "max-w-[68ch]" : ""
        }`}
      >
        {t(project.summary)}
      </p>
    </>
  );

  /* W karcie szerokiej punkty idą na dwie kolumny: cztery jeden pod drugim
     robią z karty słup, którego materiał pod spodem nie ma czym zrównoważyć. */
  const bullets = !showHighlights ? null : (
    <ul
      className={
        visual
          ? "mt-5 grid gap-x-10 gap-y-3 text-[13px] leading-relaxed text-white/70 md:grid-cols-2"
          : "mt-4 space-y-2 text-[13px] leading-relaxed text-white/70"
      }
    >
      {project.highlights.map((highlight, i) => (
        <li key={i} className="flex gap-2.5">
          <span
            aria-hidden
            className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent-bright"
          />
          {t(highlight)}
        </li>
      ))}
    </ul>
  );

  /* Granica obietnicy pod hairline'em: ta sama gramatyka cienkiej kreski, co
     reszta strony. Schodzi poniżej punktów, bo mówi, czego narzędzie NIE robi,
     i nie ma konkurować z tym, co robi. */
  const boundary = project.boundary ? (
    <p className="mt-4 border-t border-white/10 pt-3 text-[12px] leading-relaxed text-white/45">
      {t(project.boundary)}
    </p>
  ) : null;

  const pillList = (items: string[]) => (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white/75"
        >
          {item}
        </li>
      ))}
    </ul>
  );

  /* Grupy tylko w karcie szerokiej, bo w wąskiej kolumnie ich nagłówki zjadają
     więcej wysokości, niż wnosi sam podział. Obok siebie powtarzają podział
     stref z mapy pod spodem, więc oko łączy pigułkę z miejscem, w którym dana
     rzecz naprawdę działa. */
  const pills =
    visual && project.techGroups ? (
      <div className="mt-6 grid gap-x-10 gap-y-4 md:grid-cols-2">
        {project.techGroups.map((group) => (
          <div key={group.items.join()}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-white/40">
              {t(group.label)}
            </p>
            <div className="mt-2">{pillList(group.items)}</div>
          </div>
        ))}
      </div>
    ) : (
      <div className="mt-4">{pillList(project.tech)}</div>
    );

  const foot = (
    <div className="mt-auto flex flex-wrap items-center gap-2.5 pt-6">
      {footer}
    </div>
  );

  if (visual) {
    return (
      /* Materiał leży pod tekstem, a nie w kolumnie obok niego. Kolumna
       * tekstu i kolumna diagramu mają różną wysokość i różnicy nie da się
       * usunąć bez rozciągania jednej z nich; pas na pełnej szerokości
       * likwiduje problem razem z kolumnami, a przy okazji daje sygnałowi
       * czterokrotnie dłuższą drogę.
       */
      <div className="rounded-card bg-ink p-7 text-white shadow-soft md:p-9">
        {head}
        {bullets}
        {boundary}
        {pills}
        {foot}
        <div className="mt-8 border-t border-white/10 pt-7">{visual}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-card bg-ink p-7 text-white shadow-soft">
      {head}

      {media &&
        (/\.(webm|mp4)$/.test(media) ? (
          <LazyVideo
            src={media}
            className="mt-4 aspect-video w-full rounded-xl ring-1 ring-white/10"
          />
        ) : (
          <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-xl ring-1 ring-white/10">
            <Image
              src={media}
              alt={project.name}
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover"
            />
          </div>
        ))}

      {bullets}
      {boundary}
      {pills}
      {foot}
    </div>
  );
}
