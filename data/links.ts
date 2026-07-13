import { Github, Linkedin, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { L10n } from "@/lib/lang-store";
import { contactInfo } from "./site";

export type SocialLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: contactInfo.github, icon: Github },
  { label: "LinkedIn", href: contactInfo.linkedin, icon: Linkedin },
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
