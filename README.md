# jakub-wysocki

Personal portfolio of Jakub Wysocki — software engineer & UX/UI designer, co-founder of [Ultra Studio](https://ultrastud.io) and [Squizzu](https://www.squizzu.com).

The site ships in two switchable modes:

- **Simple** — a classic one-page portfolio: hero, about, experience timeline, Ultra Studio case studies, contact.
- **Desktop** — a macOS-style desktop with a dock, draggable windows, and apps (about, experience, education, contact, live site previews). Falls back to a sheet-based layout on touch devices.

Content is fully bilingual (Polish / English), with the language picked from a saved preference or `navigator.language`.

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://motion.dev) — animations, dock magnification, window transitions
- [Lenis](https://lenis.darkroom.engineering) — smooth scrolling (disabled for reduced-motion users)
- [Zustand](https://zustand-demo.pmnd.rs) — language, view-mode and window state

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: set CONTACT_PHONE
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The phone number is never committed or rendered into static HTML — it is served
by `/api/phone` from the `CONTACT_PHONE` env var after a "Show number" click.
If the variable is unset, the phone option disappears from the site.

Production build:

```bash
npm run build
npm start
```

## Project structure

```
app/                # App Router entry: layout, page, global styles
components/         # Simple-mode sections (Hero, Timeline, UltraStudio, …)
components/desktop/ # Desktop mode: dock, windows, menu bar, apps
data/               # All site content (bilingual) — projects, experience, links
lib/                # Stores (language, mode, windows) and motion helpers
public/             # Static assets
```

All copy and personal data live in `data/` as a single source of truth for both modes.
