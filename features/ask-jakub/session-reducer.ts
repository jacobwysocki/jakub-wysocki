import type { SuggestedQuestion } from "@/features/portfolio-knowledge";
import type { PortfolioLocation } from "@/features/portfolio-navigation";
import type { Lang } from "@/lib/lang";
import type { AskProblem } from "./contract";

export type EvidenceLink = Readonly<{
  id: `evidence:${string}`;
  label: string;
  location: PortfolioLocation;
  href: `/${string}`;
}>;

export type AskAnswerKind = "answered" | "clarification" | "not-covered";

export type ConversationTurn = Readonly<{
  id: string;
  role: "portfolio-visitor" | "ask-jakub";
  text: string;
  delivery: "waiting" | "complete" | "cancelled" | "failed";
  answerKind: AskAnswerKind | null;
  evidence: readonly EvidenceLink[];
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

export type ActiveRequest = Readonly<{
  requestId: string;
  generation: number;
  question: string;
  visitorTurnId: string;
  guideTurnId: string;
  invalidResponseRetries: number;
}>;

export type RetryTarget = Readonly<{
  question: string;
  visitorTurnId: string;
  guideTurnId: string;
  invalidResponseRetries: number;
}>;

export type AskSessionState = AskState &
  Readonly<{
    active: ActiveRequest | null;
    generation: number;
    retryTarget: RetryTarget | null;
  }>;

export type AskSessionAction =
  | Readonly<{ type: "submission.rejected"; problem: AskProblem }>
  | Readonly<{
      type: "submission.accepted";
      request: ActiveRequest;
      visitorTurn: ConversationTurn;
      guideTurn: ConversationTurn;
    }>
  | Readonly<{
      type: "phase.changed";
      requestId: string;
      phase: "retrieving" | "composing";
    }>
  | Readonly<{
      type: "answer.completed";
      requestId: string;
      guideTurnId: string;
      kind: AskAnswerKind;
      text: string;
      evidence: readonly EvidenceLink[];
      suggestions: readonly SuggestedQuestion[];
    }>
  | Readonly<{ type: "request.cancelled"; requestId: string }>
  | Readonly<{
      type: "retry.started";
      request: ActiveRequest;
    }>
  | Readonly<{
      type: "session.cleared";
      sessionId: string;
      suggestions: readonly SuggestedQuestion[];
    }>
  | Readonly<{
      type: "answer.failed";
      requestId: string;
      problem: AskProblem;
    }>
  | Readonly<{ type: "retry.available" }>;

export function createInitialAskSessionState(input: {
  sessionId: string;
  language: Lang;
  suggestions: readonly SuggestedQuestion[];
}): AskSessionState {
  return {
    sessionId: input.sessionId,
    language: input.language,
    phase: "ready",
    transcript: [],
    suggestions: input.suggestions,
    problem: null,
    canSubmit: true,
    canCancel: false,
    canRetry: false,
    active: null,
    generation: 0,
    retryTarget: null,
  };
}

export function reduceAskSession(
  state: AskSessionState,
  action: AskSessionAction,
): AskSessionState {
  switch (action.type) {
    case "submission.rejected":
      return { ...state, problem: action.problem };

    case "submission.accepted":
      return {
        ...state,
        phase: "retrieving",
        transcript: [...state.transcript, action.visitorTurn, action.guideTurn],
        problem: null,
        canSubmit: false,
        canCancel: true,
        canRetry: false,
        active: action.request,
        generation: action.request.generation,
        retryTarget: null,
      };

    case "phase.changed":
      if (state.active?.requestId !== action.requestId) return state;
      return { ...state, phase: action.phase };

    case "answer.completed":
      if (
        state.active?.requestId !== action.requestId ||
        state.active.guideTurnId !== action.guideTurnId
      ) {
        return state;
      }
      return {
        ...state,
        phase: "ready",
        transcript: state.transcript.map((turn) =>
          turn.id === action.guideTurnId && turn.delivery === "waiting"
            ? {
                ...turn,
                text: action.text,
                delivery: "complete" as const,
                answerKind: action.kind,
                evidence: action.evidence,
              }
            : turn,
        ),
        suggestions: action.suggestions,
        problem: null,
        canSubmit: true,
        canCancel: false,
        canRetry: false,
        active: null,
        retryTarget: null,
      };

    case "request.cancelled": {
      if (state.active?.requestId !== action.requestId) return state;
      const active = state.active;
      return {
        ...state,
        phase: "ready",
        transcript: state.transcript.map((turn) =>
          turn.id === active.guideTurnId && turn.delivery === "waiting"
            ? {
                ...turn,
                text: "",
                delivery: "cancelled" as const,
                answerKind: null,
                evidence: [],
              }
            : turn,
        ),
        problem: null,
        canSubmit: true,
        canCancel: false,
        canRetry: true,
        active: null,
        generation: state.generation + 1,
        retryTarget: {
          question: active.question,
          visitorTurnId: active.visitorTurnId,
          guideTurnId: active.guideTurnId,
          invalidResponseRetries: active.invalidResponseRetries,
        },
      };
    }

    case "retry.started":
      if (state.active || !state.retryTarget) return state;
      return {
        ...state,
        phase: "retrieving",
        transcript: state.transcript.map((turn) =>
          turn.id === state.retryTarget?.guideTurnId
            ? {
                ...turn,
                text: "",
                delivery: "waiting" as const,
                answerKind: null,
                evidence: [],
              }
            : turn,
        ),
        problem: null,
        canSubmit: false,
        canCancel: true,
        canRetry: false,
        active: action.request,
        generation: action.request.generation,
        retryTarget: null,
      };

    case "session.cleared":
      return {
        ...createInitialAskSessionState({
          sessionId: action.sessionId,
          language: state.language,
          suggestions: action.suggestions,
        }),
        generation: state.generation + 1,
      };

    case "answer.failed": {
      if (state.active?.requestId !== action.requestId) return state;
      const active = state.active;
      const invalidResponseRetries =
        active.invalidResponseRetries +
        (action.problem.code === "invalid-response" ? 1 : 0);
      const retryAllowedByFailure =
        action.problem.retryable &&
        !(
          action.problem.code === "invalid-response" &&
          invalidResponseRetries > 1
        ) &&
        !(
          action.problem.code === "rate-limited" &&
          action.problem.retryAfterMs === undefined
        );
      const canRetry =
        retryAllowedByFailure && action.problem.code !== "rate-limited";
      const problem =
        action.problem.retryable && !retryAllowedByFailure
          ? { ...action.problem, retryable: false }
          : action.problem;
      return {
        ...state,
        phase: "failed",
        transcript: state.transcript.map((turn) =>
          turn.id === active.guideTurnId
            ? {
                ...turn,
                text: "",
                delivery: "failed" as const,
                answerKind: null,
                evidence: [],
              }
            : turn,
        ),
        problem,
        canSubmit: action.problem.code !== "rate-limited",
        canCancel: false,
        canRetry,
        active: null,
        retryTarget: retryAllowedByFailure
          ? {
              question: active.question,
              visitorTurnId: active.visitorTurnId,
              guideTurnId: active.guideTurnId,
              invalidResponseRetries,
            }
          : null,
      };
    }

    case "retry.available":
      if (
        state.active ||
        !state.retryTarget ||
        state.problem?.code !== "rate-limited" ||
        !state.problem.retryable
      ) {
        return state;
      }
      return { ...state, canSubmit: true, canRetry: true };
  }
}
