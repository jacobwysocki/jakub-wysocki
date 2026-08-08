# jakub-wysocki

Personal portfolio of Jakub Wysocki — software engineer & UX/UI designer, co-founder of [Ultra Studio](https://ultrastud.io) and [Squizzu](https://www.squizzu.com).

The site ships in two switchable presentations of the same public portfolio facts:

- **Simple Mode** — a linear portfolio with an introduction, experience, case studies, projects, and contact paths.
- **Desktop Mode** — an OS-inspired portfolio with a typed App Catalog, dock, draggable windows and widgets, mobile sheets, and a provider-free Spotlight search.

Content is bilingual (Polish / English). The home page resolves the saved language cookie or the browser's `Accept-Language` on the server so the first render already uses the selected language.

## Release-candidate status

This working tree contains the Desktop v2 quality baseline, typed navigation, curated Portfolio Knowledge, desktop resilience work, the provider-free Spotlight experience, and the complete Ask Jakub experience—including a compact desktop quick-chat widget—with an optional server-only Groq Adapter.

Ask Jakub is a grounded portfolio guide, not an impersonation of Jakub or a general web assistant. Its bilingual quick-chat widget, Desktop App, and mobile sheet share one ephemeral session, including cancellation, retry, session retention, and canonical evidence navigation. The owned API route remains provider-disabled by default. When explicitly configured, a direct server-only HTTPS Adapter uses Groq's `openai/gpt-oss-20b` model with strict structured output; no provider SDK or credential is shipped to the browser.

The implementation and documentation changes are not evidence of a deployment by themselves. The [dated local verification report](./docs/desktop-v2/VERIFICATION-2026-08-09.md) separates completed automated checks from browser, assistive-technology, staging, and deployment work that still requires an external release environment.

## Tech stack

- [Next.js 16](https://nextjs.org) App Router, React 19, and TypeScript
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://motion.dev) for desktop and window transitions
- [Lenis](https://lenis.darkroom.engineering) for Simple Mode smooth scrolling, disabled for reduced-motion visitors
- React Context for request-safe language and feature-session state
- [Zustand](https://zustand-demo.pmnd.rs) for view-mode and desktop-window state
- Vitest and Testing Library for unit, component, contract, and accessibility-behavior tests

## Getting started

Use Node.js 24.18.1 or newer on the Node 24 line and npm 11. The `.nvmrc` selects the Node 24 line; `package.json` defines the supported minimum rather than pinning one exact patch release.

```bash
nvm install
nvm use
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variable is required for the default local experience. Optional configuration:

- `CONTACT_PHONE` enables the click-to-reveal phone option. The value is returned by `/api/phone` only after visitor action and is not emitted into static HTML or client bundles.
- `NEXT_PUBLIC_SITE_URL` overrides the canonical public base URL used by metadata, robots, sitemap, and structured data. It is public configuration, not a secret. The fallback is `https://jakub-wysocki.com`.
- `ASK_JAKUB_PROVIDER=groq` explicitly enables the Groq Adapter. Missing, unknown, or `disabled` values fail closed to the provider-unavailable experience.
- `GROQ_API_KEY` supplies the server-only Groq credential. Never prefix it with `NEXT_PUBLIC_`, commit it, or add it to CI.

For the free-tier setup, including a dedicated project, Zero Data Retention, conservative provider limits, local testing, Vercel Preview, Production, and rollback, run:

```bash
./scripts/setup-groq.sh
```

The wizard writes only the local key to ignored `.env.local`; it never runs a live model request itself and never places the key in GitHub Actions. The route remains provider-disabled unless both Ask variables are configured. See [Technical privacy and data flow](./docs/PRIVACY-DATA-FLOW.md) before enabling it publicly.

Production build:

```bash
npm run build
npm start
```

## Quality checks

The local verification contract is:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run audit:prod
```

The GitHub Actions workflow runs these checks for pull requests and pushes to `main`, and Dependabot checks npm and GitHub Actions dependencies monthly. Repository configuration does not establish whether GitHub branch-protection rules require the workflow to pass before merge.

`npm run test:coverage` produces a local coverage report. The checked-in suite runs in JSDOM; there is no checked-in automated cross-browser suite yet. Browser, screen-reader, zoom, high-contrast, touch, and reduced-motion evidence belongs in the release report rather than being inferred from unit tests.

## Accessibility

Desktop Mode includes keyboard-operable menus and launchers, focus return after windows and mobile sheets close, a single active Ask composer surface, modal background isolation on mobile, a `Command/Ctrl + K` Spotlight shortcut, visible focus states, and reduced-motion paths. These are implementation requirements, not a claim of completed WCAG conformance. Cross-browser and assistive-technology release verification remains pending.

## Project structure

```text
app/                App Router pages, metadata, and owned API routes
components/         Simple Mode sections and shared presentation components
components/desktop/ Desktop shell, windows, mobile sheets, and visual App Adapters
data/               Canonical bilingual portfolio facts and long-form copy
features/           Navigation, Portfolio Knowledge, Spotlight, and Ask Jakub Modules
lib/                Language, mode, window, schema, and motion infrastructure
scripts/            Repeatable human setup wizards; no committed credentials
test/               Cross-module unit and component tests
docs/               Architecture, product, entity, privacy, and execution records
.github/            CI and dependency-update configuration
public/             Static images, video, and app assets
```

Core portfolio facts and narratives live in `data/` and are shared by both presentation modes. Feature Modules may add stable IDs, retrieval metadata, validation, and interface-local copy without becoming a second source for personal facts.

## Architecture and decisions

- [Portfolio vocabulary](./CONTEXT.md)
- [Desktop v2 architecture, status, and roadmap](./docs/desktop-v2/README.md)
- [Ask Jakub product and architecture specification](./docs/desktop-v2/ASK-JAKUB.md)
- [Desktop v2 execution record](./docs/desktop-v2/AGENT-PLAN.md)
- [Technical privacy and data flow](./docs/PRIVACY-DATA-FLOW.md)
- [Public-entity and structured-data decisions](./docs/ENTITY.md)

License, vulnerability-reporting, contribution, final deployment verification, app-side abuse controls, AI telemetry, and a final visitor-facing privacy-policy decision remain open. This repository does not currently contain `LICENSE`, `SECURITY.md`, or `CONTRIBUTING.md`; `"private": true` in `package.json` controls npm publication and is not a license grant.
