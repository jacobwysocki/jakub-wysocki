import type { AskEvent, AskRequest } from "../contract";
import type { AskTransport, AskTransportOptions } from "./transport-port";

export type AskTransportScript = (
  request: AskRequest,
  options: AskTransportOptions,
) => AsyncIterable<AskEvent>;

export type ScriptedAskTransport = AskTransport &
  Readonly<{ requests: readonly AskRequest[] }>;

/** Deterministic in-memory Adapter for Interface tests and provider-free demos. */
export function createScriptedAskTransport(
  scripts: readonly AskTransportScript[],
): ScriptedAskTransport {
  const requests: AskRequest[] = [];
  let nextScript = 0;

  return {
    requests,
    stream(request, options) {
      requests.push(request);
      const script = scripts[nextScript++];
      if (!script) {
        return (async function* missingScript() {
          throw new Error("No scripted Ask Jakub response remains");
        })();
      }
      return script(request, options);
    },
  };
}

/** Convenience script for a fully deterministic lifecycle. */
export function scriptedAskEvents(
  events: readonly AskEvent[] | ((request: AskRequest) => readonly AskEvent[]),
): AskTransportScript {
  return async function* scripted(request, { signal }) {
    const resolved = typeof events === "function" ? events(request) : events;
    for (const event of resolved) {
      if (signal.aborted) return;
      yield event;
    }
  };
}
