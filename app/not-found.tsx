"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ui } from "@/data/ui";
import { useLangStore, useT } from "@/lib/lang-store";

export default function NotFound() {
  const hydrateLang = useLangStore((s) => s.hydrate);
  const t = useT();

  // ModeGate nie renderuje się na 404 — język dociągamy tutaj
  useEffect(() => {
    hydrateLang();
  }, [hydrateLang]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <p className="text-caption uppercase text-muted">404</p>
      <h1 className="mt-4 text-h2 text-ink">{t(ui.notFound.title)}</h1>
      <p className="mt-4 max-w-prose text-body text-muted">
        {t(ui.notFound.subline)}
      </p>
      <Link
        href="/"
        className="mt-10 rounded-full bg-ink px-8 py-3.5 text-[15px] font-semibold text-white transition-opacity duration-300 hover:opacity-85"
      >
        {t(ui.notFound.backHome)}
      </Link>
    </main>
  );
}
