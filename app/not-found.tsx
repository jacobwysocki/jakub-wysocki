"use client";

import Link from "next/link";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";
import LangProvider from "@/components/LangProvider";

/**
 * 404 celowo nie czyta ciastka na serwerze: to jedyna trasa, która ma
 * zostać statyczna mimo dwujęzyczności, a chwilowe miganie na stronie
 * błędu nie ma znaczenia. LangProvider bez initialLang ustala język
 * po stronie klienta.
 */
export default function NotFound() {
  return (
    <LangProvider>
      <NotFoundContent />
    </LangProvider>
  );
}

function NotFoundContent() {
  const t = useT();

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
