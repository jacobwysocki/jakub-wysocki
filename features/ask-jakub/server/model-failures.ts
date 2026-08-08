import "server-only";

const MAX_RETRY_AFTER_MS = 60 * 60 * 1_000;

export class ModelRateLimitedError extends Error {
  readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super("Ask Jakub model rate limited");
    this.name = "ModelRateLimitedError";
    this.retryAfterMs = Math.max(
      1_000,
      Math.min(
        Number.isFinite(retryAfterMs) ? Math.ceil(retryAfterMs) : 1_000,
        MAX_RETRY_AFTER_MS,
      ),
    );
  }
}

export class ModelBudgetDisabledError extends Error {
  constructor() {
    super("Ask Jakub model budget disabled");
    this.name = "ModelBudgetDisabledError";
  }
}
