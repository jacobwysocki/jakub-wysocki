"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { initialSuggestedQuestions } from "@/features/portfolio-knowledge";
import type { PortfolioNavigator } from "@/features/portfolio-navigation";
import { useLang } from "@/lib/lang-store";
import type { AskSession } from "../session-reducer";
import { AskSessionController } from "./session-controller";
import type { AskTransport } from "./transport-port";

const AskJakubContext = createContext<AskSession | null>(null);

const closedNavigator: PortfolioNavigator = {
  open: () => ({ opened: false, reason: "invalid-location" }),
};

export type AskJakubSessionProviderProps = Readonly<{
  children: ReactNode;
  transport: AskTransport;
  navigator?: PortfolioNavigator;
}>;

/** Internal composition root for the production and deterministic Adapters. */
export function AskJakubSessionProvider({
  children,
  transport,
  navigator = closedNavigator,
}: AskJakubSessionProviderProps) {
  const language = useLang();

  return (
    <LanguageSession
      key={language}
      language={language}
      transport={transport}
      navigator={navigator}
    >
      {children}
    </LanguageSession>
  );
}

type LanguageSessionProps = Readonly<{
  children: ReactNode;
  language: ReturnType<typeof useLang>;
  /** Construction-time Adapter. Remount the internal provider to replace it. */
  transport: AskTransport;
  navigator: PortfolioNavigator;
}>;

function LanguageSession({
  children,
  language,
  transport,
  navigator,
}: LanguageSessionProps) {
  const [controller] = useState(
    () =>
      new AskSessionController(
        language,
        initialSuggestedQuestions,
        transport,
        navigator,
      ),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );

  useEffect(() => controller.setNavigator(navigator), [controller, navigator]);
  useEffect(() => () => controller.dispose(), [controller]);

  const session = useMemo<AskSession>(
    () => ({
      ...state,
      submit: controller.submit,
      cancel: controller.cancel,
      retry: controller.retry,
      clear: controller.clear,
      followEvidence: controller.followEvidence,
    }),
    [controller, state],
  );

  return (
    <AskJakubContext.Provider value={session}>
      {children}
    </AskJakubContext.Provider>
  );
}

export function useAskJakubSessionContext(): AskSession {
  const session = useContext(AskJakubContext);
  if (!session) {
    throw new Error("useAskJakubSession must be used inside AskJakubProvider");
  }
  return session;
}
