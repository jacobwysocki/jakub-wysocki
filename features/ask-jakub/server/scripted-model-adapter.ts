import "server-only";

import type { AnswerModelPort, ModelInput, ModelResult } from "./model-port";

export type ScriptedModelStep =
  | ModelResult
  | Readonly<Record<string, unknown>>
  | Error
  | ((
      input: ModelInput,
      options: Readonly<{ signal: AbortSignal }>,
    ) => unknown | Promise<unknown>);

export type ScriptedModel = AnswerModelPort &
  Readonly<{ inputs: readonly ModelInput[] }>;

/** Deterministic provider-boundary Adapter used by server and route fixtures. */
export function createScriptedModel(
  steps: readonly ScriptedModelStep[],
): ScriptedModel {
  const queue = [...steps];
  const inputs: ModelInput[] = [];

  return {
    inputs,
    async generate(input, options) {
      inputs.push(input);
      const step = queue.shift();
      if (step === undefined) {
        throw new Error("Scripted model exhausted");
      }
      if (step instanceof Error) throw step;
      const result =
        typeof step === "function" ? await step(input, options) : step;
      return result as ModelResult;
    },
  };
}
