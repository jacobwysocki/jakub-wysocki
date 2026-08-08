"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import { useDesktop } from "@/components/desktop/DesktopContext";
import { useLang } from "@/lib/lang-store";
import { EASE_APPLE } from "@/lib/motion";
import { spotlightCopy, spotlightKindCopy } from "./copy";
import { searchSpotlight } from "./search";
import type { SpotlightResult } from "./contract";

export type SpotlightProps = Readonly<{
  variant: "desktop" | "mobile";
  disabled?: boolean;
  onOpenChange?: (open: boolean) => void;
}>;

export default function Spotlight({
  variant,
  disabled = false,
  onOpenChange,
}: SpotlightProps) {
  const lang = useLang();
  const reducedMotion = useReducedMotion();
  const { openLocation } = useDesktop();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const openRef = useRef(false);
  const restoreFocusAfterExitRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [navigationProblem, setNavigationProblem] = useState(false);
  const results = useMemo(() => searchSpotlight(query, lang), [lang, query]);
  const selectedIndex = Math.min(activeIndex, Math.max(results.length - 1, 0));
  const selected = results[selectedIndex];

  const copy = (value: (typeof spotlightCopy)[keyof typeof spotlightCopy]) =>
    value[lang];

  const openDialog = useCallback(
    (invoker?: HTMLElement) => {
      if (disabled) return;
      const active = document.activeElement;
      returnFocusRef.current =
        invoker ??
        (active instanceof HTMLElement && active !== document.body
          ? active
          : triggerRef.current);
      setQuery("");
      setActiveIndex(0);
      setNavigationProblem(false);
      openRef.current = true;
      restoreFocusAfterExitRef.current = false;
      onOpenChange?.(true);
      setOpen(true);
    },
    [disabled, onOpenChange],
  );

  const closeDialog = useCallback((restoreFocus = true) => {
    openRef.current = false;
    restoreFocusAfterExitRef.current = restoreFocus;
    setOpen(false);
  }, []);

  const finishClose = useCallback(() => {
    if (openRef.current) return;
    onOpenChange?.(false);
    if (!restoreFocusAfterExitRef.current) return;
    restoreFocusAfterExitRef.current = false;
    window.requestAnimationFrame(() => {
      const target = returnFocusRef.current ?? triggerRef.current;
      if (target?.isConnected) target.focus({ preventScroll: true });
    });
  }, [onOpenChange]);

  useEffect(
    () => () => {
      onOpenChange?.(false);
    },
    [onOpenChange],
  );

  const activate = (result: SpotlightResult | undefined) => {
    if (!result) return;
    triggerRef.current?.focus({ preventScroll: true });
    const outcome = openLocation(result.location);
    if (outcome.opened) {
      closeDialog(false);
      return;
    }
    inputRef.current?.focus({ preventScroll: true });
    setNavigationProblem(true);
  };

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const shortcut =
        event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey);
      if (shortcut && !disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (open) {
          inputRef.current?.focus({ preventScroll: true });
          return;
        }
        openDialog();
        return;
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeDialog();
      }
    };

    window.addEventListener("keydown", handleShortcut, true);
    return () => window.removeEventListener("keydown", handleShortcut, true);
  }, [closeDialog, disabled, open, openDialog]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        data-window-return="true"
        aria-label={copy(spotlightCopy.open)}
        title={copy(spotlightCopy.open)}
        onClick={(event) => openDialog(event.currentTarget)}
        className={
          variant === "desktop"
            ? "flex h-7 items-center gap-1 rounded-lg px-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            : "flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-40"
        }
      >
        <Search size={variant === "desktop" ? 14 : 15} aria-hidden />
        {variant === "desktop" ? (
          <span className="hidden text-[10px] font-semibold opacity-70 xl:inline">
            ⌘K
          </span>
        ) : null}
      </button>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence onExitComplete={finishClose}>
              {open ? (
                <motion.div
                  key="spotlight-dialog"
                  className="fixed inset-0 z-[120] flex items-start justify-center bg-black/35 px-3 pt-[max(10vh,4.5rem)] backdrop-blur-sm"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reducedMotion ? 0 : 0.18 }}
                  onMouseDown={(event) => {
                    if (event.target === event.currentTarget) closeDialog();
                  }}
                >
                  <motion.section
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={copy(spotlightCopy.dialog)}
                    data-reduced-motion={reducedMotion ? "true" : "false"}
                    initial={
                      reducedMotion
                        ? false
                        : { opacity: 0, y: -12, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: -8, scale: 0.99 }
                    }
                    transition={{
                      duration: reducedMotion ? 0 : 0.2,
                      ease: [...EASE_APPLE],
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Tab" || !dialogRef.current) return;
                      const focusable = Array.from(
                        dialogRef.current.querySelectorAll<HTMLElement>(
                          'input, button:not([disabled]):not([tabindex="-1"]), [tabindex]:not([tabindex="-1"])',
                        ),
                      );
                      const first = focusable[0];
                      const last = focusable.at(-1);
                      if (!first || !last) return;
                      if (event.shiftKey && document.activeElement === first) {
                        event.preventDefault();
                        last.focus({ preventScroll: true });
                      } else if (
                        !event.shiftKey &&
                        document.activeElement === last
                      ) {
                        event.preventDefault();
                        first.focus({ preventScroll: true });
                      }
                    }}
                    className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-white/60 bg-[#f5f5f7]/95 text-ink shadow-[0_32px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl"
                  >
                    <div className="flex items-center gap-3 border-b border-line/70 px-4 py-3">
                      <Search
                        size={19}
                        strokeWidth={1.8}
                        aria-hidden
                        className="shrink-0 text-muted"
                      />
                      <input
                        ref={inputRef}
                        role="combobox"
                        aria-label={copy(spotlightCopy.open)}
                        aria-expanded="true"
                        aria-controls="spotlight-results"
                        aria-activedescendant={
                          selected ? `spotlight-${selected.id}` : undefined
                        }
                        autoComplete="off"
                        value={query}
                        placeholder={copy(spotlightCopy.placeholder)}
                        onChange={(event) => {
                          setQuery(event.target.value);
                          setActiveIndex(0);
                          setNavigationProblem(false);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "ArrowDown" && results.length > 0) {
                            event.preventDefault();
                            setActiveIndex(
                              (selectedIndex + 1) % results.length,
                            );
                          } else if (
                            event.key === "ArrowUp" &&
                            results.length > 0
                          ) {
                            event.preventDefault();
                            setActiveIndex(
                              (selectedIndex - 1 + results.length) %
                                results.length,
                            );
                          } else if (event.key === "Enter") {
                            event.preventDefault();
                            activate(selected);
                          }
                        }}
                        className="min-w-0 flex-1 bg-transparent text-[17px] font-medium outline-none placeholder:text-muted/70"
                      />
                      <button
                        type="button"
                        aria-label={copy(spotlightCopy.close)}
                        onClick={() => closeDialog()}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-muted transition-colors hover:bg-black/10 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <X size={16} aria-hidden />
                      </button>
                    </div>

                    <div className="px-3 pb-3 pt-2">
                      <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {copy(
                          query.trim()
                            ? spotlightCopy.results
                            : spotlightCopy.curated,
                        )}
                      </p>
                      {results.length > 0 ? (
                        <div
                          id="spotlight-results"
                          role="listbox"
                          aria-label={copy(spotlightCopy.results)}
                          className="max-h-[min(58vh,30rem)] overflow-y-auto overscroll-contain"
                        >
                          {results.map((result, index) => {
                            const active = index === selectedIndex;
                            return (
                              <button
                                key={result.id}
                                id={`spotlight-${result.id}`}
                                type="button"
                                role="option"
                                tabIndex={-1}
                                aria-selected={active}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => activate(result)}
                                className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
                                  active
                                    ? "bg-white shadow-sm"
                                    : "hover:bg-white/65"
                                }`}
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-2">
                                    <span className="truncate text-[14px] font-semibold">
                                      {result.title}
                                    </span>
                                    <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-accent">
                                      {spotlightKindCopy[result.kind][lang]}
                                    </span>
                                  </span>
                                  <span className="mt-0.5 block truncate text-[11.5px] text-muted">
                                    {result.context}
                                  </span>
                                </span>
                                <ArrowRight
                                  size={15}
                                  aria-hidden
                                  className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                                />
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p
                          id="spotlight-results"
                          role="status"
                          className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-[13px] text-muted"
                        >
                          {copy(spotlightCopy.noResults)}
                        </p>
                      )}
                      {navigationProblem ? (
                        <p
                          role="alert"
                          className="px-2 pt-2 text-[12px] text-accent"
                        >
                          {copy(spotlightCopy.unavailable)}
                        </p>
                      ) : null}
                    </div>
                  </motion.section>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
