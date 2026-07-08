"use client";

import { useLang, useLangStore, type Lang } from "@/lib/lang-store";

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
  const setLang = useLangStore((s) => s.setLang);

  const shell =
    tone === "dark" ? "border-white/20 bg-white/10" : "border-ink/15 bg-ink/5";
  const active =
    tone === "dark" ? "bg-white text-ink shadow-sm" : "bg-ink text-white shadow-sm";
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
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
          className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide transition-all duration-300 ${
            lang === code ? active : idle
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
