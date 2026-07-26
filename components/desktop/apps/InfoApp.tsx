"use client";

import { site } from "@/data/site";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import { useDesktop } from "@/components/desktop/DesktopContext";

const SPECS = [
  { label: { pl: "Framework", en: "Framework" }, value: "Next.js 15" },
  { label: { pl: "Język", en: "Language" }, value: "TypeScript" },
  { label: { pl: "Style", en: "Styling" }, value: "Tailwind CSS" },
  { label: { pl: "Animacje", en: "Animations" }, value: "Framer Motion" },
  { label: { pl: "Płynny scroll", en: "Smooth scroll" }, value: "Lenis" },
  { label: { pl: "Stan okien", en: "Window state" }, value: "Zustand" },
];

/** „O tym portfolio" — mrugnięcie okiem do „Ten Mac". */
export default function InfoApp() {
  const { switchToSimple } = useDesktop();
  const t = useT();
  const initials = site.name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("");

  return (
    <div className="flex flex-col items-center px-8 py-7 text-center">
      <div
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-[24%] text-[22px] font-bold text-white shadow-soft"
        style={{
          background: "linear-gradient(145deg, #0A0A0C 0%, #1D1D1F 45%, #C2410C 130%)",
        }}
      >
        {initials}
      </div>
      <h1 className="mt-4 text-[19px] font-bold tracking-tight text-ink">
        {t({ pl: "Pulpit", en: "Desktop" })}
      </h1>
      <p className="mt-0.5 text-[13px] text-muted">
        {t({ pl: "Wersja 2.0", en: "Version 2.0" })}
      </p>
      <dl className="mt-5 w-full max-w-[300px] space-y-1.5 text-[13px]">
        {SPECS.map((spec) => (
          <div key={spec.value} className="flex justify-between gap-6">
            <dt className="text-muted">{t(spec.label)}</dt>
            <dd className="font-medium text-ink">{spec.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 max-w-[42ch] text-[13px] leading-relaxed text-muted">
        {t({
          pl: "Interaktywny pulpit zbudowany od zera, bez gotowych szablonów. Okna można przeciągać i zmieniać ich rozmiar, projekty działają na żywo w oknach, a prawy klik w tapetę zmienia tło.",
          en: "An interactive desktop built from scratch, no ready-made templates. Windows can be dragged and resized, the projects run live inside them, and a right-click on the wallpaper changes the background.",
        })}
      </p>
      <p className="mt-3 max-w-[42ch] text-[13px] leading-relaxed text-muted">
        {t({
          pl: "Wolisz klasyczną, spokojniejszą lekturę? Ta sama treść jest dostępna jako prosta strona.",
          en: "Prefer a classic, calmer read? The same content is available as a simple page.",
        })}
      </p>
      <button
        type="button"
        onClick={switchToSimple}
        className="mt-4 rounded-full bg-accent px-4 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-accent/90"
      >
        {t(ui.mode.switchToSimple)}
      </button>
    </div>
  );
}
