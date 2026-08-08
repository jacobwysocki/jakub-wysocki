import "server-only";

import { createGroqModel } from "./groq-model-adapter";
import type { AnswerModelPort } from "./model-port";
import { providerDisabledModel } from "./provider-disabled-adapter";

type ModelEnvironment = Readonly<{
  ASK_JAKUB_PROVIDER?: string;
  GROQ_API_KEY?: string;
}>;

type ConfiguredModelDependencies = Readonly<{
  fetch?: typeof globalThis.fetch;
}>;

/** Server composition root. Unknown, incomplete, or disabled config fails closed. */
export function createConfiguredModel(
  environment: ModelEnvironment,
  dependencies: ConfiguredModelDependencies = {},
): AnswerModelPort {
  if (environment.ASK_JAKUB_PROVIDER?.trim().toLowerCase() !== "groq") {
    return providerDisabledModel;
  }

  const apiKey = environment.GROQ_API_KEY?.trim();
  if (!apiKey) return providerDisabledModel;

  return createGroqModel({ apiKey, fetch: dependencies.fetch });
}
