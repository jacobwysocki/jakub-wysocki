# Desktop v2 verification — 2026-08-08

Status: provider-disabled-by-default local release candidate with a mock-tested optional Groq path; not a deployment approval

This report records the final local integration review against commit `880c2496b47d` plus the uncommitted working-tree changes. It separates checks proven in this workspace from checks that need a fresh browser, assistive technology, CI, staging, or a production host.

## Environment

- Repository branch: `main`
- Host: Darwin 25.6.0, arm64
- Supported runtime target: Node.js 24.18.1 or newer on the Node 24 line
- Current Groq-addendum runner: Node.js 24.17.0, npm 11.13.0; this is below the declared engine floor and requires a supported-runtime CI/Preview rerun
- Framework: Next.js 16.3.0, React 19.2.8
- Model mode: provider disabled in this workspace; optional direct Groq Adapter present, with no provider SDK or real credential

The working tree is intentionally uncommitted. It also includes a one-time formatter baseline across existing implementation files; isolate that mechanical change when preparing commits so feature review remains readable.

## Automated verification

| Check                                 | Result                                                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run format:check`                | Pass                                                                                                                 |
| `npm run lint`                        | Pass with zero warnings                                                                                              |
| `npm test`                            | Pass: 30 files, 270 tests                                                                                            |
| `npm run typecheck`                   | Pass, including `next typegen`                                                                                       |
| `next build --webpack`                | Pass on the current Node 24.17.0 runner; all application and API routes compiled; supported-runtime rerun pending    |
| `npm run audit:prod`                  | Pass: zero production vulnerabilities reported by npm                                                                |
| `git diff --check`                    | Pass                                                                                                                 |
| Focused working-tree secret scan      | No private-key, common cloud-key, Groq-key, OpenAI-key, or Anthropic-key pattern found                               |
| Git-history secret-pattern scan       | No matching committed history found                                                                                  |
| Generated client-bundle boundary scan | No server model port, Groq endpoint/model/environment marker, hidden phone variable, or testing Adapter marker found |

The exact default `npm run build` path uses Turbopack. Its final rerun was blocked by this execution environment while Turbopack attempted to create a PostCSS helper process and bind an ephemeral localhost port (`EPERM`). The same final source compiled successfully through Next.js's supported webpack production builder. CI or staging must still run the repository's exact Turbopack command on an unrestricted supported Node runtime; this report does not relabel the runner limitation as a passing Turbopack result.

The compiled route set includes `/`, `/about`, `/o-mnie`, `/api/ask-jakub`, `/api/phone`, icons, Open Graph image, robots, and sitemap routes.

## Correctness evidence

- The typed App Catalog has nine visitor-visible Desktop Apps and one hidden Info utility.
- Portfolio Locations fail closed and now drive exact Experience roles, Education sections, Studio projects, and Showcase overview/live views in mounted Desktop Apps.
- Portfolio Knowledge covers current roles, education destinations, studio and personal projects, showcase views, public identity/contact paths, and portfolio facts in Polish and English.
- Nominated source checks cover the Squizzu role, drone-research algorithm narrative, Studio case narrative, and the derived Desktop App count.
- Minimized windows are both `aria-hidden` and natively `inert`; focus recovery remains covered.
- Ask Jakub covers local input, retrieval/composition, answer/clarification/not-covered, cancellation, retry, clear, evidence navigation, invalid output, offline, timeout, rate-limit, unavailable, and budget-disabled paths.
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

Real-shell Testing Library/JSDOM regressions cover keyboard launchers, focus return, menus, Spotlight, mobile modal isolation, window geometry, Ask lifecycle retention, Evidence Links, and reduced-motion branches. Earlier desktop-resilience work also exercised representative desktop and 390 px mobile layouts.

A fresh in-app browser connection was unavailable during this final pass, so the final Ask/Studio visual state was not re-verified in a clean live browser. The following remain external release gates:

- current Chrome, Safari/WebKit, and Firefox;
- VoiceOver or another screen reader;
- keyboard-only traversal at 200% zoom and high-contrast/forced-color settings;
- iOS Safari and Android touch/virtual-keyboard behavior;
- runtime reduced-motion switching and animation visual quality;
- fresh screenshots of the new Squizzu Studio tab and Ask states;
- Lighthouse/Core Web Vitals and the existing public-media budget;
- preview/staging smoke tests, including the exact Turbopack build command.

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
