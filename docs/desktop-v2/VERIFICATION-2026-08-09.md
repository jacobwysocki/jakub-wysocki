# Desktop v2 verification — 2026-08-09

Status: provider-disabled-by-default local release candidate with a mock-tested optional Groq path; not a deployment approval

This report records the local integration review for `feat/desktop-chat-widget`, which adds the compact Ask Jakub widget after the six grouped Desktop v2 commits were merged to `main`. It separates checks proven in this workspace from checks that still need assistive technology, CI, staging, or a production host.

## Environment

- Repository branch: `feat/desktop-chat-widget`
- Host: Darwin 25.6.0, arm64
- Supported runtime target: Node.js 24.18.1 or newer on the Node 24 line
- Current Groq-addendum runner: Node.js 24.17.0, npm 11.13.0; this is below the declared engine floor and requires a supported-runtime CI/Preview rerun
- Framework: Next.js 16.3.0, React 19.2.8
- Model mode: optional direct Groq Adapter configured locally; automated and browser checks in this report use fakes or no-submit flows and do not invoke the live provider

The original Desktop v2 work is grouped into six reviewable commits and is present on `main`. The compact widget is isolated on a fresh follow-up branch based on that production tree.

## Automated verification

| Check                                 | Result                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                | Pass                                                                                                                 |
| `npm run lint`                        | Pass with zero warnings                                                                                              |
| `npm test`                            | Pass: 30 files, 275 tests                                                                                            |
| `npm run typecheck`                   | Pass, including `next typegen`                                                                                       |
| `next build --webpack`                | Pass on the current Node 24.17.0 runner; all application and API routes compiled; supported-runtime rerun pending    |
| `npm run audit:prod`                  | Pass: zero production vulnerabilities reported by npm                                                                |
| Vercel Preview                        | Pass for commit `15e85dc`; the default Turbopack deployment completed successfully                                   |
| `git diff --check`                    | Pass                                                                                                                 |
| Focused working-tree secret scan      | No private-key, common cloud-key, Groq-key, OpenAI-key, or Anthropic-key pattern found                               |
| Git-history secret-pattern scan       | No matching committed history found                                                                                  |
| Generated client-bundle boundary scan | No server model port, Groq endpoint/model/environment marker, hidden phone variable, or testing Adapter marker found |

The exact default `npm run build` path uses Turbopack. Its final local widget-branch rerun was blocked by this execution environment while Turbopack attempted to create a PostCSS helper process and bind an ephemeral localhost port (`EPERM`). The same final source compiled successfully through Next.js's supported webpack production builder. Vercel then completed the fresh widget Preview for commit `15e85dc` through the repository's default Turbopack build on its unrestricted runner. The deployment is protected by Vercel sign-in, so authenticated browser and live-provider smoke tests remain separate gates.

The compiled route set includes `/`, `/about`, `/o-mnie`, `/api/ask-jakub`, `/api/phone`, icons, Open Graph image, robots, and sitemap routes.

## Correctness evidence

- The typed App Catalog has nine visitor-visible Desktop Apps and one hidden Info utility.
- Portfolio Locations fail closed and now drive exact Experience roles, Education sections, Studio projects, and Showcase overview/live views in mounted Desktop Apps.
- Portfolio Knowledge covers current roles, education destinations, studio and personal projects, showcase views, public identity/contact paths, and portfolio facts in Polish and English.
- Nominated source checks cover the Squizzu role, drone-research algorithm narrative, Studio case narrative, and the derived Desktop App count.
- Minimized windows are both `aria-hidden` and natively `inert`; focus recovery remains covered.
- Ask Jakub covers local input, retrieval/composition, answer/clarification/not-covered, cancellation, retry, clear, evidence navigation, invalid output, offline, timeout, rate-limit, unavailable, and budget-disabled paths.
- The roomy-desktop quick-chat widget makes no request on mount, shares the same session with the full Ask Desktop App, previews the latest answer, exposes cancel/retry, yields while the full window is visible, and returns focus after close/minimise.
- The Ask session survives close, minimise/reopen, mobile evidence navigation and Back, and desktop/mobile breakpoint changes while Desktop Mode remains mounted.
- One absolute server deadline covers bounded body reading, parsing, generation, and the single repair attempt.
- The Groq Adapter sends bounded input through `AnswerModelPort`, uses strict structured output, caps provider responses, propagates abort, normalizes trusted `Retry-After`, requires exact JSON `200`, and never relays provider bodies.
- Route composition makes a mocked Groq request only when both the explicit provider switch and key are present; incomplete or unknown configuration performs no external call.

## Standards review

The Standards review was run independently against repository instructions and public documentation.

Resolved findings:

- Expanded the model-output trust boundary to reject adversarial destination forms while retaining ordinary prose.
- Moved the deadline to the HTTP route boundary so a stalled body cannot bypass the operation limit.
- Reconciled all public WP-60 status text with the completed provider-disabled implementation.
- Added a bilingual pre-submit Groq data-flow disclosure, technical privacy inventory, environment example, and repeatable Free-plan/ZDR/project-limit/Preview/Production/rollback wizard.

Open judgement-level refactor:

- Focus-return traversal and roving-menu keyboard logic are duplicated across a few desktop components. Their behavior is tested, but a later cleanup could extract shared accessibility helpers to reduce drift. This is not a release-blocking behavior defect.

## Spec review

The Spec review was run independently against [Desktop v2](./README.md), [Ask Jakub](./ASK-JAKUB.md), and the [agent plan](./AGENT-PLAN.md).

Resolved findings:

- Connected semantic launch selections to the actual app content rather than only storing them in the desktop shell.
- Made minimized windows non-tabbable through native `inert`.
- Added localized inline guidance for invalid or disabled keyboard submissions without adding transcript turns.
- Made reduced motion reveal the complete validated answer even when the preference changes mid-answer.
- Required a short actionable clarification and an owned next step for not-covered answers.
- Added the missing nominated contradiction checks for drone research and Studio narratives.
- Updated stale implementation and package-status documentation.

## Security and privacy posture

- The public Ask route is stateless, bounded, no-store, and provider disabled by default.
- The optional Groq path uses direct server-only HTTPS, so no production model SDK or provider credential exists in the dependency graph or client artifacts.
- Request, history, selected knowledge, output, response, and lifecycle sizes are capped.
- Evidence and Suggested Question IDs are allowlisted before reaching the UI.
- Model-authored HTML, Markdown destinations, URLs, email addresses, internal app IDs, and executable destinations are rejected.
- Conversation Sessions remain in memory and are not persisted by the application.
- The technical data-flow inventory is documented in [Privacy and data flow](../PRIVACY-DATA-FLOW.md). Groq ZDR/project limits, live secrets, Preview/Production configuration, analytics consent, operational telemetry, and legal policy remain external decisions or verification before an unqualified model-enabled launch.

## Browser and accessibility limits

Real-shell Testing Library/JSDOM regressions cover keyboard launchers, focus return, menus, Spotlight, mobile modal isolation, window geometry, Ask lifecycle retention, Evidence Links, the compact widget, and reduced-motion branches. Earlier desktop-resilience work also exercised representative desktop and 390 px mobile layouts.

A fresh Chrome browser pass verified the compact widget at 1440 px and its 900 px roomy-desktop threshold, confirmed it is absent below that threshold, and exercised widget → full App → close/minimise/restore focus handoffs without submitting a live provider question. The full App was the only Ask composer exposed while its window was visible. No application-origin warning or error was observed; captured warnings came from an unrelated installed browser extension.

The following remain external release gates:

- current Chrome, Safari/WebKit, and Firefox;
- VoiceOver or another screen reader;
- keyboard-only traversal at 200% zoom and high-contrast/forced-color settings;
- iOS Safari and Android touch/virtual-keyboard behavior;
- runtime reduced-motion switching and animation visual quality;
- fresh screenshots of the new Squizzu Studio tab and Ask states;
- Lighthouse/Core Web Vitals and the existing public-media budget;
- authenticated Preview UI and live-provider smoke tests; the exact Turbopack build itself has passed on the fresh widget Preview.

## Gates that still block an unqualified model-enabled release

1. Create the dedicated Groq Free-plan project/key and verify ZDR, conservative project limits, model access, United States processing acceptance, and no billing upgrade.
2. Complete live bilingual quality/injection/abstention evaluation in a Vercel Preview, then verify Production and the environment rollback.
3. Decide whether provider-side project limits are sufficient for initial traffic or add an application-owned distributed limiter before wider promotion.
4. Decide telemetry fields, retention, consent, deletion, and any final visitor-facing privacy policy.
5. Verify current Chrome/Safari/Firefox, assistive technology, mobile virtual keyboard, client artifacts/source maps, and deployment logs with the real configured path.
6. Resolve the repository license, contribution policy, and private security-reporting channel.

Until those checks are recorded, the safe release path is provider disabled: the full portfolio, Spotlight, curated suggestions, semantic evidence navigation, and graceful unavailable state remain usable without an external AI request.

## Conclusion

The provider-disabled-by-default code candidate and optional Groq composition are locally coherent and strongly covered. They are ready for intentional commit preparation and the guided external setup, not for an unqualified public-release claim. A model-enabled launch still needs real Groq/Vercel configuration and the external gates above; adding credentials alone is not recorded as release proof.
