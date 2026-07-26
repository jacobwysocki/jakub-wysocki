"use client";

import { useEffect, useState } from "react";
import { AppWindowMac, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { navLinks } from "@/data/links";
import { site, contactInfo, person } from "@/data/site";
import { ui } from "@/data/ui";
import { useLang, useT } from "@/lib/lang-store";
import { useModeStore } from "@/lib/mode-store";
import { useLenis } from "@/components/SmoothScrollProvider";
import LangSwitch from "@/components/LangSwitch";
import RevealPhone from "@/components/RevealPhone";

/** Zegar lokalny Krakowa — odświeżany co minutę */
function useLocalTime(lang: string) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const format = () =>
      setTime(
        new Intl.DateTimeFormat(lang === "pl" ? "pl-PL" : "en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: contactInfo.timezone,
        }).format(new Date())
      );
    format();
    const id = setInterval(format, 30_000);
    return () => clearInterval(id);
  }, [lang]);
  return time;
}

const external = { target: "_blank", rel: "noopener noreferrer" } as const;

function Column({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/40">
        {heading}
      </h3>
      <ul className="mt-4 space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({
  href,
  children,
  onClick,
  isExternal = false,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  isExternal?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        onClick={onClick}
        {...(isExternal ? external : {})}
        className="group inline-flex items-center gap-1 text-[14px] text-white/70 transition-colors duration-300 hover:text-white"
      >
        {children}
        {isExternal && (
          <ArrowUpRight
            size={12}
            aria-hidden
            className="opacity-0 transition-opacity duration-300 group-hover:opacity-60"
          />
        )}
      </a>
    </li>
  );
}

/** Stopka: kolumny linków + wiersz statusu systemu. */
export default function Footer() {
  const t = useT();
  const lang = useLang();
  const lenis = useLenis();
  const setMode = useModeStore((s) => s.setMode);
  const localTime = useLocalTime(lang);

  const handleAnchor = (e: React.MouseEvent, href: string) => {
    if (!lenis) return;
    e.preventDefault();
    lenis.scrollTo(href, { offset: -72 });
  };

  return (
    <footer className="border-t border-white/10 bg-black pb-10 pt-14 text-white">
      <div className="mx-auto max-w-content px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <p className="text-[17px] font-semibold tracking-tight">
              {person.fullName}
            </p>
            <p className="mt-2 max-w-[30ch] text-[13px] leading-relaxed text-white/50">
              {t(site.hero.subline)}
            </p>
            <LangSwitch tone="dark" className="mt-5 w-fit" />
          </div>

          <Column heading={t(ui.footer.explore)}>
            {navLinks.map((link) => (
              <FooterLink
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchor(e, link.href)}
              >
                {t(link.label)}
              </FooterLink>
            ))}
            {/* Strona-wizytówka: jedyny link wewnętrzny do encji. Bez niego
                /about i /o-mnie byłyby sierotami w strukturze serwisu. */}
            <li>
              <Link
                href={person.entityHome[lang]}
                className="text-[14px] text-white/70 transition-colors duration-300 hover:text-white"
              >
                {lang === "pl" ? "Wizytówka" : "Profile"}
              </Link>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setMode("desktop")}
                className="inline-flex items-center gap-1.5 text-[14px] font-medium text-accent-bright transition-colors duration-300 hover:text-white"
              >
                <AppWindowMac size={14} strokeWidth={2} aria-hidden />
                {t(ui.mode.toDesktop)}
              </button>
            </li>
          </Column>

          <Column heading={t(ui.footer.projects)}>
            <FooterLink href={contactInfo.squizzu} isExternal>
              Squizzu
            </FooterLink>
            <FooterLink href={contactInfo.squizzuApp} isExternal>
              app.squizzu.com
            </FooterLink>
            <FooterLink href={contactInfo.ultrastudio} isExternal>
              Ultra Studio
            </FooterLink>
            <FooterLink href={contactInfo.droneLive} isExternal>
              Drone Simulation
            </FooterLink>
            <FooterLink href={contactInfo.droneRepo} isExternal>
              Drone Simulation · GitHub
            </FooterLink>
          </Column>

          <Column heading={t(ui.footer.connect)}>
            <FooterLink href={`mailto:${contactInfo.email}`}>
              {contactInfo.email}
            </FooterLink>
            <li>
              <RevealPhone className="text-[14px] text-white/70 transition-colors duration-300 hover:text-white" />
            </li>
            <FooterLink href={contactInfo.linkedin} isExternal>
              LinkedIn
            </FooterLink>
            <FooterLink href={contactInfo.github} isExternal>
              GitHub
            </FooterLink>
          </Column>
        </div>

        {/* Wiersz statusu systemu */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {person.fullName}. {t(ui.footer.rights)}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#30D158]"
              />
              {t(ui.footer.status)}
            </span>
            <span>
              {contactInfo.location}
              {localTime && (
                <>
                  {" "}
                  · {localTime} {t(ui.footer.localTime)}
                </>
              )}
            </span>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-white/25">{t(ui.footer.builtWith)}</p>
      </div>
    </footer>
  );
}
