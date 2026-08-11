import { describe, expect, it, vi } from "vitest";

import { createConfiguredModel } from "./configured-model";
import type { ModelInput } from "./model-port";
import { ProviderUnavailableError } from "./provider-disabled-adapter";

const input: ModelInput = {
  language: "en",
  question: "What is documented?",
  history: [],
  knowledgeCoverage: "matched",
  knowledge: [],
  allowedSuggestionIds: [],
};

describe("Ask Jakub server model composition", () => {
  it("requires both the explicit Groq switch and key before any external call", async () => {
    const fetchProvider = vi.fn();

    for (const environment of [
      { GROQ_API_KEY: "key-without-switch" },
      { ASK_JAKUB_PROVIDER: "groq" },
      {
        ASK_JAKUB_PROVIDER: "unknown",
        GROQ_API_KEY: "key-with-unknown-switch",
      },
    ]) {
      const model = createConfiguredModel(environment, {
        fetch: fetchProvider,
      });

      await expect(
        model.generate(input, { signal: new AbortController().signal }),
      ).rejects.toBeInstanceOf(ProviderUnavailableError);
    }

    expect(fetchProvider).not.toHaveBeenCalled();
  });
});
