# Desktop v2 agent plan

This document turns [Desktop v2](./README.md) and [Ask Jakub](./ASK-JAKUB.md) into bounded work packages for an integrator and specialist sub-agents.

The plan assumes at most three worker agents plus one integrator at a time. Run only packages whose dependencies are complete and whose file ownership does not overlap.

## Execution status

Status reconciled with the shared working tree on 2026-08-08. Treat completed package sections and dispatch briefs as an execution record; do not rerun them unless a new defect is explicitly assigned.

| Package | Status             | Next condition                                                                                                                                                                     |
| ------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WP-00   | Complete           | Re-run its quality contract at every integration gate.                                                                                                                             |
| WP-10   | Complete           | App Catalog and Portfolio Location Interfaces are frozen.                                                                                                                          |
| WP-20   | Complete           | Portfolio Knowledge, evidence, suggestion, retrieval, and validation Interfaces are frozen.                                                                                        |
| WP-30   | Complete           | Preserve its window, focus, modal, scroll, menu, viewport, and reduced-motion behavior.                                                                                            |
| WP-40   | Complete           | Owned route/model-port contract is frozen; provider remains disabled unless the server composition explicitly selects Groq.                                                        |
| WP-50   | Complete           | `AskJakubProvider` / `useAskJakubSession` is frozen for ordinary UI callers.                                                                                                       |
| WP-60   | Complete           | Preserve the integrated bilingual UI, lifecycle retention, evidence navigation, and fake/disabled Adapter coverage.                                                                |
| WP-70   | Complete           | Preserve deterministic, provider-free discovery and typed navigation.                                                                                                              |
| WP-80   | Partially complete | Groq Adapter, fail-closed composition, public disclosure, provider bounds, and setup/rollback runbook exist. App-owned abuse/telemetry controls and live staging evidence remain.  |
| WP-90   | Partially complete | Local automated/security/documentation verification is recorded; finish fresh-browser, assistive-technology, performance, staging, and deployment checks in a release environment. |

A provider-disabled portfolio release may proceed independently. The optional model path is not release-approved until the remaining WP-80 controls and WP-90 external checks are either completed or explicitly accepted for the initial Free-plan traffic profile. After WP-90, mark this whole file as a historical execution runbook and keep the current architecture/status in the parent documents.

## Integrator contract

The integrator owns sequence, shared-interface decisions, cross-package review, and the final release. Worker agents own only their assigned package.

Before every wave, the integrator:

1. Confirms the worktree and current baseline.
2. Marks dependency packages complete.
3. Freezes any shared types named by the next packages.
4. Dispatches only non-overlapping ownership in parallel.

After every wave, the integrator:

1. Reads every diff and worker report.
2. Reconciles imports and shared vocabulary without layering compatibility wrappers over a rejected Interface.
3. Runs the complete quality contract available at that point.
4. Updates package status and records any changed decision in the parent specification or an ADR when warranted.

In a shared workspace, worker agents do not commit, reset, clean, install unrelated dependencies, or edit another package's ownership. In branch-based execution, use one branch and pull request per package.

## Worker completion report

Every worker returns:

```md
## Outcome

One paragraph stating the observable result.

## Files changed

- path — reason

## Interface

The final caller-facing behavior, invariants, and failures.

## Verification

- command/check — result

## Risks or follow-ups

- only unresolved items; write “None” when complete
```

“Implemented most of it” is not completion. A package is complete only when every completion criterion is observable and its verification passes.

## Dependency graph

```text
WP-00 quality baseline
   ├────────► WP-10 App Catalog + navigation ──► WP-30 desktop resilience
   │                    │                ├─────► WP-60 Ask Jakub UI
   │                    │                └─────► WP-70 Spotlight
   │                    │
   └────────► WP-20 Portfolio Knowledge ──────► WP-40 Ask server core
                         │                          │
                         └────────► WP-70          └─────► WP-50 Ask client session
                                                               │
WP-10 + WP-30 + WP-50 ─────────────────────────────────────────► WP-60

WP-40 + WP-50 + WP-60 + product decisions ──► WP-80 provider launch

WP-30 + WP-60 + WP-70 ──────────────────────► WP-90 provider-disabled audit
WP-30 + WP-60 + WP-70 + WP-80 ──────────────► WP-90 model-enabled audit
```

## Recommended waves

| Wave | Parallel packages  | Integration gate                                                                                              |
| ---- | ------------------ | ------------------------------------------------------------------------------------------------------------- |
| 0    | WP-00              | Existing experience passes the new local and CI quality contract.                                             |
| 1    | WP-10 and WP-20    | Shared App ID, Portfolio Location, Knowledge Entry, Evidence ID, and Suggested Question contracts are frozen. |
| 2    | WP-30 and WP-40    | Existing desktop is resilient; fake server contract is deterministic and provider-free.                       |
| 3    | WP-50 and WP-70    | Session facade and deterministic Spotlight both pass Interface tests.                                         |
| 4    | WP-60              | Complete Ask Jakub experience passes against fake Adapters on desktop and mobile.                             |
| 5    | WP-80 continuation | Finish app-owned abuse/telemetry decisions and prove the configured provider path in Preview before release.  |
| 6    | WP-90              | The chosen provider-disabled or model-enabled release path has complete quality and documentation evidence.   |

## WP-00 — public-repository quality baseline

### Objective

Create the repeatable verification contract and remove known production dependency findings without changing the intended visual experience.

### Entry criteria

- Current `main` builds.
- The current `npm audit --omit=dev` result is saved in the worker report.
- No other package is editing `package.json` or `package-lock.json`.

### Ownership

- `package.json`, `package-lock.json`
- formatter/linter/test configuration at repository root
- `.github/workflows/**`
- baseline test helpers under `test/` or the selected conventional test directory
- README quality/setup sections

Do not refactor app, desktop, or data implementation files in this package. A minimal test-only selector is allowed only with integrator approval.

### Work

- Upgrade vulnerable production dependencies to patched, mutually compatible versions; inspect official migration/release notes for breaking changes.
- Add supported formatting, linting, explicit type-check, unit/component test, and CI commands.
- Add a dependency audit policy that fails on unaccepted high-severity production findings.
- Add smoke coverage for route rendering and existing public helpers without coupling to implementation details.
- Make CI use the lockfile and a supported Node version.
- Keep generated output, reports, traces, and local environment files ignored.

### Completion criteria

- Named scripts from the parent quality contract exist and pass locally.
- `npm ci` works from the committed lockfile in CI.
- Production build output contains the same intended routes.
- Production dependency audit is clean at the agreed threshold, or a time-bounded exception is documented with advisory, exposure, owner, and removal date.
- No visual/product change is included.

### Dispatch brief

> Read `AGENTS.md` and `docs/desktop-v2/README.md`. Implement WP-00 only. Establish supported format, lint, type, test, build, and CI gates for this Next/React/npm repository; patch the current high-severity production dependency chain using official release/migration guidance. Preserve behavior and stay inside WP-00 ownership. Report every command and remaining advisory. Do not begin feature refactors.

## WP-10 — typed App Catalog and Portfolio Navigator

### Objective

Deepen app discovery and navigation so every caller uses validated semantic identity and unknown/generated targets fail closed.

### Entry criteria

- WP-00 complete.
- The integrator has approved the names `AppId`, `PortfolioLocation`, `AppCatalog`, and `PortfolioNavigator`.

### Ownership

- `components/desktop/registry.tsx` and any extracted App Catalog files
- `components/desktop/DesktopContext.tsx`
- `components/desktop/Desktop.tsx`
- App identity/navigation modules under `lib/` or `features/portfolio-navigation/`
- `lib/window-store.ts` only for typed identity/launch payload work
- focused Interface tests

Do not change individual app visual layouts or accessibility behavior beyond what the new Interface requires.

### Interface requirements

- Preserve literal identity for static apps and validated identity for showcase-derived apps.
- Strict lookup returns a typed result or explicit failure; it never falls back to the first app.
- App Catalog owns desktop icon, desktop dock, mobile grid, mobile dock, size, and scrolling placement.
- Semantic metadata is server-safe; React glyph/content imports remain in a client Adapter.
- `PortfolioNavigator.open(location)` supports Desktop Mode and a canonical Simple Mode fallback.
- A launch payload can focus an existing singleton app and carry an optional semantic selection without putting app state in the window manager.

### Completion criteria

- All existing launch sites compile against typed identity.
- Unknown app/location fixtures fail closed.
- Desktop and mobile placement have one source of truth.
- Existing apps still open, focus, minimize, and restore.
- Portfolio Location mappings cover about, experience role, education item, studio project, personal project, showcase overview/live, contact, and portfolio info.
- Interface tests cover strict resolution and both navigation Adapters.

### Dispatch brief

> Read the Desktop v2 context and implement WP-10 only. Design a deep typed App Catalog and semantic Portfolio Navigator. Remove permissive string/fallback behavior, consolidate desktop/mobile placement, and keep visual registry code out of server-safe semantic modules. Preserve existing UI. Test through strict lookup and navigation Interfaces; malformed generated targets must fail closed.

## WP-20 — curated Portfolio Knowledge

### Objective

Produce a deterministic, bilingual, validated knowledge/evidence catalog shared by Spotlight and Ask Jakub without copying portfolio narratives.

### Entry criteria

- WP-00 complete.
- The integrator has frozen `PortfolioLocation` shape with WP-10 or supplied an interim shared contract that WP-10 will implement exactly.

### Ownership

- new `features/portfolio-knowledge/**`
- knowledge-focused tests/fixtures
- narrowly required corrections in `data/**`
- volatile-count derivation/validation

Do not edit desktop views, route handlers, provider code, or UI session state.

### Work

- Inventory public facts and nominate one canonical source per duplicated claim.
- Build Knowledge Entries by referencing existing exports and adding stable IDs, topics, aliases, and Evidence IDs.
- Build curated Suggested Questions in both languages.
- Add deterministic normalization, alias expansion, lexical/topic scoring, and bounded retrieval.
- Exclude UI chrome, comments, private notes, environment values, hidden phone data, and visual-only metadata.
- Correct the current built-in-app-count contradiction and add a regression check.
- Add fixtures representing real hiring, project, skill, education, and contact questions in Polish and English.

### Completion criteria

- Every public role, education item, showcase, personal project, and allowed contact surface has at least one Knowledge Entry.
- Every entry and suggestion validates in both languages and resolves to owned evidence.
- Hidden phone/environment sentinel tests prove exclusion.
- Contradiction, duplicate ID, missing language, stale evidence, and volatile-count tests fail as intended.
- Retrieval fixtures meet an agreed recall threshold without embeddings.

### Dispatch brief

> Read `CONTEXT.md` and the Portfolio Knowledge section of `ASK-JAKUB.md`. Implement WP-20 only. Curate a bilingual knowledge/evidence catalog from canonical `data/` exports, add deterministic retrieval and exhaustive validation, fix the known volatile app-count drift, and prove hidden contact/environment data cannot enter the catalog. No model, route, or UI work.

## WP-30 — desktop resilience and accessibility

### Objective

Make existing window, sheet, menu, viewport, and focus behavior reliable enough to host a public conversational feature.

### Entry criteria

- WP-10 merged and typed contracts frozen.
- The current desktop/mobile smoke suite is green.

### Ownership

- `components/desktop/Window.tsx`
- `components/desktop/MobileDesktop.tsx`
- `components/desktop/MenuBar.tsx`
- `components/desktop/ContextMenu.tsx`
- `components/desktop/DesktopIcons.tsx`, `Dock.tsx` only for focus restoration/keyboard behavior
- window-manager geometry behavior in `lib/window-store.ts`
- relevant browser/component tests

Do not add Ask Jakub or Spotlight feature UI.

### Work

- Restore focus to the invoking control or next meaningful window after close/minimize; preserve stack semantics.
- Make mobile modal background inert/hidden, retain focus trap, and restore focus on every close path including Escape, backdrop, swipe, and navigation Back.
- Honor each Desktop App's scrolling contract in mobile sheets.
- Reconcile restored and maximized rectangles when work area/zoom changes; keep windows reachable.
- Give logo/context menus initial focus, Escape/arrow/Home/End behavior, outside-close, and return focus appropriate to their roles.
- Verify visible focus on every desktop launcher despite local `outline-none` classes.
- Reproduce the Framer Motion static-container warning in a clean browser profile and remove its app-owned source.
- Preserve reduced motion and touch behavior.

### Completion criteria

- Keyboard-only scripted flows can open, operate, close, and recover focus for every surface.
- Modal background is absent from the accessibility tree while a mobile app is open.
- Full-height and scrolling apps both behave correctly on mobile.
- Unit/property tests cover small work areas and resize reconciliation.
- No app-owned warning/error appears during the tested flows.
- Visual regression at representative desktop/mobile sizes is accepted.

### Dispatch brief

> Implement WP-30 after WP-10. Use the live-audit findings in `docs/desktop-v2/README.md`. Repair focus restoration, modal isolation, menu keyboard behavior, mobile scroll contracts, viewport reconciliation, and the reproducible Framer warning without redesigning the desktop. Add behavior-level tests and verify keyboard, touch, reduced motion, and representative widths.

## WP-40 — Ask Jakub server core with deterministic Adapters

### Objective

Implement the deep stateless answer operation and versioned owned-route contract without selecting or requiring a paid model provider.

### Entry criteria

- WP-20 merged and Knowledge Entry/Evidence/Suggestion contracts frozen.
- Product defaults in `ASK-JAKUB.md` remain unchanged or their edits are approved first.

### Ownership

- `features/ask-jakub/contract.ts`
- `features/ask-jakub/server/**`
- `app/api/ask-jakub/route.ts`
- server/route fixtures and tests
- server-only environment schema additions, excluding real secrets

Do not create the React provider, Desktop App, or real provider Adapter.

### Work

- Test-drive request validation, history bounds, retrieval, prompt input, structured result validation, evidence resolution, timeout/abort, and normalized failures.
- Define the `AnswerModelPort` and deterministic mock/scripted Adapters.
- Implement lifecycle events and validated terminal answer; never relay raw model output.
- Enforce body/question/history/output/response caps, allowed content type/language/version, `no-store`, and status mapping.
- Keep provider and Portfolio Knowledge seams internal to the Ask Jakub Module.
- Provide a provider-disabled Adapter/state that is useful in local/preview environments.

### Completion criteria

- Route contract tests pass for every success/failure status and event order.
- The full server operation is deterministic under mock Adapters.
- Invalid evidence, prompt injection in history, oversized input, late abort, timeout, and repair bound are covered.
- Server-only boundary tests/build inspection show no provider configuration in client imports.
- No real external request or paid credential is needed.

### Dispatch brief

> Read all of `ASK-JAKUB.md` and implement WP-40 only, test-first. Build the stateless server answer operation, versioned POST/lifecycle contract, strict bounds, grounding validation, model port, deterministic mock Adapters, and provider-disabled behavior. Do not add a real model SDK or React UI. Raw provider text and unowned evidence must never cross the route.

## WP-50 — Ask Jakub client session facade

### Objective

Implement the UI-facing session Interface and transport Adapters independently of visual chat design.

### Entry criteria

- WP-40 contract merged and frozen.
- WP-10 Portfolio Navigator available.

### Ownership

- `features/ask-jakub/index.tsx`
- `features/ask-jakub/session-reducer.ts`
- `features/ask-jakub/client/**`
- client Interface tests

Do not edit Desktop App visuals, App Catalog registration, provider/server implementation, or Portfolio Knowledge.

### Work

- Test-drive local session creation, submit, phase transitions, complete, cancel, retry, clear, language reset, evidence following, and late-event rejection.
- Add streaming HTTP and in-memory/fake transport Adapters to the internal transport seam.
- Keep one active request and store only completed history.
- Place the provider so a session survives chat-window/sheet navigation but not Desktop Mode unmount.
- Normalize all expected errors into localized `AskProblem` state.
- Make provider-disabled fixtures easy for Storybook-equivalent/manual review without a key.

### Completion criteria

- Every Interface invariant in `ASK-JAKUB.md` has a direct test.
- No component caller imports the wire protocol or provider types.
- Cancel/reset/language-change ignores all stale events.
- Retry does not duplicate the visitor turn.
- Navigation uses owned Evidence Links and fails closed.
- Tests run with in-memory Adapters and no network.

### Dispatch brief

> Implement WP-50 only against the frozen WP-40 contract and WP-10 navigator. Build a deep React provider/hook session facade plus HTTP and in-memory transport Adapters. Test every ordering, cancel, retry, language, late-event, error, and evidence invariant. Do not design the chat window or edit server/provider code.

## WP-60 — Ask Jakub Desktop App experience

### Objective

Create a polished bilingual Desktop App and mobile sheet experience against the completed session Interface and fake Adapters.

### Entry criteria

- WP-10, WP-30, and WP-50 merged.
- Copy, icon direction, and default Suggested Questions approved or explicitly marked draft.

### Ownership

- `components/desktop/apps/AskJakubApp.tsx` and feature-local visual parts
- Ask Jakub App Catalog entry and placement
- Ask-specific UI copy in the approved copy locality
- component/browser/visual tests for Ask Jakub

Do not change the session reducer, server contract, provider Adapter, or general window behavior unless a failing Interface proves a defect and the integrator reassigns ownership.

### Work

- Design empty, waiting, answer, clarification, not-covered, offline, error, rate-limit, and budget-disabled states.
- Build transcript, composer, character limit, Suggested Questions, cancel/retry/clear/copy, and Evidence Links.
- Keep the composer pinned through desktop resize and mobile virtual keyboard/safe areas.
- Implement validated progressive reveal with reduced-motion bypass; do not simulate network state in component logic.
- Add restrained live-region behavior and near-end-only auto-scroll.
- Ensure minimizing/closing/reopening and evidence navigation retain/return to the session.

### Completion criteria

- All named states are reviewable with deterministic fixtures.
- Desktop and 390px mobile flows pass keyboard and touch checks.
- No model call occurs until a question is submitted.
- Focus, scroll, live-region, reduced-motion, zoom, long Polish copy, and error recovery checks pass.
- Direct portfolio use remains clear when Ask Jakub is disabled.

### Dispatch brief

> Implement WP-60 only using the frozen `useAskJakubSession` Interface and fake Adapters. Build the complete bilingual Desktop App/mobile experience and every specified state. Prioritize evidence, accessibility, pinned composer behavior, reduced motion, and graceful disabled/provider failure. Do not alter provider or session internals to make the view easier.

## WP-70 — Spotlight and deterministic discovery

### Objective

Turn the existing menu-bar search affordance into a fast, keyboard-first, provider-free discovery tool shared with Ask Jakub's knowledge and navigation.

### Entry criteria

- WP-10 App Catalog/Portfolio Navigator and WP-20 Portfolio Knowledge merged.

### Ownership

- new `features/spotlight/**`
- Spotlight trigger/rendering in `components/desktop/MenuBar.tsx`
- focused tests and UI copy

Do not add model calls or duplicate a search index.

### Interface requirements

- Search apps, roles, technologies, education, projects, and contact destinations locally.
- Results return a title, concise kind/context, and Portfolio Location.
- Empty query shows curated destinations; aliases/diacritics work in both languages.
- Keyboard shortcut, arrow navigation, Enter, Escape, and focus return are complete.
- Search remains useful when Ask Jakub is disabled.

### Completion criteria

- Portfolio Knowledge fixtures drive both search and Ask retrieval metadata.
- Every indexed result opens the right semantic destination.
- No duplicate catalog or handwritten app-to-anchor switch leaks into the UI.
- Keyboard, mobile trigger, no-results, language, and reduced-motion flows pass.

### Dispatch brief

> Implement WP-70 using WP-10 navigation and WP-20 knowledge. Make the existing search affordance a deterministic bilingual Spotlight for apps and portfolio evidence. Keep the Interface small, local, keyboard-first, and provider-free. Do not build a second index or introduce AI search.

## WP-80 — real provider and public launch controls

Current status: partially implemented after owner approval on 2026-08-08. The server-only Groq `openai/gpt-oss-20b` Adapter, strict response schema, provider body/rate-limit handling, explicit environment switch, bilingual data-flow disclosure, technical privacy record, and guided Free-plan/ZDR/project-limit/Preview/Production/rollback setup exist. No live key was available to the implementation environment. An app-owned distributed limiter, operational telemetry, live bilingual evaluation, and staging/deployment evidence remain incomplete, so the original full completion criteria below are intentionally not marked complete.

### Objective

Add one replaceable production model Adapter and the controls required to expose the route publicly.

### Entry criteria

- WP-40, WP-50, and WP-60 complete.
- Provider, deployment region, spend ceilings, scope policy, allowed contact facts, telemetry, and retention decisions answered by the user.
- Staging environment available.

### Ownership

- one production provider Adapter under `features/ask-jakub/server/`
- environment schema/example names, never values
- rate-limit/spend-breaker Adapters and configuration
- operational telemetry/redaction code
- provider/abuse/evaluation tests and staging runbook

Do not redesign the Interface or UI to mirror provider-specific concepts.

### Work

- Implement official supported SDK/API use behind `AnswerModelPort`.
- Add durable abuse controls and global spend circuit breaker with deterministic tests.
- Enforce provider time/token/output bounds and a single total operation deadline.
- Add redacted operational metrics without raw questions/transcripts/IPs by default.
- Build bilingual evaluation fixtures for correctness, evidence, abstention, injection, and failure.
- Verify preview deployments do not make paid calls unless explicitly enabled.

### Completion criteria

- Swapping production and mock Adapters requires configuration, not caller changes.
- Rate limit and spend breaker are demonstrated in staging.
- Evaluation threshold and failures are published in the worker report.
- Client bundles/source maps contain no provider secret/config implementation.
- Provider-disabled rollback works without redeploying UI code where hosting permits.
- Privacy and retention documentation matches emitted data.

### Dispatch brief

> Product decisions for WP-80 are approved. Add exactly one production model Adapter plus durable rate limiting, spend circuit breaker, strict deadlines, redacted telemetry, and bilingual grounding/abuse evaluation. Keep all provider concepts behind `AnswerModelPort`; do not widen the Desktop App Interface. Demonstrate staging controls and provider-disabled rollback.

## WP-90 — release audit and public documentation

### Objective

Prove Desktop v2 is safe, accessible, performant, truthful, and understandable in the public repository.

### Entry criteria

- All scheduled product packages complete.
- Release candidate deployed to a staging/preview URL.
- Release path recorded as provider-disabled or model-enabled. Provider-dependent checklist items may be marked not applicable only when model calls are disabled by the shipped composition.

### Ownership

- end-to-end/accessibility/performance/security test suites and reports
- `README.md`, current architecture docs, privacy/security/contribution/license docs after user decisions
- removal/archival labels for superseded handoffs
- no feature implementation except release-blocking fixes explicitly reassigned by integrator

### Work

- Run the complete launch checklist from `ASK-JAKUB.md`.
- Verify routes, desktop/mobile widths, browsers, keyboard, screen reader, reduced motion, zoom, high contrast, provider disabled, rate limited, offline, timeout, and stale response.
- Re-run production dependency audit and focused tracked/history secret scan.
- Measure initial Simple Mode, Desktop Mode, app-open, Spotlight, and Ask interaction budgets; record regressions.
- Verify structured data/entity behavior is unchanged unless intentionally reviewed under `docs/ENTITY.md`.
- Make README architecture, setup, environment, tests, privacy, and feature status truthful.
- Resolve duplicate/orphan assets and record the license decision.

### Completion criteria

- Every launch checkbox is green or a named owner/date blocks release.
- No P0/P1 finding from the parent audit remains unaccounted for.
- Public docs contain no obsolete “next task” instruction presented as current.
- Release report contains commands, versions, viewport/browser matrix, performance numbers, audit results, and rollback check.
- Integrator can disable Ask Jakub while preserving the complete non-AI portfolio.

### Dispatch brief

> Audit the Desktop v2 release candidate against `README.md` and every checkbox in `ASK-JAKUB.md`. This is verification and public documentation, not feature expansion. Run cross-browser/responsive/accessibility/security/performance/provider-disabled checks, reconcile current docs, remove or label stale handoffs, and report every failure with owner and evidence. Release is complete only when all P0/P1 findings are closed or explicitly blocking.
