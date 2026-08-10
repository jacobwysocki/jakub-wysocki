import type { ComponentType } from "react";
import { Mail } from "lucide-react";
import type { L10n } from "@/lib/lang-store";
import {
  BehanceIcon,
  GithubIcon,
  LinkedinIcon,
  StackOverflowIcon,
} from "@/components/logos";
import { contactInfo } from "./site";

/**
 * Wspólna sygnatura ikony: lucide nie dostarcza znaków marek, więc lista
 * miesza ikony lucide (Mail) z własnymi SVG z components/logos.
 * Typ opisuje tylko te propsy, które faktycznie podajemy w miejscach użycia.
 */
export type SocialIcon = ComponentType<{
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
  "aria-hidden"?: boolean;
}>;

export type SocialLink = {
  label: string;
  href: string;
  icon: SocialIcon;
};

/**
 * Kolejność jak w sameAs (lib/schema.ts) i w widocznych linkach wizytówki:
 * te trzy listy opisują ten sam zestaw profili i mają się nie rozjeżdżać.
 */
export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: contactInfo.github, icon: GithubIcon },
  { label: "LinkedIn", href: contactInfo.linkedin, icon: LinkedinIcon },
  { label: "Behance", href: contactInfo.behance, icon: BehanceIcon },
  {
    label: "Stack Overflow",
    href: contactInfo.stackoverflow,
    icon: StackOverflowIcon,
  },
];

/** Socials + bezpośrednie kanały — stopka i aplikacja Kontakt */
export const contactLinks: SocialLink[] = [
  { label: "Email", href: `mailto:${contactInfo.email}`, icon: Mail },
  ...socialLinks,
];

export type NavLink = { label: L10n; href: string };

/** Kotwice sekcji prostego widoku — id neutralne językowo */
export const navLinks: NavLink[] = [
  { label: { pl: "O mnie", en: "About" }, href: "#about" },
  { label: { pl: "Doświadczenie", en: "Experience" }, href: "#engineering" },
  { label: { pl: "Projekty", en: "Projects" }, href: "#personal-projects" },
  { label: { pl: "Ultra Studio", en: "Ultra Studio" }, href: "#studio" },
  { label: { pl: "Kontakt", en: "Contact" }, href: "#contact" },
];
