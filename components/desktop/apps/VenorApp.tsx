"use client";

import { Radar } from "lucide-react";
import { venor } from "@/data/personal";
import { useT } from "@/lib/lang-store";
import VenorPipeline from "@/components/VenorPipeline";

/**
 * Venor — wewnętrzny system prospectingu Ultra Studio.
 *
 * Ten sam materiał, co karta w prostym widoku, przełożony na gramatykę okna:
 * jasna treść, a mapa systemu w ciemnym bloku, jak dysertacja w Edukacji.
 * Treść czyta z data/personal.ts, więc oba tryby nie mają jak się rozjechać.
 */
export default function VenorApp() {
  const t = useT();

  return (
    <div className="px-8 py-7">
      {/* Przy ikonie stoi tylko etykieta i nazwa. Opis schodzi niżej, żeby
          on, punkty i granica dzieliły jedną krawędź lewą: inaczej nagłówek
          jest wcięty o szerokość ikony, a reszta nie. */}
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[24%] bg-accent/10 text-accent">
          <Radar size={24} strokeWidth={1.7} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
            {t(venor.label)}
          </p>
          <h1 className="mt-0.5 text-[19px] font-bold tracking-tight text-ink">
            {venor.name}
          </h1>
        </div>
      </div>

      <p className="mt-5 text-[13px] leading-relaxed text-muted">
        {t(venor.summary)}
      </p>

      <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-ink/75">
        {venor.highlights.map((highlight, i) => (
          <li key={i} className="flex gap-2">
            <span
              aria-hidden
              className="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-accent"
            />
            {t(highlight)}
          </li>
        ))}
      </ul>

      {venor.boundary && (
        <p className="mt-5 border-t border-line/60 pt-4 text-[12.5px] leading-relaxed text-muted">
          {t(venor.boundary)}
        </p>
      )}

      {/* Okno da się zwęzić do 360 px, a mapa przełącza się na układ poziomy
          progiem viewportu, nie szerokością okna. Stąd własny scroll poziomy
          i minimalna szerokość: przy wąskim oknie mapa się przewija, zamiast
          rozjeżdżać treść pod spodem. */}
      <div className="mt-6 overflow-x-auto rounded-2xl bg-ink p-6 text-white">
        <div className="min-w-[520px]">
          <VenorPipeline />
        </div>
      </div>

      {venor.techGroups && (
        <div className="mt-6 grid gap-x-10 gap-y-5 border-t border-line/60 pt-5 sm:grid-cols-2">
          {venor.techGroups.map((group) => (
            <div key={group.items.join()}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
                {t(group.label)}
              </h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-line/80 bg-white px-2.5 py-0.5 text-[11px] font-medium text-ink/70"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {venor.note && (
        <p className="mt-5 text-[12.5px] text-muted">{t(venor.note)}</p>
      )}
    </div>
  );
}
