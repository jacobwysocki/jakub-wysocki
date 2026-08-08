"use client";

import type { ReactNode } from "react";
import {
  PortfolioNavigator,
  type PortfolioNavigator as PortfolioNavigatorPort,
} from "@/features/portfolio-navigation";
import {
  AskJakubSessionProvider,
  useAskJakubSessionContext,
} from "./client/provider";
import { createHttpAskTransport } from "./client/http-adapter";
import { ASK_LIMITS } from "./contract";

const httpTransport = createHttpAskTransport();

const simpleModeNavigator = PortfolioNavigator.simpleMode((href) => {
  window.location.assign(href);
});

export type AskJakubProviderProps = Readonly<{
  children: ReactNode;
  /** Legitimate presentation Adapter; no wire/provider concepts cross here. */
  navigator?: PortfolioNavigatorPort;
}>;

export function AskJakubProvider({
  children,
  navigator = simpleModeNavigator,
}: AskJakubProviderProps) {
  return (
    <AskJakubSessionProvider transport={httpTransport} navigator={navigator}>
      {children}
    </AskJakubSessionProvider>
  );
}

export const useAskJakubSession = useAskJakubSessionContext;

/** UI-safe product bound; wire protocol details stay internal. */
export const ASK_JAKUB_QUESTION_LIMIT = ASK_LIMITS.questionCharacters;

export type { AskProblem, AskProblemCode } from "./contract";
export type {
  AskAnswerKind,
  AskSession,
  AskState,
  ConversationTurn,
  EvidenceLink,
  SubmitResult,
} from "./session-reducer";
