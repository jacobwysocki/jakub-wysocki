"use client";

import { useState } from "react";
import { motion, useDragControls } from "framer-motion";
import { ArrowUp, Maximize2, MessageCircleMore } from "lucide-react";
import {
  ASK_JAKUB_QUESTION_LIMIT,
  useAskJakubSession,
  type AskProblem,
} from "@/features/ask-jakub";
import { askJakubCopy } from "@/data/ask-jakub";
import { useLang } from "@/lib/lang-store";
import { useDesktop } from "./DesktopContext";
import { ASK_JAKUB_WIDGET_RIGHT, DESKTOP_LAYOUT } from "./desktop-layout";

export default function AskJakubWidget({
  areaRef,
  hidden,
  onRaise,
  zIndex,
}: {
  areaRef: React.RefObject<HTMLDivElement | null>;
  hidden: boolean;
  onRaise: () => void;
  zIndex: number;
}) {
  const dragControls = useDragControls();
  const desktop = useDesktop();
  const session = useAskJakubSession();
  const language = useLang();
  const [question, setQuestion] = useState("");
  const [submissionProblem, setSubmissionProblem] = useState<AskProblem | null>(
    null,
  );
  const latestGuideTurn = [...session.transcript]
    .reverse()
    .find((turn) => turn.role === "ask-jakub");
  const operationalProblem =
    latestGuideTurn?.delivery === "failed" ? session.problem : null;
  const questionLength = Array.from(question).length;
  const copy = <Key extends keyof typeof askJakubCopy>(key: Key) =>
    askJakubCopy[key][language];

  const submit = () => {
    const result = session.submit(question);
    if (result.accepted) {
      setQuestion("");
      setSubmissionProblem(null);
      return;
    }
    setSubmissionProblem(result.problem);
  };

  const status =
    session.phase === "retrieving"
      ? copy("retrieving")
      : session.phase === "composing"
        ? copy("composing")
        : null;

  return (
    <motion.aside
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={areaRef}
      aria-label={copy("widgetLabel")}
      aria-hidden={hidden || undefined}
      inert={hidden ? true : undefined}
      hidden={hidden}
      onContextMenu={(event) => event.stopPropagation()}
      onPointerDownCapture={onRaise}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        bottom: DESKTOP_LAYOUT.edgeInset,
        right: ASK_JAKUB_WIDGET_RIGHT,
        width: DESKTOP_LAYOUT.askJakubWidget.width,
        zIndex,
      }}
      className="absolute overflow-hidden rounded-[28px] border border-white/20 bg-black/30 p-4 text-white shadow-[0_22px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl max-[899px]:hidden"
    >
      <div
        onPointerDown={(event) => dragControls.start(event)}
        style={{ touchAction: "none" }}
        className="flex cursor-grab items-center gap-2 rounded-lg text-[9px] font-semibold uppercase tracking-[0.22em] text-white/45 active:cursor-grabbing"
      >
        <MessageCircleMore
          size={13}
          strokeWidth={1.9}
          className="text-[#FFB39A]"
          aria-hidden
        />
        <span>{copy("title")}</span>
        <span className="h-px flex-1 bg-white/15" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#30D158] shadow-[0_0_9px_rgba(48,209,88,0.8)]" />
      </div>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="mt-3 min-h-[58px] rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-2.5"
      >
        {status ? (
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[11px] font-medium text-white/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FFB39A]" />
              {status}
            </p>
            {session.canCancel && (
              <button
                type="button"
                onClick={session.cancel}
                className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-[9px] font-semibold text-white/75 transition-colors hover:bg-white/15 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              >
                {copy("cancel")}
              </button>
            )}
          </div>
        ) : operationalProblem ? (
          <div>
            <p className="text-[11px] leading-relaxed text-[#FFD0C0]">
              {operationalProblem.message}
            </p>
            {session.canRetry && (
              <button
                type="button"
                onClick={session.retry}
                className="mt-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-white/80 transition-colors hover:bg-white/15 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              >
                {copy("retry")}
              </button>
            )}
          </div>
        ) : latestGuideTurn?.delivery === "cancelled" ? (
          <div>
            <p className="text-[11px] leading-relaxed text-white/65">
              {copy("cancelled")}
            </p>
            {session.canRetry && (
              <button
                type="button"
                onClick={session.retry}
                className="mt-2 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-white/80 transition-colors hover:bg-white/15 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
              >
                {copy("retry")}
              </button>
            )}
          </div>
        ) : latestGuideTurn?.delivery === "complete" ? (
          <>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#FFB39A]">
              {copy("latestAnswer")}
            </p>
            <p className="mt-1 max-h-28 overflow-y-auto break-words pr-1 text-[11px] leading-relaxed text-white/75">
              {latestGuideTurn.text}
            </p>
          </>
        ) : (
          <p className="text-[11px] leading-relaxed text-white/65">
            {copy("widgetIntroduction")}
          </p>
        )}
      </div>

      <form
        className="mt-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor="ask-jakub-widget-question"
            className="text-[10px] font-semibold text-white/70"
          >
            {copy("composerLabel")}
          </label>
          <span className="font-mono text-[9px] tabular-nums text-white/40">
            {questionLength} / {ASK_JAKUB_QUESTION_LIMIT}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 p-1.5 focus-within:border-white/40 focus-within:ring-2 focus-within:ring-white/30">
          <input
            id="ask-jakub-widget-question"
            aria-describedby={`ask-jakub-widget-disclosure${
              submissionProblem ? " ask-jakub-widget-guidance" : ""
            }`}
            aria-invalid={submissionProblem ? true : undefined}
            value={question}
            onChange={(event) => {
              setQuestion(
                Array.from(event.currentTarget.value)
                  .slice(0, ASK_JAKUB_QUESTION_LIMIT)
                  .join(""),
              );
              setSubmissionProblem(null);
            }}
            placeholder={copy("composerPlaceholder")}
            className="h-9 min-w-0 flex-1 select-text bg-transparent px-2 text-[12px] text-white outline-hidden placeholder:text-white/35"
          />
          <button
            type="submit"
            disabled={!question.trim() || !session.canSubmit}
            aria-label={copy("ask")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-black transition-colors hover:bg-[#FFB39A] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25"
          >
            <ArrowUp size={16} strokeWidth={2} aria-hidden />
          </button>
        </div>
        {submissionProblem && (
          <p
            id="ask-jakub-widget-guidance"
            role="status"
            className="mt-2 text-[10px] font-medium leading-relaxed text-[#FFB39A]"
          >
            {submissionProblem.message}
          </p>
        )}
      </form>

      <p
        id="ask-jakub-widget-disclosure"
        className="mt-2 text-[9px] leading-relaxed text-white/40"
      >
        {copy("dataDisclosure")}
      </p>

      <button
        type="button"
        data-app-launcher="ask-jakub"
        onClick={() => desktop.openLocation({ area: "ask-jakub" })}
        className="mt-3 flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-[11px] font-semibold text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white"
      >
        {copy("openFullChat")}
        <Maximize2 size={14} strokeWidth={1.8} aria-hidden />
      </button>
    </motion.aside>
  );
}
