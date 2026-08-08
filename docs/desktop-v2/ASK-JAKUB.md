# Ask Jakub

Status: frozen product/architecture contract; provider-disabled default and optional Groq implementation complete

Parent plan: [Desktop v2](./README.md)

Ask Jakub is a grounded, bilingual portfolio guide. It helps a Portfolio Visitor connect an open-ended question to verified experience and then move to the supporting role, project, or contact path.

It is not an impersonation of Jakub, an autonomous agent, or a general web assistant.

## Implementation status

This specification is both a normative contract and a design record. Current working-tree behavior is:

- Portfolio Knowledge, Evidence Links, Suggested Questions, deterministic retrieval, and semantic navigation are implemented.
- The bounded server answer operation, versioned owned route, validation, deadline, scripted model Adapter, and provider-disabled Adapter are implemented.
- `AskJakubProvider` and `useAskJakubSession` implement the ephemeral client session and HTTP/in-memory transport seam.
- The bilingual desktop quick-chat widget, Desktop App, and mobile presentation are integrated, including all specified UI states, session retention, evidence navigation, input bounds, reduced motion, and responsive lifecycle behavior.
- The public route fails closed to the provider-disabled Adapter unless `ASK_JAKUB_PROVIDER=groq` and a server-only key are configured. A direct Groq `openai/gpt-oss-20b` Adapter exists without a provider SDK; an app-owned distributed rate limiter, AI operational telemetry, live-key evaluation, and staging proof do not.
- Final browser, assistive-technology, privacy, security, and release verification remains WP-90 work.

The sections below describe the intended launch contract unless a paragraph explicitly says “current implementation.”

## Product contract

### Jobs to be done

- Recommend the most relevant work for a visitor's interest.
- Explain Jakub's role, trade-offs, or experience in concise language.
- Compare documented roles, projects, skills, or disciplines.
- Answer factual questions about education, work, projects, location, and public contact options.
- Guide a visitor to Evidence Links rather than asking them to trust generated prose.
- State clearly when Portfolio Knowledge does not contain an answer.

### Launch scope

The launch surface is a compact quick-chat widget on roomy desktops, a full Desktop App, and a mobile sheet. All three use one Conversation Session. It survives closing/reopening the app and desktop/mobile breakpoint changes while its Desktop Mode presentation remains mounted, but disappears on refresh, language change, or when leaving Desktop Mode. Real-shell component tests verify that behavior; fresh-browser and assistive-technology release checks remain WP-90 work.

The widget is a presentation of Ask Jakub, not another Desktop App: it has no App Catalog entry and does not change the public Desktop App count. It appears only when at least 900 CSS pixels are available, yields to the full Ask window while that window is visible, and returns with the same session when the window is minimized or closed.

The first release includes:

- Polish and English sessions that follow the active portfolio language.
- A local welcome message and three to five Suggested Questions with no model call.
- A compact desktop composer with latest-answer preview, cancel, retry, privacy disclosure, and expansion into the full transcript.
- One active question at a time.
- Visible “searching portfolio” and “composing answer” phases.
- Cancel, retry, clear session, and copy-answer controls.
- Concise plain-text answers.
- One to three allowlisted Evidence Links for portfolio-specific factual answers.
- A bilingual pre-submit disclosure when an enabled AI answer will send the question, completed history, and selected public facts to Groq; the site does not persist the conversation.
- Safe unsupported, offline, timeout, rate-limited, budget-disabled, and provider-unavailable states.
- Semantic navigation to the relevant Desktop App with a canonical Simple Mode fallback.
- A provider-disabled demo Adapter for local development, tests, preview deployments, and graceful production fallback.

### Scope policy

| Question                                                                                                | Default behavior                                                                                                                                |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Supported fact about Jakub                                                                              | Answer from Portfolio Knowledge and include Evidence Links.                                                                                     |
| Comparison or recommendation using documented work                                                      | Answer and explain which evidence drove the recommendation.                                                                                     |
| Ambiguous but relevant question                                                                         | Ask one short clarifying question.                                                                                                              |
| Relevant subject not covered by Portfolio Knowledge                                                     | Say what is known, state the limit, and offer a related Suggested Question or contact path.                                                     |
| General software/design/career question                                                                 | At launch, answer only when it can be framed explicitly through documented experience. Label the answer as perspective, not a fact about Jakub. |
| Private, speculative, sensitive, or current fact not published                                          | Abstain and offer the public contact path where appropriate.                                                                                    |
| General trivia, web research, politics, medical/legal/financial advice, or instructions to ignore scope | Decline briefly and redirect to the portfolio.                                                                                                  |

The general-professional row remains a product decision. Until it is approved, the implementation default is strict Portfolio Knowledge scope: answers may explain documented experience and approach, but the guide does not supply free-standing general advice or web knowledge.

### Non-goals

- No web browsing, email sending, form submission, code execution, calendar booking, or autonomous tools.
- No account, identity, server-side transcript, long-term memory, or cross-device history.
- No model access to `CONTACT_PHONE`, environment values, private repositories, analytics identity, or unpublished work.
- No model-authored HTML, Markdown links, URLs, app IDs, email addresses, or executable action arguments.
- No embeddings or vector database until deterministic retrieval is measured and shown to miss real questions.
- No answer-quality claims based only on a hand-picked demo script.

## Experience

### Empty state

The app opens with a short, explicitly non-human introduction:

> Ask about my work, projects, or how engineering and design connect. Answers use this portfolio and link back to the source.

The copy is localized and stored with other UI copy. Suggested Questions are curated in Portfolio Knowledge, not generated at runtime.

Suggested Question families:

- “What is Jakub currently working on?”
- “What is Venor?”
- “What is Squizzu?”
- “What does Ultra Studio offer?”
- “What should I look at if I am hiring for a full-stack role?”

### Asking

Submitting immediately appends the Portfolio Visitor question and a guide placeholder. The placeholder announces lifecycle phases to sighted visitors and assistive technology without repeatedly announcing animation frames.

The server does not forward raw provider tokens directly into the page. It selects knowledge, obtains a bounded structured answer, validates its text and evidence, and only then releases the answer. The UI may reveal validated text progressively for conversational polish; reduced-motion visitors receive it immediately.

This preserves the safety and testability of the minimal design while keeping the responsive state model of the UI-first design.

### Answer

An answer contains:

1. A direct first sentence.
2. At most two short supporting paragraphs or a compact list.
3. One to three Evidence Links when it asserts portfolio facts.
4. Up to three follow-up Suggested Questions.

Answers are bounded plain text. The view may preserve line breaks, but the current contract contains no model-authored rich blocks, HTML, Markdown links, URLs, or executable actions.

### Evidence navigation

Evidence is resolved from stable IDs owned by Portfolio Knowledge:

- In Desktop Mode, following evidence opens or focuses its Desktop App and applies an optional semantic selection.
- In the mobile sheet stack, the destination is pushed so Back returns to Ask Jakub.
- Without desktop JavaScript, the same evidence has a canonical route/fragment fallback.
- Unknown, stale, or unauthorized evidence fails closed before it reaches the client visual registry; strict app lookup never substitutes a nearby destination.

### Language changes

A language change cancels active work and starts a fresh localized Conversation Session. Transcripts never contain mixed-language guide turns. Names, brands, and canonical technology terms remain unchanged.

### Closing and returning

Closing or minimizing the Desktop App does not discard the current session. Leaving Desktop Mode or refreshing does. A visible “Clear conversation” action resets it earlier.

When the full Desktop App is visible, the compact widget is hidden and inert so only one Ask composer is exposed. Minimizing or closing the App reveals the widget again and returns focus to the invoking widget control when appropriate.

No implicit persistence is introduced for convenience.

## Design It Twice comparison

This is the historical design exploration that produced the current Interface. Three independent interfaces were compared before WP-40/WP-50 froze the external seam.

### Design A — minimal stateless guide

```ts
type AskJakub = {
  ask(
    request: AskRequest,
    options?: { signal?: AbortSignal },
  ): Promise<AskReply>;
};
```

The request contains language, question, and bounded completed history. The reply contains answer kind, plain text, Evidence Links, and Suggested Questions.

- **Depth:** highest leverage per method; retrieval, grounding, localization, validation, evidence, and provider behavior sit behind one entry point.
- **Locality:** strong on the server and easy to test.
- **Seam placement:** browser-to-route is the external remote-owned seam; the provider port is internal.
- **Cost:** callers must build their own session lifecycle, and real token streaming would enlarge the contract.

### Design B — extensible command/state protocol

```ts
type AskCommand =
  | { type: "ask"; text: string }
  | { type: "choose-suggestion"; suggestionId: string }
  | { type: "follow"; itemId: EvidenceId | ActionId }
  | { type: "retry"; turnId: string }
  | { type: "reset"; language?: Lang; location?: PortfolioLocation };

type Conversation = {
  snapshot(): Snapshot;
  subscribe(listener: () => void): () => void;
  dispatch(
    command: AskCommand,
    options?: { signal?: AbortSignal },
  ): Promise<Outcome>;
};
```

It supports rich blocks, safe proposed actions, telemetry, multiple surfaces, and future tools through discriminated unions.

- **Depth:** high; many future behaviors share one command processor.
- **Locality:** excellent for effects and semantic navigation.
- **Seam placement:** conversation is external; transport, provider, telemetry, and navigation are internal seams.
- **Cost:** the public vocabulary and state machine are larger than this portfolio currently earns. Every new block/effect widens the testing and security surface.

### Design C — UI-first session facade

```ts
type AskJakubSession = AskState & {
  submit(question: string): SubmitResult;
  cancel(): void;
  retry(): void;
  followEvidence(link: EvidenceLink): void;
};

function useAskJakubSession(): AskJakubSession;
```

A provider above desktop windows/mobile sheets owns the ephemeral transcript and hides transport, cancellation, retry, validation, and navigation from the Desktop App.

- **Depth:** highest for the current caller; the view learns only state and four actions.
- **Locality:** session ordering and failure behavior live together.
- **Seam placement:** the React state/action join is the external seam; network seams remain internal.
- **Cost:** React coupling makes a future non-React caller require another Interface.

### Recommendation — C outside, A inside, one concept from B

Use the UI-first session facade as the only Desktop App Interface. Implement its remote turn with the minimal stateless request/reply operation. Adopt `PortfolioLocation` from the extensible design because Desktop Mode and Simple Mode are already two real navigation Adapters.

Do not launch generic commands, rich model-authored blocks, telemetry ports, or proposed effects. Add one only after a second real caller or behavior proves the seam.

This hybrid has:

- a trivial common caller;
- stateless server deployment;
- validated answers before display;
- provider replacement behind an internal seam;
- semantic Evidence Links without model-authored destinations;
- room to add true streaming or richer blocks without changing the Desktop App view.

## Recommended Interface

WP-50 froze this caller-facing shape. `features/ask-jakub/index.tsx` and `session-reducer.ts` are authoritative; this sample records the intended depth without exposing the internal wire or model ports.

```ts
import type { ReactNode } from "react";
import type { Lang } from "@/lib/lang";
import type { SuggestedQuestion } from "@/features/portfolio-knowledge";
import type {
  PortfolioLocation,
  PortfolioNavigator,
} from "@/features/portfolio-navigation";

export type EvidenceLink = Readonly<{
  id: `evidence:${string}`;
  label: string;
  location: PortfolioLocation;
  href: `/${string}`;
}>;

export type ConversationTurn = Readonly<{
  id: string;
  role: "portfolio-visitor" | "ask-jakub";
  text: string;
  delivery: "waiting" | "complete" | "cancelled" | "failed";
  answerKind: "answered" | "clarification" | "not-covered" | null;
  evidence: readonly EvidenceLink[];
}>;

export type AskProblemCode =
  | "empty-question"
  | "question-too-long"
  | "busy"
  | "offline"
  | "rate-limited"
  | "timeout"
  | "budget-disabled"
  | "unavailable"
  | "invalid-response";

export type AskProblem = Readonly<{
  code: AskProblemCode;
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
}>;

export type AskState = Readonly<{
  sessionId: string;
  language: Lang;
  phase: "ready" | "retrieving" | "composing" | "failed";
  transcript: readonly ConversationTurn[];
  suggestions: readonly SuggestedQuestion[];
  problem: AskProblem | null;
  canSubmit: boolean;
  canCancel: boolean;
  canRetry: boolean;
}>;

export type SubmitResult =
  | Readonly<{ accepted: true }>
  | Readonly<{ accepted: false; problem: AskProblem }>;

export type AskSession = AskState &
  Readonly<{
    submit(question: string): SubmitResult;
    cancel(): void;
    retry(): void;
    clear(): void;
    followEvidence(link: EvidenceLink): void;
  }>;

export function AskJakubProvider(props: {
  children: ReactNode;
  navigator?: PortfolioNavigator;
}): ReactNode;
export function useAskJakubSession(): AskSession;
```

### Interface invariants

- A session is created locally with no network call.
- Exactly one remote turn may be active.
- Input is trimmed and contains 1–600 Unicode characters.
- Accepted submission synchronously appends the visitor turn and waiting guide turn.
- Only completed turns enter future history; history is oldest-first and capped server-side.
- Cancel is idempotent, preserves the visitor question, removes unvalidated answer content, and enables retry.
- Retry reuses the most recent retryable question without duplicating its visitor turn.
- Late results are ignored by request generation/request ID.
- Completed answer text and evidence are immutable.
- Every portfolio-specific `answered` result has at least one valid Evidence Link.
- Evidence destinations are resolved from owned catalogs, never accepted as model-authored URLs.
- Expected user/operational failures become localized state; provider errors never throw through the UI seam.
- Provider prompts, output bodies, keys, stack traces, and internal error details never cross the route.

## Suggested implementation locality

```text
features/portfolio-navigation/
  app-catalog.ts             # typed identity, placement, size, scroll contract
  contract.ts                # server-safe Portfolio Location
  locations.ts               # owned location/evidence resolution
  navigator.ts               # Desktop and Simple Mode Adapters

features/portfolio-knowledge/
  catalog.ts                 # curated bilingual facts/evidence/suggestions
  retrieval.ts               # deterministic lexical retrieval
  sources.ts                 # nominated canonical source map
  validation.ts              # coverage, consistency and privacy checks

features/ask-jakub/
  index.tsx                  # ordinary React caller Interface
  contract.ts                # versioned browser/route contract and limits
  session-reducer.ts         # UI-facing state and lifecycle invariants
  client/
    provider.tsx             # internal composition root
    session-controller.ts
    transport-port.ts        # internal browser-to-route seam
    http-adapter.ts
    fake-adapter.ts
    scripted-adapter.ts
  server/
    answer.ts                # deep stateless answer operation
    request.ts
    prompt.ts
    output.ts
    deadline.ts
    model-port.ts            # internal true-external seam
    model-failures.ts
    provider-disabled-adapter.ts
    scripted-model-adapter.ts
    groq-model-adapter.ts       # optional bounded production provider Adapter
    configured-model.ts         # explicit fail-closed server composition

components/desktop/apps/
  AskJakubApp.tsx
app/api/ask-jakub/
  route.ts
```

Only `features/ask-jakub/index.tsx` is imported by ordinary React callers. Test code has a separate explicit testing entry point. Server implementation files carry `server-only`, depend on the server-safe knowledge/navigation contracts, and never import the client visual registry. Groq messages, model selection, strict schema, token controls, and credentials remain behind `AnswerModelPort`; no provider configuration enters the client Interface.

## Portfolio Knowledge

### Source hierarchy

1. `data/site.ts` for public identity, location, public profiles, and canonical person facts.
2. `data/experience.ts` for roles, periods, outcomes, and technologies.
3. `data/education.ts` for education and credentials.
4. `data/projects.ts`, `data/showcase.ts`, and `data/personal.ts` for project facts, with one nominated source for duplicated claims.
5. `data/cases.ts` only for claims not already canonical elsewhere.

`data/ui.ts`, visual labels, source comments, environment values, private notes, hidden phone data, and generated model answers are not Portfolio Knowledge.

### Knowledge Entry shape

```ts
type KnowledgeEntry = Readonly<{
  id: `knowledge:${string}`;
  topics: readonly AskTopic[];
  keywords: Readonly<{ pl: readonly string[]; en: readonly string[] }>;
  fact: L10n;
  evidence: readonly `evidence:${string}`[];
}>;
```

Knowledge builders should reference canonical data exports and add retrieval metadata. They should not paste a second narrative copy of the same fact.

### Build-time validation

Fail verification when:

- an ID is duplicated;
- either language is missing;
- an Evidence Link has no valid Portfolio Location/fallback;
- a Suggested Question maps to no Knowledge Entry;
- a volatile count disagrees with its source collection;
- two nominated sources assert contradictory current facts;
- hidden contact values or non-public fields enter the catalog.

### Retrieval

The initial corpus is small. Normalize case/diacritics, expand curated aliases, score topics/keywords, include closely related entries, and cap the selected facts. Measure fixture recall before adding embeddings.

Provider-disabled mode currently exposes the curated discovery surface and a localized unavailable result; it does not synthesize deterministic answers. Spotlight remains the provider-free path to the same Portfolio Knowledge and Evidence Links. A deterministic answer fallback is a future option, not current behavior.

## Owned-route contract

The browser sends a versioned, bounded request:

```ts
type AskRequest = Readonly<{
  version: 1;
  sessionId: string;
  requestId: string;
  language: Lang;
  question: string;
  history: readonly Readonly<{
    role: "portfolio-visitor" | "ask-jakub";
    text: string;
  }>[];
}>;
```

The route may stream lifecycle events so the UI can show progress and cancel promptly, but it buffers model text until validation:

```ts
type AskEvent =
  | { version: 1; requestId: string; type: "request.accepted" }
  | {
      version: 1;
      requestId: string;
      type: "phase.changed";
      phase: "retrieving" | "composing";
    }
  | {
      version: 1;
      requestId: string;
      type: "answer.completed";
      kind: "answered" | "clarification" | "not-covered";
      text: string;
      evidenceIds: readonly `evidence:${string}`[];
      suggestionIds: readonly `suggestion:${string}`[];
    }
  | {
      version: 1;
      requestId: string;
      type: "answer.failed";
      problem: AskProblem;
    };
```

Ordering is accepted, zero or more distinct phase changes, then exactly one terminal event. Nothing follows a terminal event. HTTP newline-delimited JSON over a POST supports body input, progressive phases, and `AbortSignal` without exposing provider protocol details.

Current implementation detail: the client consumes an `AsyncIterable` and the protocol permits lifecycle streaming, but the Next route awaits the answer operation, validates the complete lifecycle, serializes the bounded event array, and then returns the NDJSON response. It does not relay provider tokens or promise progressive network delivery. This may be deepened later without widening the Desktop App Interface.

Normal clarification and not-covered answers use `200`. Transport status mapping:

- `400` invalid shape/size/version;
- `413` body too large before full parsing;
- `429` rate limited with `Retry-After`;
- `503` provider or budget disabled;
- `504` bounded timeout.

All responses are `no-store`. The route validates `Content-Type`, request body bytes, question/history lengths, event shape, and allowed language before calling the model.

## Server answer operation

The deep implementation performs:

1. Validate and normalize request.
2. Bound completed history; treat it as untrusted visitor input, never knowledge.
3. Retrieve relevant Knowledge Entries deterministically.
4. Build a localized prompt containing only selected public facts and opaque evidence/suggestion IDs.
5. Ask the provider Adapter for one bounded structured result.
6. Validate kind, text type/length, evidence membership, scope, and suggestions.
7. Resolve owned IDs; remove duplicates and enforce limits.
8. Permit one structured-output repair attempt only when bounded by the same timeout/budget.
9. Return a safe not-covered answer or normalized failure; never leak raw provider output.

Internal provider port:

```ts
type ModelInput = Readonly<{
  language: Lang;
  question: string;
  history: readonly CompletedTurn[];
  knowledge: readonly Readonly<{ id: string; fact: string }>[];
  allowedSuggestionIds: readonly string[];
}>;

type ModelResult = Readonly<{
  kind: "answered" | "clarification" | "not-covered";
  text: string;
  knowledgeIds: readonly string[];
  suggestionIds: readonly string[];
}>;

type AnswerModelPort = {
  generate(
    input: ModelInput,
    options: { signal: AbortSignal },
  ): Promise<ModelResult>;
};
```

The provider-disabled and scripted model Adapters prove this true-external seam without a credential or network call. Each optional Groq Adapter `generate` call makes one bounded server-only HTTPS request with strict JSON Schema output, trusted `Retry-After` normalization, abort propagation, and a capped provider response. The answer operation still permits at most one repair call under the same deadline. Provider model names, messages, temperature, token controls, retry rules, and credentials remain inside that Adapter.

## Safety, privacy, and cost

### Current control status

| Control                                                                                          | Status                                                                                                                      |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Server-only model port and implementation boundary                                               | Implemented and covered by a client-import boundary test; Groq credentials come only from server environment configuration. |
| Request, history, selected-knowledge, answer, response, event, and identifier bounds             | Implemented in the shared contract and enforced at route/client boundaries.                                                 |
| Owned evidence/suggestions and plain-text answer validation                                      | Implemented; model-authored URLs, email addresses, HTML, Markdown destinations, and internal app IDs are rejected.          |
| Absolute operation deadline, abort propagation, stale-event rejection, one active client request | Implemented.                                                                                                                |
| Provider-disabled operation                                                                      | Implemented as the default and rollback path; Groq requires an explicit provider switch plus key.                           |
| Durable public rate limiting                                                                     | Conservative Groq project limits are part of setup; an app-owned distributed limiter remains pending.                       |
| Global daily/monthly spend circuit breaker                                                       | Free-plan/no-billing setup prevents model charges; an app-owned spend breaker would be required before a paid plan.         |
| Production model Adapter and provider evaluation                                                 | Groq Adapter implemented and mock-tested; live bilingual evaluation and staging proof remain pending.                       |
| AI operational telemetry and retention                                                           | Not implemented; fields, storage, retention, and consent remain explicit decisions.                                         |

The technical data flow, including existing non-AI site analytics and browser storage, is documented in [PRIVACY-DATA-FLOW.md](../PRIVACY-DATA-FLOW.md).

### Required controls

- Server-only provider credentials and imports.
- Request body, question, history, selected-knowledge, output, and response-byte caps.
- One active request per client session and an absolute server timeout.
- Durable rate limiting appropriate to the deployment, plus a global daily/monthly spend circuit breaker.
- A provider-disabled switch that keeps the portfolio and deterministic UI usable.
- Allowlisted evidence/suggestions and plain-text rendering.
- Prompt-injection fixtures, including instructions embedded in history.
- No raw visitor question, transcript, prompt, provider body, IP address, or hidden contact value in ordinary analytics.
- Redacted structured operational logs with request ID, outcome code, coarse topic, duration, selected knowledge IDs, and token/cost totals where available.
- Retention documented before any logging reaches production.

### Failure behavior

| Failure                          | Visitor experience                                                                               | Retry                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------ |
| Invalid local input              | Inline localized guidance; no transcript change.                                                 | After edit               |
| Offline                          | Keep question and show offline state.                                                            | Yes                      |
| Timeout/provider unavailable     | Preserve question; show concise unavailable state and direct Evidence Links/Suggested Questions. | Yes                      |
| Rate limited                     | Show localized wait time from trusted response metadata.                                         | After delay              |
| Budget disabled                  | Explain that the guide is temporarily offline; the rest of the portfolio remains available.      | No automatic loop        |
| Invalid provider output/evidence | Display no partial answer; return normalized invalid-response/not-covered state.                 | At most one manual retry |
| Abort/navigation/language change | Remove unvalidated output and ignore late events.                                                | Explicit retry           |

Retries never run automatically in the browser; hidden retry storms are unacceptable on a paid public endpoint.

## Accessibility requirements

- The transcript is a named log/region; individual questions and answers have semantic grouping.
- The compact widget is a named complementary region and yields from the accessibility tree while the full Desktop App is visible.
- Lifecycle status uses a restrained live region. Progressive visual reveal does not announce every character.
- Composer has a persistent label, description, character count near the limit, and keyboard submit behavior that does not trap multiline input.
- Sending moves neither focus nor scroll unexpectedly. New answers scroll only when the visitor was already near the transcript end.
- Cancel, retry, clear, copy, Suggested Questions, and Evidence Links are native controls with visible focus.
- Evidence navigation restores focus correctly when returning to Ask Jakub.
- Color is never the only state indicator; waiting/error states work in high contrast.
- Reduced motion removes progressive reveal and nonessential movement.
- The mobile sheet background is inert while open and its pinned composer is not hidden by the virtual keyboard/safe area.

## Verification matrix

The lists below are release acceptance criteria. Knowledge, route, session, and WP-60 UI Interface coverage exists in the working tree; fresh-browser and assistive-technology checks remain incomplete WP-90 work. Rate-limit and spend-breaker normalization fixtures do not prove durable production controls.

### Interface tests

- Empty/whitespace/over-limit input.
- Accepted submit ordering.
- One active request and busy rejection.
- Success, clarification, and not-covered results.
- Cancel before/after accepted and during each phase.
- Retry without duplicate visitor turn.
- Late result ignored after cancel/reset/language change.
- Evidence and suggestion deduplication/limits.
- Offline, timeout, rate limit, budget disabled, invalid event, and invalid evidence.
- Provider-disabled fake experience.

### Knowledge tests

- Every current role, education item, showcase project, personal project, public passion, and public contact surface has expected coverage.
- Polish and English retrieval fixtures reach the same semantic facts.
- Every curated Suggested Question retrieves at least one of its mapped facts in both languages.
- Aliases cover brand names, technologies, employer names, and common diacritic-free Polish input.
- Contradictory facts and volatile counts fail verification.
- Hidden phone/environment data cannot be serialized into knowledge.

### Route and Adapter tests

- Body/status/cache/header contract.
- Byte and character caps before provider invocation.
- Abort and timeout propagation.
- Provider auth/config remains server-only.
- Structured output validation and single repair bound.
- Rate-limit and spend-breaker paths.
- Deterministic mock fixtures shared with client tests.

### Browser tests

- Desktop widget mount makes no request; submit/result, failure/retry, cancellation, expansion, and focus return share the full App session.
- The widget remains clear of Desktop widgets/icons at representative widths and is absent below its 900 px roomy-desktop threshold.
- Desktop window open/minimize/close/reopen retains session.
- Mobile sheet opens, composer remains visible with keyboard, evidence pushes destination, Back returns to chat.
- Focus restoration, background inertness, keyboard-only completion, reduced motion, language reset, zoom, and narrow/wide layouts.
- Provider failure never blocks direct portfolio navigation.
- No model request on open or Suggested Question rendering; only submission calls the route.

## Launch checklist

All items remain release gates until a dated report supplies evidence. Provider-dependent checks remain pending until the setup wizard is completed with real external configuration and a Preview deployment.

- [ ] Proposed ADR is accepted or replaced after product decisions are made.
- [ ] Dependency audit policy passes with patched production dependencies.
- [ ] Portfolio Knowledge reviewed fact-by-fact in Polish and English.
- [ ] Provider key verified absent from client chunks and preview source maps.
- [ ] Rate limit and spend circuit breaker tested in a non-production environment.
- [ ] Provider-disabled state tested in production-like hosting.
- [ ] Prompt-injection, invalid evidence, cancellation, and late-event fixtures pass.
- [ ] Keyboard and screen-reader pass completed on desktop and mobile sheet.
- [ ] Privacy/retention wording matches actual telemetry.
- [ ] Answer-quality evaluation covers real visitor questions, abstentions, both languages, and evidence correctness.
- [ ] Build, test, lint, type, format, and production dependency checks pass.
- [ ] Rollback is one configuration change that disables model calls without removing the Desktop App.
