import "server-only";

import { ASK_LIMITS } from "../contract";

export class AnswerTimeoutError extends Error {
  constructor() {
    super("Ask Jakub answer operation timed out");
    this.name = "AnswerTimeoutError";
  }
}

export class AnswerAbortedError extends Error {
  constructor() {
    super("Ask Jakub answer operation was aborted");
    this.name = "AnswerAbortedError";
  }
}

export type OperationDeadline = Readonly<{
  signal: AbortSignal;
  run<T>(operation: (signal: AbortSignal) => Promise<T>): Promise<T>;
  dispose(): void;
}>;

function raceWithSignal<T>(
  operation: Promise<T>,
  signal: AbortSignal,
): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason);

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    operation.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

/** One absolute deadline shared by generation and the optional repair. */
export function createOperationDeadline(
  externalSignal: AbortSignal | undefined,
  requestedTimeoutMs: number | undefined,
): OperationDeadline {
  const controller = new AbortController();
  const timeoutMs = Math.max(
    1,
    Math.min(requestedTimeoutMs ?? ASK_LIMITS.timeoutMs, ASK_LIMITS.timeoutMs),
  );
  const onExternalAbort = () => controller.abort(new AnswerAbortedError());

  if (externalSignal?.aborted) onExternalAbort();
  else
    externalSignal?.addEventListener("abort", onExternalAbort, {
      once: true,
    });

  const timeout = setTimeout(
    () => controller.abort(new AnswerTimeoutError()),
    timeoutMs,
  );

  return {
    signal: controller.signal,
    run(operation) {
      if (controller.signal.aborted) {
        return Promise.reject(controller.signal.reason);
      }
      return raceWithSignal(operation(controller.signal), controller.signal);
    },
    dispose() {
      clearTimeout(timeout);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    },
  };
}
