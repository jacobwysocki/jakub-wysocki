# Desktop v2 verification — 2026-08-09

Status: focused Ask Jakub content and widget audit complete locally and on Vercel Preview; external release gates remain

This report records the local integration review for Desktop v2 and the follow-up Ask Jakub content audit on `fix/ask-jakub-content-audit`. The widget and Desktop v2 work are already present on `main`; this branch improves question discovery, canonical knowledge coverage, and long-answer presentation. The report separates checks proven in this workspace from checks that still need assistive technology, CI, staging, or a production host.

## Environment

- Repository branch: `fix/ask-jakub-content-audit`
- Host: Darwin 25.6.0, arm64
- Supported runtime target: Node.js 24.18.1 or newer on the Node 24 line
- Current Groq-addendum runner: Node.js 24.17.0, npm 11.13.0; this is below the declared engine floor and requires a supported-runtime CI/Preview rerun
- Framework: Next.js 16.3.0, React 19.2.8
- Model mode: optional direct Groq Adapter configured locally; automated checks use deterministic ports, while the focused browser audit made two controlled live Groq requests in Polish

The original Desktop v2 work and compact widget are present on `main`. This follow-up branch is based on that production tree and contains only the focused content, retrieval, widget-presentation, test, and documentation changes described below.

## Automated verification

| Check                                 | Result                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                | Pass                                                                                                                 |
| `npm run lint`                        | Pass with zero warnings                                                                                              |
| `npm test`                            | Pass: 30 files, 289 tests                                                                                            |
| `npm run typecheck`                   | Pass, including `next typegen`                                                                                       |
| `next build --webpack`                | Pass on the current Node 24.17.0 runner; all application and API routes compiled; supported-runtime rerun pending    |
| `npm run audit:prod`                  | Pass: zero production vulnerabilities reported by npm                                                                |
| Vercel Preview                        | Pass for content-audit commit `4bc06b3`; Vercel reports “Deployment has completed”                                   |
| `git diff --check`                    | Pass                                                                                                                 |
| Focused working-tree secret scan      | No private-key, common cloud-key, Groq-key, OpenAI-key, or Anthropic-key pattern found                               |
| Git-history secret-pattern scan       | No matching committed history found                                                                                  |
| Generated client-bundle boundary scan | No server model port, Groq endpoint/model/environment marker, hidden phone variable, or testing Adapter marker found |

The exact default `npm run build` path uses Turbopack. Its focused content-audit rerun was blocked by this execution environment while Turbopack attempted to create a PostCSS helper process and bind an ephemeral localhost port (`EPERM`). The same final source compiled successfully through Next.js's supported webpack production builder. Vercel then completed the content-audit Preview for commit `4bc06b3` through the repository's default Turbopack build on its unrestricted runner. The deployment is protected by Vercel sign-in, so authenticated browser and live-provider smoke tests remain separate gates.

The compiled route set includes `/`, `/about`, `/o-mnie`, `/api/ask-jakub`, `/api/phone`, icons, Open Graph image, robots, and sitemap routes.

## Correctness evidence

- The typed App Catalog has nine visitor-visible Desktop Apps and one hidden Info utility.
- Portfolio Locations fail closed and now drive exact Experience roles, Education sections, Studio projects, and Showcase overview/live views in mounted Desktop Apps.
- Portfolio Knowledge covers current roles, education destinations, studio and personal projects, showcase views, public identity/contact paths, and portfolio facts in Polish and English.
- Portfolio Knowledge now derives a dedicated current-work fact from Jakub's active Ultra Studio and Squizzu roles and derives his five public passions from the canonical education/profile data.
- The five curated questions prioritize current work, Venor, Squizzu, Ultra Studio, and full-stack fit; every localized question is regression-tested to retrieve at least one mapped owned fact in Polish and English.
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
- Closed the public-knowledge coverage gap for passions and added paired Polish/English retrieval checks for the highest-value visitor intents.

Open judgement-level refactor:

- Focus-return traversal and roving-menu keyboard logic are duplicated across a few desktop components. Their behavior is tested, but a later cleanup could extract shared accessibility helpers to reduce drift. This is not a release-blocking behavior defect.
- The full Ask App and compact widget still duplicate a small amount of composer-state and Unicode-bound handling. A later shared internal hook could reduce drift without coupling their layouts; the current behavior is covered and this is not release-blocking.

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
- Replaced the low-priority opening suggestions with the four requested visitor questions while retaining the full-stack question as the fifth curated option.
- Removed the widget's three-line clamp; long validated answers now wrap inside a bounded, independently scrollable preview instead of losing their final characters.

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

A fresh Chrome browser pass verified all four primary Polish suggestions in the full Ask App and made two controlled live Groq requests. “Jakie pasje ma Jakub?” returned the five canonical passions, and a deliberately long full-stack question returned a grounded answer whose final sentence and punctuation remained reachable in the widget. The preview had no line clamp and scrolled within its bounded region. The full App remained the only Ask composer exposed while its window was visible. No application-origin warning or error was observed; captured warnings came from an unrelated installed browser extension.

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

The focused content and widget audit is locally coherent, strongly covered, and compiled successfully on its current-branch Vercel Preview. It is ready for review, not yet an unqualified public-release claim. A model-enabled launch still needs the external gates above; adding credentials alone is not recorded as release proof.
