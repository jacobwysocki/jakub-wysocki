"use client";

import { useLang, useSetLang, type Lang } from "@/lib/lang-store";

const LANGS: Lang[] = ["pl", "en"];

/**
 * Przełącznik języka — segmentowana kapsuła.
 * tone: "dark" na ciemnych tłach (biały aktywny segment),
 * "light" na jasnych (czarny aktywny segment).
 */
export default function LangSwitch({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  const lang = useLang();
  const setLang = useSetLang();

  const shell =
    tone === "dark" ? "border-white/20 bg-white/10" : "border-ink/15 bg-ink/5";
  const active =
    tone === "dark"
      ? "bg-white text-ink shadow-xs"
      : "bg-ink text-white shadow-xs";
  const idle =
    tone === "dark"
      ? "text-white/60 hover:text-white"
      : "text-ink/50 hover:text-ink";

  return (
    <div
      role="group"
      aria-label="Język / Language"
      className={`flex items-center rounded-full border p-0.5 ${shell} ${className}`}
    >
      {/* Segmenty są celowo drobne — kapsuła ma być akcentem paska, nie jego
          bohaterem. Pole dotyku rośnie więc pseudoelementem, a nie paddingiem:
          44 px w pionie i wyjście o 10 px na ZEWNĘTRZNĄ stronę każdego
          segmentu. Do wewnątrz nie ruszamy ani piksela, bo oba przyciski
          stykają się bokami i ich pola zaczęłyby na siebie zachodzić —
          palec trafiałby w język, którego nie wybrał. */}
      {LANGS.map((code, i) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`relative rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide transition-all duration-300 before:absolute before:top-1/2 before:h-11 before:-translate-y-1/2 before:content-[''] ${
            i === 0
              ? "before:-left-2.5 before:right-0"
              : "before:left-0 before:-right-2.5"
          } ${lang === code ? active : idle}`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
