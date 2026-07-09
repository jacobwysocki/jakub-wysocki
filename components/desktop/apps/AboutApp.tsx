"use client";

import type { LucideIcon } from "lucide-react";
import { Earth, Footprints, Mountain, Trophy, Waves, Zap } from "lucide-react";
import { site } from "@/data/site";
import { hobbies } from "@/data/education";
import { ui } from "@/data/ui";
import { isWordSuffix, useLang, useT } from "@/lib/lang-store";

/** Ikony pasji — lustrzane do sekcji Extras w prostej wersji */
const HOBBY_ICONS: Record<string, LucideIcon> = {
  hiking: Mountain,
  diving: Waves,
  running: Footprints,
  racket: Trophy,
  travel: Earth,
};

/** „O mnie" w skórce Notatek: data, portret + bio, metryki, pasje. */
export default function AboutApp() {
  const t = useT();
  const lang = useLang();
  const today = new Date().toLocaleDateString(lang === "pl" ? "pl-PL" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-8 py-7">
      <p className="text-center text-[12px] text-muted">{today}</p>

      {/* Portret po lewej, nagłówek + bio po prawej */}
      <div className="mt-5 flex items-start gap-6">
        {/* Ciemne zdjęcie osadzone miękko w jasnej skórce Notatek:
            bez białej ramki, z ciepłą poświatą nawiązującą do rim lightu */}
        <span className="relative hidden shrink-0 sm:block">
          <span
            aria-hidden
            className="absolute inset-0 -z-10 scale-110 rounded-[22px] bg-accent/25 blur-xl"
          />
          <img
            src="/images/portrait.png"
            alt="Jakub Wysocki — portret"
            className="h-48 w-[150px] rounded-[18px] object-cover object-top shadow-soft ring-1 ring-line/50"
          />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight text-ink">
            {t(site.hero.headline)}
          </h1>
          <p className="mt-1.5 text-[14px] font-medium text-muted">
            {t(site.hero.subline)}
          </p>
          <p className="mt-4 text-[14.5px] leading-relaxed text-ink/85">
            {t(site.about.paragraph)}
          </p>
        </div>
      </div>

      <dl className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line/60 pt-6 sm:grid-cols-3">
        {site.metrics.map((metric, i) => (
          <div key={i} className="flex flex-col">
            <dt className="order-2 mt-1 text-[11.5px] leading-snug text-muted">
              {t(metric.label)}
            </dt>
            <dd className="order-1 text-[22px] font-bold tracking-tight text-ink">
              {metric.value}
              {isWordSuffix(t(metric.suffix)) ? " " : ""}
              {t(metric.suffix)}
            </dd>
          </div>
        ))}
      </dl>

      {/* Pasje — te same dane co sekcja Extras prostej wersji */}
      <div className="mt-6 border-t border-line/60 pt-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted">
          {t(ui.sections.hobbies)}
        </h2>
        <ul className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {hobbies.map((hobby) => {
            const Icon = HOBBY_ICONS[hobby.id] ?? Zap;
            return (
              <li key={hobby.id} className="flex items-start gap-2.5">
                <span className="mt-[3px] flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <Icon size={13} strokeWidth={2} aria-hidden />
                </span>
                <p className="text-[12.5px] leading-snug text-muted">
                  <span className="font-semibold text-ink">{t(hobby.title)}.</span>{" "}
                  {t(hobby.text)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
