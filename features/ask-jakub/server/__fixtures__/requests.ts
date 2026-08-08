import type { AskRequest } from "../../contract";

export const validAskRequest = {
  version: 1,
  sessionId: "session-fixture-1",
  requestId: "request-fixture-1",
  language: "en",
  question: "Which work best demonstrates applied AI?",
  history: [],
} as const satisfies AskRequest;
