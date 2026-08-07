import type { L10n } from "@/lib/lang-store";

/**
 * Słownik interfejsu — wszystkie "chrome'owe" teksty obu trybów.
 * Treści merytoryczne (bio, role, projekty) żyją w swoich plikach data/.
 */
export const ui = {
  mode: {
    toDesktop: { pl: "Tryb pulpitu", en: "Desktop mode" },
    toDesktopHint: {
      pl: "Zobacz to portfolio jako interaktywny pulpit",
      en: "Explore this portfolio as an interactive desktop",
    },
    toSimple: { pl: "Prosty widok", en: "Simple view" },
    switchToSimple: { pl: "Przełącz na prosty widok", en: "Switch to simple view" },
  },
  sections: {
    about: { pl: "O mnie", en: "About me" },
    aboutTitle: {
      pl: "Dwa światy, jeden warsztat.",
      en: "Two worlds, one craft.",
    },
    engineering: { pl: "Doświadczenie", en: "Experience" },
    engineeringTitle: { pl: "Ścieżka inżynierska.", en: "The engineering path." },
    engineeringSub: {
      pl: "Enterprise'owa logistyka, nagradzany e-commerce, aplikacja dla 40 tysięcy studentów i własny SaaS, pisane w .NET, React i TypeScript.",
      en: "Enterprise logistics, award-winning e-commerce, an app for 40,000 students and my own SaaS, written in .NET, React and TypeScript.",
    },
    educationTitle: { pl: "Edukacja i badania.", en: "Education & research." },
    personalProjectsTitle: { pl: "Projekty osobiste.", en: "Personal projects." },
    studio: { pl: "Ultra Studio", en: "Ultra Studio" },
    studioSub: {
      pl: "Wizualna, kliencka strona mojej pracy. Projekty otwierają się z pełnym opisem.",
      en: "The visual, client-facing side of my work. Open any project for the full story.",
    },
    extras: { pl: "Poza kodem", en: "Beyond the code" },
    extrasTitle: { pl: "Certyfikaty, języki i pasje.", en: "Certifications, languages & passions." },
    certifications: { pl: "Certyfikaty", en: "Certifications" },
    languages: { pl: "Języki", en: "Languages" },
    hobbies: { pl: "Pasje", en: "Passions" },
    contact: { pl: "Kontakt", en: "Contact" },
  },
  actions: {
    openSite: { pl: "Otwórz stronę", en: "Open site" },
    sourceCode: { pl: "Kod źródłowy", en: "Source code" },
    openProject: { pl: "Zobacz projekt", en: "View project" },
    close: { pl: "Zamknij", en: "Close" },
    back: { pl: "Wróć", en: "Back" },
    reload: { pl: "Załaduj ponownie", en: "Reload" },
    openInNewTab: { pl: "Otwórz w nowej karcie", en: "Open in a new tab" },
    writeToMe: { pl: "Napisz do mnie", en: "Get in touch" },
    callMe: { pl: "Zadzwoń", en: "Call me" },
    showPhone: { pl: "Pokaż numer", en: "Show number" },
    openDroneSim: { pl: "Uruchom symulację", en: "Launch the simulation" },
    openDesktop: { pl: "Uruchom OS", en: "Launch OS" },
    visitStudio: { pl: "Zobacz ultrastud.io", en: "Visit ultrastud.io" },
    viewWork: { pl: "Zobacz projekty", en: "View work" },
  },
  a11y: {
    skipToContent: { pl: "Przejdź do treści", en: "Skip to content" },
  },
  desktop: {
    desktop: { pl: "Pulpit", en: "Desktop" },
    mainMenu: { pl: "Menu główne", en: "Main menu" },
    aboutPortfolio: { pl: "O tym portfolio", en: "About this portfolio" },
    wallpaper: { pl: "Zmień tapetę", en: "Change wallpaper" },
    openApp: { pl: "Otwórz", en: "Open" },
    openWindowHint: { pl: "otwórz kliknięciem lub Enterem", en: "open with a click or Enter" },
    closeWindow: { pl: "Zamknij okno", en: "Close window" },
    minimizeWindow: { pl: "Minimalizuj okno", en: "Minimise window" },
    maximizeWindow: { pl: "Maksymalizuj okno", en: "Maximise window" },
    connecting: { pl: "Łączenie z", en: "Connecting to" },
    liveTab: { pl: "Na żywo", en: "Live preview" },
    overviewTab: { pl: "Przegląd", en: "Overview" },
    whatIsIt: { pl: "Czym to jest", en: "What it is" },
    howItWasBuilt: { pl: "Jak powstało", en: "How it was built" },
    myRole: { pl: "Moja rola", en: "My role" },
    techStack: { pl: "Technologie", en: "Tech stack" },
    filterByTech: { pl: "Filtruj po technologii", en: "Filter by tech" },
    roles: { pl: "Stanowiska", en: "Roles" },
    creativeVenture: { pl: "Przedsięwzięcie kreatywne", en: "Creative venture" },
    windowOpen: { pl: "otwarte", en: "open" },
  },
  notFound: {
    title: { pl: "Tej strony nie ma.", en: "This page doesn't exist." },
    subline: {
      pl: "Adres jest błędny albo strona została przeniesiona.",
      en: "The address is wrong or the page has moved.",
    },
    backHome: { pl: "Wróć na start", en: "Back to home" },
  },
  footer: {
    explore: { pl: "Nawigacja", en: "Explore" },
    projects: { pl: "Projekty", en: "Projects" },
    connect: { pl: "Kontakt", en: "Connect" },
    modes: { pl: "Tryby portfolio", en: "Portfolio modes" },
    status: { pl: "Wszystkie systemy działają", en: "All systems operational" },
    localTime: { pl: "czas lokalny", en: "local time" },
    rights: { pl: "Wszelkie prawa zastrzeżone.", en: "All rights reserved." },
    builtWith: {
      pl: "Zaprojektowane i zakodowane osobiście: Next.js, Tailwind, Framer Motion.",
      en: "Designed and coded personally: Next.js, Tailwind, Framer Motion.",
    },
  },
} as const;

export type UiDict = typeof ui;
export type { L10n };
