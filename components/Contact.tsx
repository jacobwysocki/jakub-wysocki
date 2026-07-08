"use client";

import { motion, useReducedMotion } from "framer-motion";
import { site, contactInfo } from "@/data/site";
import { contactLinks } from "@/data/links";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import Reveal from "@/components/Reveal";
import RevealPhone from "@/components/RevealPhone";
import MagneticButton from "@/components/MagneticButton";
import { SPRING } from "@/lib/motion";

export default function Contact() {
  const reduced = useReducedMotion();
  const t = useT();

  return (
    <section
      id="contact"
      aria-label={t(ui.sections.contact)}
      className="bg-black py-24 text-white md:py-40"
    >
      <div className="mx-auto max-w-content px-6 text-center">
        <Reveal>
          <p className="text-caption uppercase text-white/40">
            {t(ui.sections.contact)}
          </p>
          <h2 className="mt-4 text-h2">{t(site.contact.heading)}</h2>
          <p className="mx-auto mt-6 max-w-prose text-body text-white/60">
            {t(site.contact.subline)}
          </p>
        </Reveal>

        <Reveal delay={0.15} className="mt-12">
          <MagneticButton
            href={`mailto:${contactInfo.email}`}
            className="inline-block rounded-full bg-white px-9 py-4 text-[17px] font-semibold text-ink"
          >
            {contactInfo.email}
          </MagneticButton>
          <p className="mt-5 text-[14px] text-white/50">
            <RevealPhone className="transition-colors hover:text-white" />
            <span aria-hidden className="mx-2.5">·</span>
            {contactInfo.location}
          </p>
        </Reveal>

        <Reveal delay={0.25} className="mt-14">
          <ul className="flex items-center justify-center gap-3">
            {contactLinks.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <motion.a
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors duration-300 hover:border-white/40 hover:text-white"
                  whileHover={reduced ? undefined : { scale: 1.08 }}
                  whileTap={reduced ? undefined : { scale: 0.95 }}
                  transition={SPRING}
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden />
                </motion.a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
