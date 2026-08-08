"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Linkedin, Github, Mail, Phone } from "lucide-react";
import { BehanceIcon, StackOverflowIcon } from "@/components/logos";
import type { SocialIcon } from "@/data/links";
import { site, contactInfo } from "@/data/site";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import { SPRING } from "@/lib/motion";
import { usePhoneReveal } from "@/components/RevealPhone";

function hostLabel(href: string): string {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return href;
  }
}

type Row = {
  label: string;
  detail: string;
  href: string;
  icon: SocialIcon;
  external: boolean;
  onClick?: (e: React.MouseEvent) => void;
};

/** Kontakt — duże klikalne wiersze ze sprężynowym hoverem. */
export default function ContactApp() {
  const reduced = useReducedMotion();
  const t = useT();
  const { phone, failed, reveal } = usePhoneReveal();

  const phoneRow: Row[] = failed
    ? []
    : [
        {
          label: t(ui.actions.callMe),
          detail: phone ? phone.number : t(ui.actions.showPhone),
          href: phone ? phone.href : "#",
          icon: Phone,
          external: false,
          onClick: phone
            ? undefined
            : (e) => {
                e.preventDefault();
                void reveal();
              },
        },
      ];

  const rows: Row[] = [
    {
      label: t(ui.actions.writeToMe),
      detail: contactInfo.email,
      href: `mailto:${contactInfo.email}`,
      icon: Mail,
      external: false,
    },
    ...phoneRow,
    {
      label: "LinkedIn",
      detail: hostLabel(contactInfo.linkedin),
      href: contactInfo.linkedin,
      icon: Linkedin,
      external: true,
    },
    {
      label: "GitHub",
      detail: hostLabel(contactInfo.github),
      href: contactInfo.github,
      icon: Github,
      external: true,
    },
    {
      label: "Behance",
      detail: hostLabel(contactInfo.behance),
      href: contactInfo.behance,
      icon: BehanceIcon,
      external: true,
    },
    {
      label: "Stack Overflow",
      detail: hostLabel(contactInfo.stackoverflow),
      href: contactInfo.stackoverflow,
      icon: StackOverflowIcon,
      external: true,
    },
  ];

  return (
    <div className="px-5 py-6">
      <div className="px-3">
        <h1 className="text-[20px] font-bold tracking-tight text-ink">
          {t(site.contact.heading)}
        </h1>
        <p className="mt-1 text-[14px] leading-relaxed text-muted">
          {t(site.contact.subline)}
        </p>
        <p className="mt-2 text-[12px] text-muted">
          {contactInfo.location} · {site.name}
        </p>
      </div>
      <div className="mt-5 space-y-1">
        {rows.map((row) => (
          <motion.a
            key={row.label}
            href={row.href}
            onClick={row.onClick}
            target={row.external ? "_blank" : undefined}
            rel={row.external ? "noopener noreferrer" : undefined}
            whileHover={reduced ? undefined : { scale: 1.015, x: 2 }}
            whileTap={reduced ? undefined : { scale: 0.99 }}
            transition={SPRING}
            className="flex items-center gap-4 rounded-xl p-3.5 transition-colors hover:bg-black/[0.045]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <row.icon size={18} strokeWidth={1.8} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-ink">
                {row.label}
              </span>
              <span className="block truncate text-[13px] text-muted">
                {row.detail}
              </span>
            </span>
            <ArrowUpRight
              size={16}
              className="shrink-0 text-muted"
              aria-hidden
            />
          </motion.a>
        ))}
      </div>
    </div>
  );
}
