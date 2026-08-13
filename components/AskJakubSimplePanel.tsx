"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { askJakubCopy } from "@/data/ask-jakub";
import {
  ASK_JAKUB_QUESTION_LIMIT,
  AskJakubProvider,
  type AskProblem,
  useAskJakubSession,
} from "@/features/ask-jakub";
import {
  resolvePortfolioLocation,
  type PortfolioLocation,
  type PortfolioNavigator,
} from "@/features/portfolio-navigation";
import { useLang } from "@/lib/lang-store";
import { useMediaQuery } from "@/lib/useMediaQuery";

const MOBILE_QUERY = "(max-width: 899px)";

type AskJakubSimplePanelProps = Readonly<{
  id: string;
  open: boolean;
  onClose: () => void;
}>;

type SimpleViewNavigatorOptions = Readonly<{
  closePanel: () => void;
  reportUnavailable: () => void;
}>;

function simpleViewAnchorId(location: PortfolioLocation, href: string) {
  // Ask Jakub nie ma własnej sekcji w liniowym widoku. `#about` jest
  // technicznym fallbackiem bez JS, ale nie udajemy, że to ten sam cel.
  if (location.area === "ask-jakub") return undefined;
  return href.startsWith("/#") ? href.slice(2) : undefined;
}

function createSimpleViewNavigator({
  closePanel,
  reportUnavailable,
}: SimpleViewNavigatorOptions): PortfolioNavigator {
  return {
    open(location) {
      const resolved = resolvePortfolioLocation(location);
      const anchorId = resolved
        ? simpleViewAnchorId(location, resolved.href)
        : undefined;
      const destination = anchorId ? document.getElementById(anchorId) : null;

      if (!resolved || !destination) {
        reportUnavailable();
        return { opened: false, reason: "invalid-location" };
      }

      closePanel();
      // Następna klatka wypada po odmontowaniu modala. Na telefonie cleanup
      // zdąży wtedy zdjąć `inert` i `position: fixed` przed właściwym skokiem.
      window.requestAnimationFrame(() => {
        if (!destination.isConnected) return;
        window.history.pushState(null, "", resolved.href);
        destination.setAttribute("tabindex", "-1");
        destination.scrollIntoView({ block: "start" });
        destination.focus({ preventScroll: true });
      });

      return { opened: true, target: resolved };
    },
  };
}

/**
 * Provider pozostaje zamontowany po pierwszym otwarciu, więc zamknięcie
 * panelu nie kasuje sesji.
 */
export default function AskJakubSimplePanel({
  id,
  open,
  onClose,
}: AskJakubSimplePanelProps) {
  const [navigationUnavailable, setNavigationUnavailable] = useState(false);
  const closePanel = useCallback(() => {
    setNavigationUnavailable(false);
    onClose();
  }, [onClose]);
  const navigator = useMemo(
    () =>
      createSimpleViewNavigator({
        closePanel,
        reportUnavailable: () => setNavigationUnavailable(true),
      }),
    [closePanel],
  );

  return (
    <AskJakubProvider navigator={navigator}>
      {open ? (
        <PanelContent
          id={id}
          open={open}
          onClose={closePanel}
          portfolioNavigator={navigator}
          navigationUnavailable={navigationUnavailable}
        />
      ) : null}
    </AskJakubProvider>
  );
}

function RateLimitCountdown({
  retryAfterMs,
  prefix,
  second,
  seconds,
}: {
  retryAfterMs: number;
  prefix: string;
  second: string;
  seconds: string;
}) {
  const [deadline] = useState(() => Date.now() + retryAfterMs);
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((deadline - Date.now()) / 1_000)),
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    interval = setInterval(() => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1_000));
      setRemaining(next);
      if (next === 0 && interval !== undefined) {
        clearInterval(interval);
        interval = undefined;
      }
    }, 250);

    return () => {
      if (interval !== undefined) clearInterval(interval);
    };
  }, [deadline]);

  if (remaining === 0) return null;

  return (
    <p className="mt-2 font-semibold text-accent">
      {prefix} {remaining} {remaining === 1 ? second : seconds}.
    </p>
  );
}

function PanelContent({
  id,
  onClose,
  portfolioNavigator,
  navigationUnavailable,
}: AskJakubSimplePanelProps & {
  portfolioNavigator: PortfolioNavigator;
  navigationUnavailable: boolean;
}) {
  const language = useLang();
  const mobileModal = useMediaQuery(MOBILE_QUERY);
  const session = useAskJakubSession();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [question, setQuestion] = useState("");
  const [submissionProblem, setSubmissionProblem] = useState<AskProblem | null>(
    null,
  );
  const [copiedTurnId, setCopiedTurnId] = useState<string | null>(null);
  const questionLength = Array.from(question).length;
  const latestFailedTurnId = [...session.transcript]
    .reverse()
    .find(
      (turn) => turn.role === "ask-jakub" && turn.delivery === "failed",
    )?.id;
  const latestTurn = session.transcript.at(-1);
  const copy = <Key extends keyof typeof askJakubCopy>(key: Key) =>
    askJakubCopy[key][language];
  const composerProblem =
    submissionProblem?.code === "busy" ||
    submissionProblem?.code === "rate-limited"
      ? !session.canSubmit && session.problem?.code === submissionProblem.code
        ? submissionProblem
        : null
      : submissionProblem;
  const inputProblem =
    composerProblem?.code === "empty-question" ||
    composerProblem?.code === "question-too-long"
      ? composerProblem
      : null;
  const openLocation = (
    event: React.MouseEvent,
    location: PortfolioLocation,
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    portfolioNavigator.open(location);
  };

  useEffect(() => {
    closeRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };

    document.addEventListener("keydown", closeOnEscape, true);
    return () => document.removeEventListener("keydown", closeOnEscape, true);
  }, [onClose]);

  useLayoutEffect(() => {
    if (!mobileModal) return;

    const body = document.body;
    const simpleRoot =
      document.querySelector<HTMLElement>("[data-simple-root]");
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const previousBodyStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const rootWasInert = simpleRoot?.hasAttribute("inert") ?? false;

    // `position: fixed` zachowuje wizualną pozycję strony również na iOS,
    // gdzie samo `overflow: hidden` potrafi przeskoczyć na początek dokumentu.
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = `-${scrollX}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    simpleRoot?.setAttribute("inert", "");

    return () => {
      body.style.position = previousBodyStyle.position;
      body.style.top = previousBodyStyle.top;
      body.style.left = previousBodyStyle.left;
      body.style.width = previousBodyStyle.width;
      body.style.overflow = previousBodyStyle.overflow;
      if (simpleRoot && !rootWasInert) simpleRoot.removeAttribute("inert");
      window.scrollTo(scrollX, scrollY);
    };
  }, [mobileModal]);

  const submit = () => {
    const result = session.submit(question);
    if (result.accepted) {
      setQuestion("");
      setSubmissionProblem(null);
      return;
    }
    setSubmissionProblem(result.problem);
  };

  const submitSuggestion = (suggestion: string) => {
    const result = session.submit(suggestion);
    setSubmissionProblem(result.accepted ? null : result.problem);
  };

  const problemTitle = () => {
    switch (session.problem?.code) {
      case "offline":
        return copy("offlineTitle");
      case "unavailable":
        return copy("unavailableTitle");
      case "timeout":
        return copy("timeoutTitle");
      case "invalid-response":
        return copy("invalidTitle");
      case "rate-limited":
        return copy("rateLimitedTitle");
      case "budget-disabled":
        return copy("budgetTitle");
      default:
        return copy("recoveryTitle");
    }
  };

  const panel = (
    <section
      id={id}
      role="dialog"
      aria-modal={mobileModal ? true : undefined}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-identity`}
      data-ask-jakub-simple-panel
      data-lenis-prevent
      // Stały dolny prześwit mieści główne CTA sekcji Contact na szerokim
      // ekranie; mobilny modal blokuje dokument pod swoim backdropem.
      className="fixed right-4 top-20 z-40 flex h-[calc(100dvh-10rem)] max-h-[720px] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-card border border-line bg-surface text-ink shadow-lift max-[899px]:z-50 sm:right-6 sm:top-24 sm:h-[calc(100dvh-11rem)]"
    >
      <header className="shrink-0 border-b border-line/80 border-t-[3px] border-t-accent bg-white px-5 pb-4 pt-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              id={`${id}-identity`}
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted"
            >
              {copy("identity")}
            </p>
            <h2
              id={`${id}-title`}
              className="mt-1 text-[24px] font-semibold tracking-[-0.03em]"
            >
              {copy("title")}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-h-11 shrink-0 rounded-full border border-line px-3.5 text-[12px] font-semibold text-ink transition-colors hover:border-accent/50 hover:text-accent"
          >
            {copy("simpleClose")}
          </button>
        </div>
        {session.transcript.length > 0 && (
          <button
            type="button"
            onClick={() => {
              session.clear();
              setSubmissionProblem(null);
              setCopiedTurnId(null);
            }}
            className="mt-3 text-[11px] font-semibold text-muted underline decoration-line underline-offset-4 transition-colors hover:text-accent"
          >
            {copy("clear")}
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        {navigationUnavailable && (
          <p
            role="alert"
            className="sticky top-0 z-10 mb-4 border-l-2 border-accent bg-surface py-2 pl-3 text-[12px] font-medium leading-relaxed text-ink/70"
          >
            {copy("simpleNavigationUnavailable")}
          </p>
        )}
        {session.transcript.length === 0 ? (
          <div>
            <p className="text-[15px] leading-relaxed text-ink/75">
              {copy("introduction")}
            </p>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              {copy("dataDisclosure")}
            </p>
            <section
              aria-label={copy("suggestionsLabel")}
              className="mt-6 border-t border-line/80 pt-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                {copy("suggestionsLabel")}
              </p>
              <div className="mt-2 divide-y divide-line/70">
                {session.suggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() =>
                      submitSuggestion(suggestion.question[language])
                    }
                    className="group flex min-h-11 w-full items-start gap-3 py-3 text-left text-[13px] font-medium leading-snug text-ink transition-colors hover:text-accent"
                  >
                    <span className="font-mono text-[10px] text-accent">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1">
                      {suggestion.question[language]}
                    </span>
                    <span
                      aria-hidden
                      className="text-muted group-hover:text-accent"
                    >
                      ↗
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <>
            <ol
              role="log"
              aria-label={copy("conversation")}
              aria-live="off"
              className="border-b border-line/80"
            >
              {session.transcript.map((turn) => (
                <li key={turn.id} className="border-t border-line/80 py-4">
                  <article
                    aria-label={
                      turn.role === "portfolio-visitor"
                        ? copy("visitorTurn")
                        : copy("guideTurn")
                    }
                  >
                    <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted">
                      {turn.role === "portfolio-visitor"
                        ? copy("visitorTurn")
                        : copy("guideTurn")}
                    </p>

                    {turn.role === "portfolio-visitor" ? (
                      <p className="whitespace-pre-wrap text-[14px] font-medium leading-relaxed">
                        {turn.text}
                      </p>
                    ) : turn.delivery === "waiting" ? (
                      <div className="flex items-center justify-between gap-3">
                        <p
                          role="status"
                          aria-live="polite"
                          className="text-[13px] text-ink/65"
                        >
                          {session.phase === "composing"
                            ? copy("composing")
                            : copy("retrieving")}
                        </p>
                        {session.canCancel && (
                          <button
                            type="button"
                            onClick={session.cancel}
                            className="min-h-11 shrink-0 rounded-full border border-line px-3 text-[11px] font-semibold transition-colors hover:border-accent/50 hover:text-accent"
                          >
                            {copy("cancel")}
                          </button>
                        )}
                      </div>
                    ) : turn.delivery === "cancelled" ? (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-[13px] text-ink/65">
                          {copy("cancelled")}
                        </p>
                        {session.canRetry && (
                          <button
                            type="button"
                            onClick={session.retry}
                            className="min-h-11 rounded-full border border-line px-3 text-[11px] font-semibold transition-colors hover:border-accent/50 hover:text-accent"
                          >
                            {copy("retry")}
                          </button>
                        )}
                      </div>
                    ) : turn.delivery === "failed" &&
                      turn.id === latestFailedTurnId &&
                      session.problem ? (
                      <div role="alert" className="text-[13px]">
                        <p className="font-semibold">{problemTitle()}</p>
                        <p className="mt-1.5 leading-relaxed text-ink/65">
                          {session.problem.message}
                        </p>
                        {session.problem.code === "rate-limited" &&
                          session.problem.retryAfterMs !== undefined &&
                          !session.canRetry && (
                            <RateLimitCountdown
                              key={`${turn.id}:${session.problem.retryAfterMs}`}
                              retryAfterMs={session.problem.retryAfterMs}
                              prefix={copy("retryIn")}
                              second={copy("second")}
                              seconds={copy("seconds")}
                            />
                          )}
                        {session.canRetry && (
                          <button
                            type="button"
                            onClick={session.retry}
                            className="mt-3 min-h-11 rounded-full bg-ink px-4 text-[11px] font-semibold text-white transition-colors hover:bg-accent"
                          >
                            {copy("retry")}
                          </button>
                        )}
                        <div className="mt-4 border-t border-line/80 pt-3">
                          <p className="text-[11px] text-muted">
                            {copy("directPortfolio")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                            <Link
                              href="/#engineering"
                              onClick={(event) =>
                                openLocation(event, { area: "experience" })
                              }
                              className="text-[11px] font-semibold text-ink underline decoration-line underline-offset-4 hover:text-accent"
                            >
                              {copy("viewExperience")}
                            </Link>
                            <Link
                              href="/#contact"
                              onClick={(event) =>
                                openLocation(event, { area: "contact" })
                              }
                              className="text-[11px] font-semibold text-ink underline decoration-line underline-offset-4 hover:text-accent"
                            >
                              {copy("contactJakub")}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ) : turn.delivery === "failed" ? (
                      <p className="text-[13px] text-ink/55">
                        {copy("historicalFailure")}
                      </p>
                    ) : (
                      <div>
                        {turn.id === latestTurn?.id && (
                          <p role="status" className="sr-only">
                            {copy("answerReady")}
                          </p>
                        )}
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-accent">
                            {turn.answerKind === "clarification"
                              ? copy("clarification")
                              : turn.answerKind === "not-covered"
                                ? copy("notCovered")
                                : copy("answered")}
                          </p>
                          <button
                            type="button"
                            aria-label={copy("copyAnswer")}
                            onClick={() => {
                              const clipboard = navigator.clipboard;
                              if (!clipboard) return;
                              void clipboard.writeText(turn.text).then(
                                () => setCopiedTurnId(turn.id),
                                () =>
                                  setCopiedTurnId((current) =>
                                    current === turn.id ? null : current,
                                  ),
                              );
                            }}
                            className="min-h-11 px-1 text-[10px] font-semibold text-muted underline decoration-line underline-offset-4 transition-colors hover:text-accent"
                          >
                            {copiedTurnId === turn.id
                              ? copy("copied")
                              : copy("copyAnswer")}
                          </button>
                        </div>
                        <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
                          {turn.text}
                        </p>
                        {turn.evidence.length > 0 && (
                          <section
                            aria-label={copy("evidence")}
                            className="mt-4 border-t border-line/70 pt-3"
                          >
                            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                              {copy("evidence")}
                            </p>
                            <ul className="mt-2 divide-y divide-line/60">
                              {turn.evidence.map((link) => (
                                <li key={link.id}>
                                  <a
                                    href={link.href}
                                    onClick={(event) => {
                                      if (
                                        event.button !== 0 ||
                                        event.metaKey ||
                                        event.ctrlKey ||
                                        event.shiftKey ||
                                        event.altKey
                                      ) {
                                        return;
                                      }
                                      event.preventDefault();
                                      session.followEvidence(link);
                                    }}
                                    className="group flex min-h-11 items-center justify-between gap-3 py-2 text-[12px] font-semibold text-ink transition-colors hover:text-accent"
                                  >
                                    {link.label}
                                    <span
                                      aria-hidden
                                      className="text-muted group-hover:text-accent"
                                    >
                                      ↗
                                    </span>
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ol>

            {session.phase === "ready" && session.suggestions.length > 0 && (
              <section aria-label={copy("followUps")} className="mt-5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                  {copy("followUps")}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {session.suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() =>
                        submitSuggestion(suggestion.question[language])
                      }
                      className="min-h-11 rounded-full border border-line bg-white px-3 py-2 text-left text-[11px] font-semibold leading-snug text-ink transition-colors hover:border-accent/50 hover:text-accent"
                    >
                      {suggestion.question[language]}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <form
        className="shrink-0 border-t border-line/80 bg-white px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label
            htmlFor={`${id}-question`}
            className="text-[11px] font-semibold text-ink/75"
          >
            {copy("composerLabel")}
          </label>
          <span
            aria-label={copy("characterCount")}
            className={`font-mono text-[10px] tabular-nums ${
              questionLength >= ASK_JAKUB_QUESTION_LIMIT
                ? "font-bold text-accent"
                : "text-muted"
            }`}
          >
            {questionLength} / {ASK_JAKUB_QUESTION_LIMIT}
          </span>
        </div>
        <p id={`${id}-composer-description`} className="sr-only">
          {copy("composerDescription")}
        </p>
        <div className="flex items-end gap-2 border-y border-line py-2 focus-within:border-accent">
          <textarea
            id={`${id}-question`}
            aria-describedby={`${id}-composer-description ${id}-disclosure${
              composerProblem ? ` ${id}-guidance` : ""
            }`}
            aria-errormessage={inputProblem ? `${id}-guidance` : undefined}
            aria-invalid={inputProblem ? true : undefined}
            rows={1}
            value={question}
            placeholder={copy("composerPlaceholder")}
            onChange={(event) => {
              setQuestion(
                Array.from(event.currentTarget.value)
                  .slice(0, ASK_JAKUB_QUESTION_LIMIT)
                  .join(""),
              );
              setSubmissionProblem(null);
            }}
            onKeyDown={(event) => {
              if (
                event.key !== "Enter" ||
                event.shiftKey ||
                event.nativeEvent.isComposing
              ) {
                return;
              }
              event.preventDefault();
              submit();
            }}
            className="max-h-28 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-1 py-2.5 text-[14px] leading-5 text-ink outline-none placeholder:text-muted/70"
          />
          <button
            type="submit"
            disabled={!question.trim() || !session.canSubmit}
            className="min-h-11 shrink-0 rounded-full bg-ink px-4 text-[12px] font-semibold text-white transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30"
          >
            {copy("ask")}
          </button>
        </div>
        {composerProblem && (
          <p
            id={`${id}-guidance`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="mt-2 text-[11px] font-medium leading-relaxed text-accent"
          >
            {composerProblem.message}
          </p>
        )}
        <p
          id={`${id}-disclosure`}
          className="mt-2 text-[9px] leading-relaxed text-muted"
        >
          {copy("dataDisclosure")}
        </p>
      </form>
    </section>
  );

  if (!mobileModal) return panel;

  return createPortal(
    <>
      <div
        aria-hidden
        data-ask-jakub-backdrop
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]"
      />
      {panel}
    </>,
    document.body,
  );
}
