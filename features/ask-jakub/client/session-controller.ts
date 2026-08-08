import {
  findEvidence,
  findSuggestedQuestion,
  type SuggestedQuestion,
} from "@/features/portfolio-knowledge";
import type { PortfolioNavigator } from "@/features/portfolio-navigation";
import type { Lang } from "@/lib/lang";
import {
  ASK_LIMITS,
  ASK_PROTOCOL_VERSION,
  type AskProblem,
  type AskRequest,
  type CompletedTurn,
} from "../contract";
import {
  createInitialAskSessionState,
  reduceAskSession,
  type AskSessionState,
  type AskAnswerKind,
  type ConversationTurn,
  type EvidenceLink,
  type SubmitResult,
} from "../session-reducer";
import type { AskTransport } from "./transport-port";
import {
  AskTransportFailure,
  parseAskEvent,
  type AskTransportProblemCode,
} from "./transport-port";

type Listener = () => void;

type PendingTerminal =
  | Readonly<{
      type: "completed";
      guideTurnId: string;
      kind: AskAnswerKind;
      text: string;
      evidence: readonly EvidenceLink[];
      suggestions: readonly SuggestedQuestion[];
    }>
  | Readonly<{
      type: "failed";
      code: AskTransportProblemCode;
      retryAfterMs?: number;
    }>;

const characterCount = (value: string) => Array.from(value).length;

function localProblem(
  code: "empty-question" | "question-too-long" | "busy",
  language: Lang,
): AskProblem {
  const messages = {
    pl: {
      "empty-question": "Wpisz pytanie o portfolio Jakuba.",
      "question-too-long": "Pytanie może mieć maksymalnie 600 znaków.",
      busy: "Najpierw poczekaj na odpowiedź albo anuluj pytanie.",
    },
    en: {
      "empty-question": "Enter a question about Jakub's portfolio.",
      "question-too-long": "Keep the question to 600 characters or fewer.",
      busy: "Wait for the current answer or cancel it first.",
    },
  } as const;
  return { code, message: messages[language][code], retryable: false };
}

function operationalProblem(
  code: AskTransportProblemCode,
  language: Lang,
  retryAfterMs?: number,
): AskProblem {
  const messages = {
    pl: {
      offline: "Brak połączenia. Sprawdź internet i spróbuj ponownie.",
      "rate-limited":
        "Limit pytań został osiągnięty. Spróbuj ponownie później.",
      timeout: "Odpowiedź trwała zbyt długo. Spróbuj ponownie.",
      "budget-disabled":
        "Przewodnik jest tymczasowo offline. Portfolio nadal jest dostępne.",
      unavailable:
        "Ask Jakub jest teraz niedostępny. Zamiast tego przejrzyj sugerowane pytania o portfolio.",
      "invalid-response":
        "Nie udało się zweryfikować odpowiedzi. Spróbuj ponownie.",
    },
    en: {
      offline: "You appear to be offline. Check your connection and try again.",
      "rate-limited":
        "The question limit has been reached. Please try again later.",
      timeout: "The answer took too long. Please try again.",
      "budget-disabled":
        "The guide is temporarily offline. The rest of the portfolio remains available.",
      unavailable:
        "Ask Jakub is currently unavailable. Explore the suggested portfolio questions instead.",
      "invalid-response": "The answer could not be verified. Please try again.",
    },
  } as const;
  const retryable = code !== "budget-disabled";
  const safeRetryAfter =
    code === "rate-limited" &&
    retryAfterMs !== undefined &&
    Number.isFinite(retryAfterMs)
      ? Math.max(1_000, Math.min(Math.ceil(retryAfterMs), 3_600_000))
      : undefined;
  return {
    code,
    message: messages[language][code],
    retryable,
    ...(safeRetryAfter === undefined ? {} : { retryAfterMs: safeRetryAfter }),
  };
}

function localId(prefix: string, sequence: number): string {
  return `${prefix}-${sequence}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

export class AskSessionController {
  private state: AskSessionState;
  private readonly listeners = new Set<Listener>();
  private sequence = 0;
  private abortController: AbortController | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    language: Lang,
    private readonly initialSuggestions: readonly SuggestedQuestion[],
    private readonly transport: AskTransport,
    private navigator: PortfolioNavigator,
  ) {
    this.state = createInitialAskSessionState({
      sessionId: localId("session", ++this.sequence),
      language,
      suggestions: initialSuggestions,
    });
  }

  readonly getSnapshot = (): AskSessionState => this.state;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setNavigator(navigator: PortfolioNavigator): void {
    this.navigator = navigator;
  }

  submit = (source: string): SubmitResult => {
    if (this.state.active) {
      return this.reject(localProblem("busy", this.state.language));
    }
    if (!this.state.canSubmit && this.state.problem) {
      return { accepted: false, problem: this.state.problem };
    }

    const question = source.trim();
    const length = characterCount(question);
    if (length === 0) {
      return this.reject(localProblem("empty-question", this.state.language));
    }
    if (length > ASK_LIMITS.questionCharacters) {
      return this.reject(
        localProblem("question-too-long", this.state.language),
      );
    }

    this.clearRetryTimer();
    const generation = this.state.generation + 1;
    const requestId = localId("request", ++this.sequence);
    const visitorTurn: ConversationTurn = {
      id: localId("turn", ++this.sequence),
      role: "portfolio-visitor",
      text: question,
      delivery: "complete",
      answerKind: null,
      evidence: [],
    };
    const guideTurn: ConversationTurn = {
      id: localId("turn", ++this.sequence),
      role: "ask-jakub",
      text: "",
      delivery: "waiting",
      answerKind: null,
      evidence: [],
    };
    const active = {
      requestId,
      generation,
      question,
      visitorTurnId: visitorTurn.id,
      guideTurnId: guideTurn.id,
      invalidResponseRetries: 0,
    };

    const request: AskRequest = {
      version: ASK_PROTOCOL_VERSION,
      sessionId: this.state.sessionId,
      requestId,
      language: this.state.language,
      question,
      history: this.completedHistory(),
    };
    this.dispatch({
      type: "submission.accepted",
      request: active,
      visitorTurn,
      guideTurn,
    });

    const abortController = new AbortController();
    this.abortController = abortController;
    void this.consume(request, generation, abortController.signal);
    return { accepted: true };
  };

  cancel = (): void => {
    const active = this.state.active;
    if (!active) return;
    this.abortController?.abort();
    this.abortController = null;
    this.dispatch({
      type: "request.cancelled",
      requestId: active.requestId,
    });
  };

  retry = (): void => {
    const target = this.state.retryTarget;
    if (!target || this.state.active || !this.state.canRetry) return;

    this.clearRetryTimer();
    const generation = this.state.generation + 1;
    const requestId = localId("request", ++this.sequence);
    const active = {
      requestId,
      generation,
      question: target.question,
      visitorTurnId: target.visitorTurnId,
      guideTurnId: target.guideTurnId,
      invalidResponseRetries: target.invalidResponseRetries,
    };
    const request: AskRequest = {
      version: ASK_PROTOCOL_VERSION,
      sessionId: this.state.sessionId,
      requestId,
      language: this.state.language,
      question: target.question,
      history: this.completedHistory(
        new Set([target.visitorTurnId, target.guideTurnId]),
      ),
    };

    this.dispatch({ type: "retry.started", request: active });
    const abortController = new AbortController();
    this.abortController = abortController;
    void this.consume(request, generation, abortController.signal);
  };

  clear = (): void => {
    this.clearRetryTimer();
    this.abortController?.abort();
    this.abortController = null;
    this.dispatch({
      type: "session.cleared",
      sessionId: localId("session", ++this.sequence),
      suggestions: this.initialSuggestions,
    });
  };

  followEvidence = (link: EvidenceLink): void => {
    const owned = findEvidence(link.id);
    if (!owned) return;
    this.navigator.open(owned.location);
  };

  dispose = (): void => {
    this.clearRetryTimer();
    this.state = { ...this.state, generation: this.state.generation + 1 };
    this.abortController?.abort();
    this.abortController = null;
  };

  private reject(problem: AskProblem): SubmitResult {
    this.dispatch({ type: "submission.rejected", problem });
    return { accepted: false, problem };
  }

  private completedHistory(
    excludedIds: ReadonlySet<string> = new Set(),
  ): readonly CompletedTurn[] {
    const pairs: (readonly [CompletedTurn, CompletedTurn])[] = [];
    for (let index = 0; index < this.state.transcript.length - 1; index += 1) {
      const visitor = this.state.transcript[index];
      const guide = this.state.transcript[index + 1];
      if (
        !visitor ||
        !guide ||
        visitor.role !== "portfolio-visitor" ||
        guide.role !== "ask-jakub" ||
        visitor.delivery !== "complete" ||
        guide.delivery !== "complete" ||
        excludedIds.has(visitor.id) ||
        excludedIds.has(guide.id) ||
        visitor.text.trim().length === 0 ||
        guide.text.trim().length === 0
      ) {
        continue;
      }
      const bounded = (turn: ConversationTurn): CompletedTurn => ({
        role: turn.role,
        text: Array.from(turn.text.trim())
          .slice(0, ASK_LIMITS.historyTurnCharacters)
          .join(""),
      });
      pairs.push([bounded(visitor), bounded(guide)]);
      index += 1;
    }

    const selectedPairs: (readonly [CompletedTurn, CompletedTurn])[] = [];
    let totalCharacters = 0;
    for (let index = pairs.length - 1; index >= 0; index -= 1) {
      const pair = pairs[index];
      if (!pair) continue;
      const pairCharacters =
        characterCount(pair[0].text) + characterCount(pair[1].text);
      if (
        selectedPairs.length * 2 + 2 > ASK_LIMITS.historyTurns ||
        totalCharacters + pairCharacters > ASK_LIMITS.historyCharacters
      ) {
        break;
      }
      selectedPairs.push(pair);
      totalCharacters += pairCharacters;
    }
    return selectedPairs.reverse().flat();
  }

  private async consume(
    request: AskRequest,
    generation: number,
    signal: AbortSignal,
  ): Promise<void> {
    let accepted = false;
    let phaseIndex = -1;
    let terminal: PendingTerminal | null = null;
    try {
      for await (const rawEvent of this.transport.stream(request, { signal })) {
        if (!this.isCurrent(request.requestId, generation)) return;
        const active = this.state.active;
        if (!active) return;
        if (terminal) {
          this.failCurrent(request.requestId, generation, "invalid-response");
          return;
        }
        const event = parseAskEvent(rawEvent);
        if (!event) {
          this.failCurrent(request.requestId, generation, "invalid-response");
          return;
        }
        if (event.requestId !== request.requestId) {
          this.failCurrent(request.requestId, generation, "invalid-response");
          return;
        }

        if (event.type === "request.accepted") {
          if (accepted || phaseIndex >= 0) {
            this.failCurrent(request.requestId, generation, "invalid-response");
            return;
          }
          accepted = true;
          continue;
        }

        if (event.type === "phase.changed") {
          if (!accepted) {
            this.failCurrent(request.requestId, generation, "invalid-response");
            return;
          }
          const nextPhaseIndex = event.phase === "retrieving" ? 0 : 1;
          if (nextPhaseIndex <= phaseIndex) {
            this.failCurrent(request.requestId, generation, "invalid-response");
            return;
          }
          phaseIndex = nextPhaseIndex;
          this.dispatch({
            type: "phase.changed",
            requestId: request.requestId,
            phase: event.phase,
          });
          continue;
        }

        if (event.type === "answer.completed") {
          if (!accepted) {
            this.failCurrent(request.requestId, generation, "invalid-response");
            return;
          }
          const evidenceIds = [...new Set(event.evidenceIds)];
          const ownedEvidence = evidenceIds.map((id) => findEvidence(id));
          if (ownedEvidence.some((link) => link === undefined)) {
            this.failCurrent(request.requestId, generation, "invalid-response");
            return;
          }
          const evidence = ownedEvidence
            .filter((link) => link !== undefined)
            .slice(0, 3)
            .map((link) => ({
              id: link.id,
              label: link.label[this.state.language],
              location: link.location,
              href: link.href,
            }));
          if (event.kind === "answered" && evidence.length === 0) {
            this.failCurrent(request.requestId, generation, "invalid-response");
            return;
          }
          const suggestionIds = [...new Set(event.suggestionIds)];
          const ownedSuggestions = suggestionIds.map((id) =>
            findSuggestedQuestion(id),
          );
          if (ownedSuggestions.some((suggestion) => suggestion === undefined)) {
            this.failCurrent(request.requestId, generation, "invalid-response");
            return;
          }
          const suggestions = ownedSuggestions
            .filter((suggestion) => suggestion !== undefined)
            .slice(0, 3);
          terminal = {
            type: "completed",
            guideTurnId: active.guideTurnId,
            kind: event.kind,
            text: event.text,
            evidence,
            suggestions,
          };
          continue;
        }

        if (event.type === "answer.failed") {
          if (!accepted) {
            this.failCurrent(request.requestId, generation, "invalid-response");
            return;
          }
          terminal = {
            type: "failed",
            code:
              event.problem.code === "empty-question" ||
              event.problem.code === "question-too-long" ||
              event.problem.code === "busy"
                ? "invalid-response"
                : event.problem.code,
            retryAfterMs: event.problem.retryAfterMs,
          };
        }
      }
      if (!this.isCurrent(request.requestId, generation) || signal.aborted) {
        return;
      }
      if (!terminal) {
        this.failCurrent(request.requestId, generation, "invalid-response");
        return;
      }
      if (terminal.type === "failed") {
        this.failCurrent(
          request.requestId,
          generation,
          terminal.code,
          terminal.retryAfterMs,
        );
        return;
      }
      this.dispatch({
        type: "answer.completed",
        requestId: request.requestId,
        guideTurnId: terminal.guideTurnId,
        kind: terminal.kind,
        text: terminal.text,
        evidence: terminal.evidence,
        suggestions: terminal.suggestions,
      });
      this.abortController = null;
    } catch (error) {
      if (!this.isCurrent(request.requestId, generation) || signal.aborted) {
        return;
      }
      if (error instanceof AskTransportFailure) {
        this.failCurrent(
          request.requestId,
          generation,
          error.code,
          error.retryAfterMs,
        );
        return;
      }
      this.failCurrent(request.requestId, generation, "unavailable");
    }
  }

  private failCurrent(
    requestId: string,
    generation: number,
    code: AskTransportProblemCode,
    retryAfterMs?: number,
  ): void {
    if (!this.isCurrent(requestId, generation)) return;
    this.clearRetryTimer();
    this.abortController?.abort();
    this.abortController = null;
    const problem = operationalProblem(code, this.state.language, retryAfterMs);
    this.dispatch({
      type: "answer.failed",
      requestId,
      problem,
    });
    if (
      problem.code === "rate-limited" &&
      problem.retryAfterMs !== undefined &&
      this.state.retryTarget
    ) {
      this.retryTimer = setTimeout(() => {
        this.retryTimer = null;
        this.dispatch({ type: "retry.available" });
      }, problem.retryAfterMs);
    }
  }

  private clearRetryTimer(): void {
    if (this.retryTimer === null) return;
    clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private isCurrent(requestId: string, generation: number): boolean {
    return (
      this.state.active?.requestId === requestId &&
      this.state.active.generation === generation &&
      this.state.generation === generation
    );
  }

  private dispatch(action: Parameters<typeof reduceAskSession>[1]): void {
    this.state = reduceAskSession(this.state, action);
    for (const listener of this.listeners) listener();
  }
}
