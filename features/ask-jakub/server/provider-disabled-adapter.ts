import "server-only";

import type { AnswerModelPort } from "./model-port";

export class ProviderUnavailableError extends Error {
  constructor() {
    super("Ask Jakub model provider is disabled");
    this.name = "ProviderUnavailableError";
  }
}

/** Local/preview default: deterministic, credential-free, and explicit. */
export const providerDisabledModel: AnswerModelPort = {
  async generate() {
    throw new ProviderUnavailableError();
  },
};
