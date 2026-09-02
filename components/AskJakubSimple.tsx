"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import { askJakubEntryCopy } from "@/data/ask-jakub-entry";
import { useLang } from "@/lib/lang-store";

const PANEL_ID = "ask-jakub-simple-panel";

// Panel wraz z providerem, kontrolerem sesji i transportem nie należy do
// pierwszego pakietu strony. Import pojawia się dopiero po aktywacji
// serwerowo wyrenderowanego przycisku. `loading` daje zawieszeniu lokalną
// granicę — bez niej React chowa całą stronę do najbliższej granicy wyżej
// i ekran mruga bielą przy pierwszym kliknięciu.
const AskJakubSimplePanel = dynamic(
  () => import("@/components/AskJakubSimplePanel"),
  { ssr: false, loading: () => null },
);

export default function AskJakubSimple() {
  const language = useLang();
  const [panelRequested, setPanelRequested] = useState(false);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const copy = <Key extends keyof typeof askJakubEntryCopy>(key: Key) =>
    askJakubEntryCopy[key][language];

  const openPanel = () => {
    setPanelRequested(true);
    setOpen(true);
  };

  const closePanel = useCallback(() => {
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  }, []);

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        data-ask-jakub-trigger="pill"
        aria-controls={PANEL_ID}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={openPanel}
        // Jedyne wejście na każdej szerokości. Dolne odsunięcie ustępuje
        // wskaźnikowi home na iOS, a węższe wypełnienie na telefonie zabiera
        // mniej miejsca nad sekcją kontaktu.
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 z-40 rounded-full border border-ink/15 bg-surface px-4 py-2.5 text-[13px] font-semibold text-ink shadow-soft transition-colors hover:border-accent/45 hover:text-accent focus-visible:text-accent sm:right-6 sm:px-5 sm:py-3 sm:text-[14px]"
      >
        {copy("trigger")}
      </button>

      {panelRequested && (
        <AskJakubSimplePanel id={PANEL_ID} open={open} onClose={closePanel} />
      )}
    </>
  );
}
