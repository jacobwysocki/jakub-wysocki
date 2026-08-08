# Desktop v2

Status: provider-disabled-by-default local release candidate; optional Groq path implemented, external release checks pending

Last reconciled with the working tree: 2026-08-08

Desktop v2 turns the interactive desktop into evidence of product engineering. The goal is not more operating-system decoration; it is to help a Portfolio Visitor discover relevant work, understand Jakub's contribution, follow supporting evidence, and reach a contact decision.

Related documents:

- [Ask Jakub product and architecture](./ASK-JAKUB.md)
- [Desktop v2 execution record](./AGENT-PLAN.md)
- [Portfolio vocabulary](../../CONTEXT.md)
- [Grounded-guide ADR](../adr/0001-ask-jakub-is-a-grounded-portfolio-guide.md)
- [Technical privacy and data flow](../PRIVACY-DATA-FLOW.md)

## Current implementation status

This table describes the release-candidate working tree, not a deployed release.

| Package | Status             | Observable result                                                                                                                                                                                                                                                 |
| ------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WP-00   | Complete           | Node/npm support, formatting, lint, type checking, Vitest, build, dependency audit, CI, and Dependabot configuration exist.                                                                                                                                       |
| WP-10   | Complete           | Typed App Catalog, strict app identity, unified placement, Portfolio Locations, and Desktop/Simple navigation Adapters fail closed.                                                                                                                               |
| WP-20   | Complete           | Curated bilingual Portfolio Knowledge, evidence, suggestions, deterministic retrieval, source nomination, and consistency validation exist.                                                                                                                       |
| WP-30   | Complete           | Window reconciliation, focus recovery, mobile modal isolation, scroll contracts, keyboard menus, and app-owned motion-warning fixes are implemented.                                                                                                              |
| WP-40   | Complete           | The bounded server answer operation, versioned route contract, provider port, validation, deadlines, and deterministic/disabled Adapters exist without a paid provider.                                                                                           |
| WP-50   | Complete           | The React session facade and HTTP/in-memory transport Adapters implement submit, cancel, retry, clear, language reset, stale-event rejection, and evidence navigation.                                                                                            |
| WP-60   | Complete           | The bilingual Ask Jakub quick-chat widget, Desktop App/mobile sheet, App Catalog placement, lifecycle retention, composer, evidence, and UI state matrix are integrated.                                                                                          |
| WP-70   | Complete           | Spotlight searches the App Catalog and Portfolio Knowledge locally and navigates through Portfolio Locations on desktop and mobile.                                                                                                                               |
| WP-80   | Partially complete | A server-only Groq Adapter, explicit environment composition, provider-response bounds, public disclosure, and free-tier setup/rollback wizard exist. App-owned distributed abuse limiting, operational telemetry, live-key evaluation, and staging proof remain. |
| WP-90   | Partially complete | Local automated, security, privacy-data-flow, and documentation checks are recorded; fresh browser, assistive-technology, performance, staging, and deployment checks remain external release gates.                                                              |

The complete local quality contract and its limits are recorded in the [2026-08-09 verification report](./VERIFICATION-2026-08-09.md). That report is not evidence of a deployment or of the external checks it marks pending.

## Outcome

Desktop v2 should make these visitor journeys excellent:

1. Find work relevant to React, product design, applied AI, or another documented skill.
2. Understand Jakub's contribution and open the supporting role, project, or contact path.
3. Navigate the same evidence through Simple Mode, desktop windows, or mobile sheets.
4. Assess the portfolio with keyboard, touch, reduced motion, and assistive technology.
5. Continue using the complete non-AI portfolio whenever Ask Jakub is unavailable.

Success means a visitor can reach a relevant, verifiable proof point within two interactions, not that the desktop contains the most features.

## Product principles

### Evidence before spectacle

Every signature interaction ends at a role, project, case study, or contact path. Decorative OS features earn their place by making discovery memorable without slowing it down.

### One portfolio, two presentations

Simple Mode and Desktop Mode present the same Portfolio Knowledge. Interaction adapts to windows or sheets, while factual meaning and Portfolio Location identity remain shared.

### Progressive capability

Core content and Spotlight remain usable without Ask Jakub or a model provider. Model failure cannot block direct portfolio navigation.

### Public by default, private by design

Assume every route will be probed. Secrets stay server-only; input, output, and duration are bounded; visitor questions are not intentionally persisted by application code. Durable spend bounds, hosting behavior, and provider retention must be selected and documented before model-backed launch.

### Interface is the test surface

Window behavior, Portfolio Knowledge, semantic navigation, Spotlight, and Ask Jakub are tested through their caller-facing Interfaces rather than internal layout details.

## Current architecture

```text
Canonical public facts in data/
        │
        ├── Simple Mode views
        │
        └── Portfolio Knowledge ─────────► Spotlight
                    │                         │
                    │                         └── Portfolio Location
                    │
                    └── Ask server operation ──► validated Evidence IDs
                                  │
                         AnswerModelPort
                                  │
                 disabled / scripted / Groq Adapter

App Catalog ──► client visual registry ──► Desktop windows / mobile sheets
      │                                         │
      └──────── Portfolio Navigator ◄───────────┘

Ask desktop widget / Desktop App / mobile sheet
                              │
                              ▼
              AskJakubProvider/useAskJakubSession
                              │
                  bounded HTTP transport
                              │
                    POST /api/ask-jakub
```

The route and protocol fail closed to the localized provider-unavailable state by default. When both server-only Ask variables are present, the same route uses the Groq Adapter without changing the browser contract.

### Module Interfaces

| Module              | Public Interface                                                      | Responsibility                                                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App Catalog         | `AppCatalog`, `AppId`, `parseAppId`                                   | Server-safe identity, localized title, size, placement, scrolling, and visitor visibility. Visual glyphs/content stay in the desktop registry Adapter.                                          |
| Portfolio Navigator | `PortfolioNavigator.open(location)`                                   | Resolves a typed Portfolio Location, opens/focuses Desktop content or follows a canonical Simple Mode href, and fails closed on stale targets.                                                  |
| Portfolio Knowledge | `portfolioKnowledge`, `retrieveKnowledge`, evidence/suggestion lookup | Curated bilingual facts, owned evidence, deterministic aliases/retrieval, and validation. It imports canonical data rather than becoming a second narrative source.                             |
| Spotlight           | `searchSpotlight` and the `Spotlight` view                            | Provider-free local discovery over App Catalog and Portfolio Knowledge; results carry only a Portfolio Location.                                                                                |
| Ask Jakub client    | `AskJakubProvider`, `useAskJakubSession`                              | Ephemeral session state plus `submit`, `cancel`, `retry`, `clear`, and `followEvidence`. Ordinary UI callers do not import the wire or provider contracts.                                      |
| Ask transport       | internal `AskTransport.stream()`                                      | Bounded async event transport with HTTP and deterministic in-memory Adapters.                                                                                                                   |
| Ask server          | internal answer operation and `AnswerModelPort`                       | Request validation, bounded retrieval/prompt input, deadline, structured provider-result validation, evidence resolution, and normalized failures.                                              |
| Owned route         | `POST /api/ask-jakub`                                                 | Versioned newline-delimited JSON lifecycle contract with bounded bodies/responses and no-store responses. The current implementation buffers the validated lifecycle array before returning it. |

State ownership remains local to its behavior: Zustand owns mode/window state; the desktop shell owns semantic selections; Spotlight owns its dialog state; Ask Jakub owns its session through a provider above the widget/app window/sheet; the server remains stateless. The quick-chat widget is another presentation of that session, not another Desktop App or App Catalog entry.

## Feature roadmap

### Trustworthy foundation — implemented

- Repository quality gates and patched production dependencies.
- Typed App Catalog and Portfolio Navigator.
- Deterministic Portfolio Knowledge and consistency validation.
- Desktop focus, modal, keyboard, scroll, resize, and reduced-motion resilience.

### Signature discovery — implemented with optional model configuration

- Spotlight is implemented without a provider or second search index.
- Ask server, client session, and desktop widget/Desktop App/mobile presentations are implemented against scripted, provider-disabled, and optional Groq Adapters.
- Ask evidence links use typed semantic destinations shared with Spotlight and Simple Mode fallbacks.
- A focused, printable CV view remains a future feature.

### Later, evidence-led options

- Shareable links that encode one Portfolio Location rather than arbitrary window geometry.
- Optional local workspace continuity with a visible reset.
- A short, skippable guided tour built on the existing Navigator.
- Commandable window management through the same typed identities.

A guestbook, autonomous tools, general web search, voice mode, and server-persisted conversation remain out of scope unless visitor evidence justifies their privacy, moderation, and cost surface.

## Release quality contract

```sh
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm run audit:prod
```

Vitest currently runs unit, component, route-contract, and Interface tests in JSDOM. There is no checked-in automated cross-browser suite. WP-90 must record browser/viewport coverage, keyboard and touch flows, reduced motion, zoom, high contrast, screen-reader checks, performance, dependency audit, secret scan, and provider-disabled behavior in a dated release report.

## Historical baseline audit

The original repository audit inspected `880c249` on `main`. The findings below are retained as provenance rather than current-state instructions.

| Original finding                                           | Current disposition                                                                             |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| High-severity production dependency chain                  | Resolved by WP-00; rerun the time-sensitive audit immediately before release.                   |
| No format, lint, type-check, test, audit, or CI contract   | Resolved by WP-00.                                                                              |
| String app IDs and fallback-to-first-app lookup            | Resolved by WP-10.                                                                              |
| Separate mobile placement list                             | Resolved by WP-10.                                                                              |
| Missing focus restoration and mobile modal isolation       | Resolved by WP-30.                                                                              |
| Mobile sheet ignored app scroll ownership                  | Resolved by WP-30.                                                                              |
| No viewport/window reconciliation                          | Resolved by WP-30.                                                                              |
| Contradictory hard-coded public app count                  | Resolved by WP-20; volatile counts derive from App Catalog and are validated.                   |
| App-owned Framer Motion warnings                           | Resolved by WP-30 integration and browser reproduction.                                         |
| Stale public documentation                                 | This reconciliation addresses the implemented waves; final release evidence remains WP-90 work. |
| Roughly 13 MB of public media and duplicate portrait files | Open; asset removal and performance budgets require deliberate release work.                    |
| Literal Desktop colors/dimensions versus token claims      | Open; either establish a token layer or document the narrower convention.                       |
| No public license or contribution policy                   | Open user decision.                                                                             |

The original audit's route counts, dependency versions, and browser observations are snapshots, not durable architecture facts.

## Recorded model path and decisions still needed

The approved optional model path is Groq `openai/gpt-oss-20b` on a dedicated Free-plan project, strict portfolio grounding, selected public facts only, no hidden phone, no application-level raw-question telemetry, requested Zero Data Retention, conservative provider project limits, and `ASK_JAKUB_PROVIDER` as the rollback switch. The visitor-facing UI discloses the external data flow before submission.

These remaining decisions or external confirmations change privacy or public behavior:

1. Verify the live Groq project stays on the Free plan, ZDR and project limits remain active, and United States processing is acceptable.
2. Decide whether provider-side limits are sufficient for initial traffic or add an application-owned distributed limiter before wider promotion.
3. Decide whether redacted operational telemetry is wanted, where it is stored, and for how long. Raw questions and transcripts remain excluded by default.
4. Decide what consent or opt-out behavior is required for existing site analytics and any future AI telemetry.
5. Complete live bilingual answer-quality, browser, assistive-technology, Preview, Production, client-secret, and rollback verification.
6. Decide whether the public repository receives licenses with separate treatment for code and portfolio content/assets.
7. Decide whether external contributions are accepted and which private vulnerability-reporting channel is published.

Regardless of model configuration, the defaults remain ephemeral Conversation Sessions, no application-level raw-question logging, no hidden contact data, no general web access, strict portfolio grounding, and complete provider-free navigation.
