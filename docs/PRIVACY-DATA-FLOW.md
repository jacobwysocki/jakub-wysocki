# Technical privacy and data flow

Status: repository-observable behavior; not a legal privacy notice

Last reconciled with the working tree: 2026-08-08

This document records what the application code stores, sends, and deliberately excludes. It cannot establish what a hosting platform, analytics vendor, browser, embedded third-party site, or future model provider retains outside this repository.

## Current data flows

### Page and portfolio use

- Public portfolio copy, public email addresses, profile links, project links, images, and videos are shipped as site content.
- Simple Mode and Desktop Mode read the same canonical public facts from `data/`.
- Spotlight searches the App Catalog and Portfolio Knowledge in the browser. Opening Spotlight, typing a query, rendering curated results, and following a result do not call an AI model.
- Live project previews may load cross-origin sites in sandboxed iframes. Opening those previews can expose an ordinary web request to the embedded site's operator under that site's policy.
- External profile, project, email, and telephone links leave the portfolio and are then governed by the destination or device.

### Browser-side preferences

| Key            | Storage          | Purpose                                                                      | Lifetime in application code                                                         |
| -------------- | ---------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `jw-lang`      | Cookie           | Lets the server render Polish or English on the first response.              | `Max-Age` of one year; `SameSite=Lax`; replaced when language changes.               |
| `jw-view-mode` | `localStorage`   | Remembers Simple Mode or Desktop Mode before first paint.                    | No application expiry; remains until browser/site storage is cleared or overwritten. |
| `jw-wallpaper` | `localStorage`   | Remembers the selected Desktop wallpaper.                                    | No application expiry; remains until browser/site storage is cleared or overwritten. |
| `jw-booted`    | `sessionStorage` | Avoids replaying the Desktop boot animation in the same browser-tab session. | Browser session storage lifetime.                                                    |

The application tolerates unavailable browser storage and falls back to its default presentation.

### Site analytics and performance measurement

The root layout mounts `@vercel/analytics` and `@vercel/speed-insights` for every presentation. Their effective collection, cookie behavior, geography, retention, access controls, and opt-out behavior depend on the deployed Vercel/project configuration and vendor terms; those facts are not defined in this repository.

Before release, deployment owners must verify the actual configuration and decide whether a public privacy notice, consent control, or opt-out is required. This technical record must then link to the resulting visitor-facing policy.

### Contact phone

`CONTACT_PHONE` is optional server configuration. When absent, the phone option is hidden. When a visitor chooses “Show number,” the browser requests `/api/phone` and receives the configured number and `tel:` value.

The phone value is not committed, placed in Portfolio Knowledge, included in static HTML/client bundles, or allowed into a future Ask Jakub model input.

### Ask Jakub

Ask Jakub uses an ephemeral client Conversation Session. Opening the app and rendering Suggested Questions create no network request. A submission sends a bounded request to the owned `/api/ask-jakub` route containing:

- protocol version, local session ID, and request ID;
- selected language;
- the submitted question;
- bounded completed conversation history.

The server validates and bounds that request, retrieves public Portfolio Knowledge, constructs bounded structured model input, validates any terminal result, and returns a no-store newline-delimited JSON lifecycle response. The route is provider-disabled unless both `ASK_JAKUB_PROVIDER=groq` and a non-empty server-only `GROQ_API_KEY` are configured.

When Groq is enabled, each model attempt sends one bounded HTTPS request to Groq's Chat Completions API using `openai/gpt-oss-20b`. The answer operation permits at most one repair attempt under the same absolute deadline, so one visitor submission can make at most two provider requests. The provider input contains:

- the selected language and submitted question;
- bounded completed conversation history, treated as untrusted data;
- up to six selected public Portfolio Knowledge facts and their opaque IDs;
- allowlisted Suggested Question IDs;
- static grounding and structured-output instructions.

The server does not send the local session ID, request ID, IP address, analytics identity, `CONTACT_PHONE`, environment values, private repositories, or unpublished work to the model. Provider output is capped, parsed, and revalidated against owned evidence/suggestion IDs; raw provider bodies and model-authored destinations never cross the route. The empty UI discloses this external flow before the first question.

Groq documents that usage metadata is always retained without inputs/outputs; inference inputs and outputs are not retained by default except for reliability or abuse monitoring for up to 30 days. Groq also offers Zero Data Retention for inference, which the setup wizard asks the deployment owner to enable. Groq documents retained customer-data storage in the United States. Console configuration is external state and must be verified before launch; this repository cannot prove that ZDR remains enabled. See [Groq's data documentation](https://console.groq.com/docs/your-data).

The repository contains no application-level Ask Jakub transcript persistence or operational logger. Conversation state is lost on refresh or when its Desktop presentation unmounts; changing language starts a fresh localized session. This does not rule out ordinary hosting/network logs outside application code.

Future model-backed operation must preserve these exclusions:

- no `CONTACT_PHONE`, environment values, private repositories, unpublished work, or analytics identity in Portfolio Knowledge or model input;
- no raw question, transcript, prompt, provider body, or IP address in ordinary product analytics by default;
- no model-authored URLs, email addresses, HTML, Markdown links, app IDs, or executable actions crossing the validated answer boundary.

## Current controls and limits

- Ask provider code, credentials, and the model port are server-only.
- Request body, identifier, question, history, selected-knowledge, answer, event count, response bytes, and total operation duration are bounded.
- Exactly one client request may be active per Conversation Session.
- Completed factual answers require evidence resolved from the owned Portfolio Knowledge catalog.
- Responses use `no-store`; expected failures are localized and do not expose provider bodies, stack traces, keys, or prompts.
- The owned route remains provider-disabled by default; one explicit environment switch enables Groq and provides the rollback path.
- The setup runbook keeps the account on Groq's Free plan, uses a dedicated project, and asks for conservative project-level limits. These provider controls do not replace an app-owned distributed abuse limiter.

These controls do not constitute durable public rate limiting, a spend circuit breaker, provider data governance, or a legal privacy policy.

## Model-path decisions and remaining release gates

The approved optional path is Groq `openai/gpt-oss-20b`, strict portfolio-only answers, selected public Portfolio Knowledge only, hidden phone exclusion, no application-level raw-question telemetry, a dedicated Free-plan project, requested Zero Data Retention, conservative provider project limits, and environment-based disable/rollback.

The following still require deployment-owner verification or a later decision before an unqualified public launch:

1. verify the selected Groq project remains on the Free plan, ZDR is enabled, conservative limits are active, and United States processing is acceptable;
2. decide whether provider-side limits are sufficient for initial traffic or add an application-owned distributed limiter before wider promotion;
3. decide whether any redacted operational telemetry is needed and define its storage, access, retention, and deletion;
4. decide consent or opt-out behavior for existing analytics and any future AI telemetry;
5. publish final visitor-facing privacy wording and verify Preview/Production configuration, live answer quality, rollback, and secret absence from client artifacts.

The safe default remains: provider disabled, strict Portfolio Knowledge scope, ephemeral client session, no application-level raw-question logging, no hidden contact data, and complete provider-free portfolio navigation.
