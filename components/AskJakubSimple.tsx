"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { askJakubEntryCopy } from "@/data/ask-jakub-entry";
import { useLang } from "@/lib/lang-store";

const PANEL_ID = "ask-jakub-simple-panel";
const MOBILE_QUERY = "(max-width: 899px)";

// Panel wraz z providerem, kontrolerem sesji i transportem nie należy do
// pierwszego pakietu strony. Import pojawia się dopiero po aktywacji jednego
// z dwóch serwerowo wyrenderowanych przycisków.
const AskJakubSimplePanel = dynamic(
  () => import("@/components/AskJakubSimplePanel"),
  { ssr: false },
);

export default function AskJakubSimple() {
  const language = useLang();
  const [panelRequested, setPanelRequested] = useState(false);
  const [open, setOpen] = useState(false);
  const inlineTriggerRef = useRef<HTMLButtonElement>(null);
  const pillTriggerRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const copy = <Key extends keyof typeof askJakubEntryCopy>(key: Key) =>
    askJakubEntryCopy[key][language];

  const openPanel = (event: React.MouseEvent<HTMLButtonElement>) => {
    returnFocusRef.current = event.currentTarget;
    setPanelRequested(true);
    setOpen(true);
  };

  const closePanel = useCallback(() => {
    setOpen(false);

    // Po zmianie szerokości pigułka może już być ukryta. Wtedy bezpiecznym
    // miejscem powrotu jest zawsze obecny przycisk w toku czytania.
    const pillBecameHidden =
      returnFocusRef.current === pillTriggerRef.current &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(MOBILE_QUERY).matches;
    const focusTarget = pillBecameHidden
      ? inlineTriggerRef.current
      : returnFocusRef.current;

    queueMicrotask(() => focusTarget?.focus());
  }, []);

  const triggerProps = {
    type: "button" as const,
    "aria-controls": PANEL_ID,
    "aria-expanded": open,
    "aria-haspopup": "dialog" as const,
    onClick: openPanel,
  };

  return (
    <>
      <div
        data-ask-jakub-inline-entry
        className="border-y border-line/70 bg-surface py-5"
      >
        <p className="mx-auto flex max-w-content flex-wrap items-baseline gap-x-2 gap-y-1 px-6 text-[14px] leading-relaxed text-muted">
          <span>{copy("inlinePrompt")}</span>
          <button
            {...triggerProps}
            ref={inlineTriggerRef}
            data-ask-jakub-trigger="inline"
            className="group inline-flex items-center gap-1.5 font-semibold text-ink underline decoration-accent/50 decoration-1 underline-offset-4 transition-colors hover:text-accent focus-visible:text-accent"
          >
            {copy("trigger")}
            <span aria-hidden className="text-accent">
              ↗
            </span>
          </button>
        </p>
      </div>

      <button
        {...triggerProps}
        ref={pillTriggerRef}
        data-ask-jakub-trigger="pill"
        className="fixed bottom-6 right-6 z-40 rounded-full border border-ink/15 bg-surface px-5 py-3 text-[14px] font-semibold text-ink shadow-soft transition-colors hover:border-accent/45 hover:text-accent focus-visible:text-accent max-[899px]:hidden"
      >
        {copy("trigger")}
      </button>

      {panelRequested && (
        <AskJakubSimplePanel id={PANEL_ID} open={open} onClose={closePanel} />
      )}
    </>
  );
}
