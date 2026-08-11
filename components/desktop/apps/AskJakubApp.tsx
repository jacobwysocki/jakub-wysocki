"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotionConfig } from "framer-motion";
import {
  ArrowUp,
  ArrowUpRight,
  Check,
  Compass,
  Copy,
  RotateCcw,
  X,
} from "lucide-react";
import {
  ASK_JAKUB_QUESTION_LIMIT,
  type AskProblem,
  useAskJakubSession,
} from "@/features/ask-jakub";
import { askJakubCopy } from "@/data/ask-jakub";
import { useLang } from "@/lib/lang-store";
import { useDesktop } from "../DesktopContext";

function ProgressiveAnswer({ text }: { text: string }) {
  const reducedMotion = useReducedMotionConfig();
  const characters = Array.from(text);
  const [visibleCharacters, setVisibleCharacters] = useState(() =>
    reducedMotion ? characters.length : 0,
  );

  useEffect(() => {
    if (reducedMotion) return;
    const step = Math.max(1, Math.ceil(characters.length / 48));
    const interval = window.setInterval(() => {
      setVisibleCharacters((current) => {
        const next = Math.min(characters.length, current + step);
        if (next === characters.length) window.clearInterval(interval);
        return next;
      });
    }, 18);
    return () => window.clearInterval(interval);
  }, [characters.length, reducedMotion]);

  return (
    <p className="relative whitespace-pre-wrap text-[14px] leading-relaxed">
      <span
        aria-hidden="true"
        data-testid="ask-answer-layout"
        data-ask-answer-layout
        className="invisible block"
      >
        {text}
      </span>
      <span
        aria-hidden="true"
        data-testid="ask-answer-visual"
        data-ask-answer-visual
        className="absolute inset-0 block"
      >
        {reducedMotion ? text : characters.slice(0, visibleCharacters).join("")}
      </span>
      <span className="sr-only" data-ask-answer-screen-reader>
        {text}
      </span>
    </p>
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
    Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
  );

  useEffect(() => {
    let interval: number | undefined;
    const update = () => {
      const next = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0 && interval !== undefined) {
        window.clearInterval(interval);
        interval = undefined;
      }
    };
    interval = window.setInterval(update, 250);
    return () => {
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [deadline]);

  if (remaining === 0) return null;
  return (
    <p className="mt-2 font-semibold text-accent">
      {prefix} {remaining} {remaining === 1 ? second : seconds}.
    </p>
  );
}

export default function AskJakubApp() {
  const language = useLang();
  const desktop = useDesktop();
  const session = useAskJakubSession();
  const transcriptRef = useRef<HTMLDivElement>(null);
  const nearTranscriptEndRef = useRef(true);
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
  const latestCompletedGuideTurnId =
    session.phase === "ready" &&
    latestTurn?.role === "ask-jakub" &&
    latestTurn.delivery === "complete"
      ? latestTurn.id
      : undefined;
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

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (!transcript || !nearTranscriptEndRef.current) return;

    if (typeof transcript.scrollTo === "function") {
      transcript.scrollTo({ top: transcript.scrollHeight, behavior: "auto" });
    } else {
      transcript.scrollTop = transcript.scrollHeight;
    }
  }, [session.transcript]);

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

  return (
    <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f5f1] text-ink">
      <header className="relative shrink-0 overflow-hidden border-b border-black/10 bg-[#222225] px-5 py-4 text-white">
        <div
          aria-hidden
          className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-accent-bright/25 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#ffb39a]">
            <Compass size={19} strokeWidth={1.8} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">
              {copy("identity")}
            </p>
            <h1 className="mt-0.5 text-[20px] font-semibold tracking-[-0.025em]">
              {copy("title")}
            </h1>
          </div>
          {session.transcript.length > 0 && (
            <button
              type="button"
              onClick={() => {
                session.clear();
                setSubmissionProblem(null);
              }}
              className="ml-auto min-h-11 rounded-xl border border-white/15 bg-white/10 px-3 text-[11px] font-semibold text-white/80 transition-colors hover:bg-white/20"
            >
              {copy("clear")}
            </button>
          )}
        </div>
      </header>

      <div
        ref={transcriptRef}
        data-ask-transcript
        data-scroll-owner="transcript"
        onScroll={(event) => {
          const transcript = event.currentTarget;
          nearTranscriptEndRef.current =
            transcript.scrollHeight -
              transcript.scrollTop -
              transcript.clientHeight <=
            96;
        }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5"
      >
        <div
          className={`mx-auto flex min-h-full w-full max-w-[620px] flex-col ${
            session.transcript.length === 0 ? "justify-center" : "justify-end"
          }`}
        >
          {session.transcript.length === 0 ? (
            <div className="rounded-[24px] border border-black/10 bg-white/70 p-5 shadow-[0_16px_50px_rgba(42,35,29,0.06)]">
              <p className="max-w-[52ch] text-[15px] leading-relaxed text-ink/75">
                {copy("introduction")}
              </p>
              <p className="mt-3 max-w-[68ch] text-[11px] leading-relaxed text-muted">
                {copy("dataDisclosure")}
              </p>
              <div className="mt-5 border-t border-black/10 pt-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  {copy("suggestionsLabel")}
                </p>
                <div className="grid gap-2">
                  {session.suggestions.slice(0, 4).map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() =>
                        submitSuggestion(suggestion.question[language])
                      }
                      className="group flex min-h-11 items-start gap-3 rounded-2xl border border-black/10 bg-[#faf9f6] px-3.5 py-3 text-left text-[13px] font-medium leading-snug text-ink transition-colors hover:border-accent/40 hover:bg-white"
                    >
                      <span className="mt-0.5 font-mono text-[10px] text-accent">
                        0{index + 1}
                      </span>
                      <span>{suggestion.question[language]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ol
              role="log"
              aria-label={copy("conversation")}
              aria-live="off"
              className="grid w-full gap-4 py-1"
            >
              {session.transcript.map((turn) => (
                <li
                  key={turn.id}
                  className={
                    turn.role === "portfolio-visitor" ? "pl-8" : "pr-8"
                  }
                >
                  <article
                    aria-label={
                      turn.role === "portfolio-visitor"
                        ? copy("visitorTurn")
                        : copy("guideTurn")
                    }
                    className={`rounded-[20px] border px-4 py-3.5 shadow-[0_10px_30px_rgba(42,35,29,0.05)] ${
                      turn.role === "portfolio-visitor"
                        ? "ml-auto border-ink bg-ink text-white"
                        : "border-black/10 bg-white text-ink"
                    }`}
                  >
                    {turn.delivery === "waiting" ? (
                      <div className="flex items-center justify-between gap-3">
                        <p
                          role="status"
                          aria-live="polite"
                          className="flex items-center gap-2 text-[13px] font-medium text-ink/70"
                        >
                          <span
                            aria-hidden
                            className="h-2 w-2 animate-pulse rounded-full bg-accent"
                          />
                          {session.phase === "composing"
                            ? copy("composing")
                            : copy("retrieving")}
                        </p>
                        {session.canCancel && (
                          <button
                            type="button"
                            onClick={session.cancel}
                            aria-label={copy("cancel")}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/10 text-muted transition-colors hover:bg-black/5 hover:text-ink"
                          >
                            <X size={16} aria-hidden />
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
                            className="flex min-h-11 items-center gap-2 rounded-xl border border-black/10 px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-black/5"
                          >
                            <RotateCcw size={14} aria-hidden />
                            {copy("retry")}
                          </button>
                        )}
                      </div>
                    ) : turn.delivery === "failed" &&
                      turn.id === latestFailedTurnId &&
                      session.problem ? (
                      <div role="alert" className="text-[13px]">
                        <p className="font-semibold text-ink">
                          {problemTitle()}
                        </p>
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
                        <div className="mt-4 flex flex-wrap gap-2">
                          {session.canRetry && (
                            <button
                              type="button"
                              onClick={session.retry}
                              className="flex min-h-11 items-center gap-2 rounded-xl bg-ink px-3.5 text-[12px] font-semibold text-white transition-colors hover:bg-accent"
                            >
                              <RotateCcw size={14} aria-hidden />
                              {copy("retry")}
                            </button>
                          )}
                        </div>
                        <div className="mt-4 border-t border-black/10 pt-3">
                          <p className="mb-2 text-[11px] text-ink/55">
                            {copy("directPortfolio")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(
                              [
                                {
                                  label: copy("viewExperience"),
                                  href: "/#engineering" as const,
                                  location: { area: "experience" } as const,
                                },
                                {
                                  label: copy("contactJakub"),
                                  href: "/#contact" as const,
                                  location: { area: "contact" } as const,
                                },
                              ] as const
                            ).map((destination) => (
                              <a
                                key={destination.href}
                                href={destination.href}
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
                                  const outcome = desktop.openLocation(
                                    destination.location,
                                  );
                                  if (outcome.opened) event.preventDefault();
                                }}
                                className="flex min-h-11 items-center gap-1.5 rounded-xl border border-black/10 bg-[#faf9f6] px-3 text-[11px] font-semibold text-ink transition-colors hover:border-accent/35 hover:text-accent"
                              >
                                {destination.label}
                                <ArrowUpRight size={14} aria-hidden />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : turn.delivery === "failed" ? (
                      <p aria-live="off" className="text-[13px] text-ink/55">
                        {copy("historicalFailure")}
                      </p>
                    ) : turn.role === "ask-jakub" &&
                      turn.delivery === "complete" ? (
                      <div>
                        {turn.id === latestCompletedGuideTurnId && (
                          <p role="status" className="sr-only">
                            {copy("answerReady")}
                          </p>
                        )}
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-accent">
                            {turn.answerKind === "clarification"
                              ? copy("clarification")
                              : turn.answerKind === "not-covered"
                                ? copy("notCovered")
                                : copy("answered")}
                          </span>
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
                            className="flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-[11px] font-semibold text-muted transition-colors hover:bg-black/5 hover:text-ink"
                          >
                            {copiedTurnId === turn.id ? (
                              <Check size={14} aria-hidden />
                            ) : (
                              <Copy size={14} aria-hidden />
                            )}
                            {copiedTurnId === turn.id
                              ? copy("copied")
                              : copy("copyAnswer")}
                          </button>
                        </div>
                        <ProgressiveAnswer text={turn.text} />
                        {turn.evidence.length > 0 && (
                          <div className="mt-4 border-t border-black/10 pt-3">
                            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                              {copy("evidence")}
                            </p>
                            <div className="grid gap-2">
                              {turn.evidence.map((link) => (
                                <a
                                  key={link.id}
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
                                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-black/10 bg-[#faf9f6] px-3 text-[12px] font-semibold text-ink transition-colors hover:border-accent/35 hover:text-accent"
                                >
                                  <span>{link.label}</span>
                                  <ArrowUpRight
                                    size={15}
                                    className="shrink-0"
                                    aria-hidden
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-[14px] leading-relaxed">
                        {turn.text}
                      </p>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          )}
          {session.transcript.length > 0 &&
            session.phase === "ready" &&
            session.suggestions.length > 0 && (
              <section
                aria-label={copy("followUps")}
                className="mt-5 w-full border-t border-black/10 pt-4"
              >
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                  {copy("followUps")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {session.suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() =>
                        submitSuggestion(suggestion.question[language])
                      }
                      className="min-h-11 rounded-xl border border-black/10 bg-white px-3 py-2 text-left text-[11px] font-semibold leading-snug text-ink transition-colors hover:border-accent/40 hover:text-accent"
                    >
                      {suggestion.question[language]}
                    </button>
                  ))}
                </div>
              </section>
            )}
        </div>
      </div>

      <form
        data-ask-composer
        className="shrink-0 border-t border-black/10 bg-[#fbfaf7]/95 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 backdrop-blur-xl"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="mx-auto max-w-[620px]">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label
              htmlFor="ask-jakub-question"
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
          <p id="ask-jakub-description" className="sr-only">
            {copy("composerDescription")}
          </p>
          <div className="flex items-end gap-2 rounded-[20px] border border-black/15 bg-white p-2 shadow-[0_8px_30px_rgba(42,35,29,0.06)] focus-within:border-accent/60 focus-within:ring-2 focus-within:ring-accent/10">
            <textarea
              id="ask-jakub-question"
              aria-describedby={`ask-jakub-description${
                composerProblem ? " ask-jakub-guidance" : ""
              }`}
              aria-errormessage={
                inputProblem ? "ask-jakub-guidance" : undefined
              }
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
              className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-[14px] leading-5 text-ink outline-none placeholder:text-muted/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            />
            <button
              type="submit"
              disabled={!question.trim() || !session.canSubmit}
              aria-label={copy("ask")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-white transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30"
            >
              <ArrowUp size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
          {composerProblem && (
            <p
              id="ask-jakub-guidance"
              data-ask-composer-guidance
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="mt-2 text-[12px] font-medium leading-relaxed text-accent"
            >
              {composerProblem.message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
