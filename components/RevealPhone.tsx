"use client";

import { useState } from "react";
import { ui } from "@/data/ui";
import { useT } from "@/lib/lang-store";

export type PhoneInfo = { number: string; href: string };

/** Dociąga numer z /api/phone przy pierwszym kliknięciu (anty-scraping). */
export function usePhoneReveal() {
  const [phone, setPhone] = useState<PhoneInfo | null>(null);
  const [failed, setFailed] = useState(false);

  const reveal = async () => {
    if (phone) return;
    try {
      const res = await fetch("/api/phone");
      if (!res.ok) throw new Error(String(res.status));
      setPhone((await res.json()) as PhoneInfo);
    } catch {
      setFailed(true);
    }
  };

  return { phone, failed, reveal };
}

/** Przycisk "Pokaż numer" zamieniający się w link tel: po odsłonięciu. */
export default function RevealPhone({ className }: { className?: string }) {
  const t = useT();
  const { phone, failed, reveal } = usePhoneReveal();

  if (failed) return null;
  if (phone) {
    return (
      <a href={phone.href} className={className}>
        {phone.number}
      </a>
    );
  }
  return (
    <button type="button" onClick={reveal} className={className}>
      {t(ui.actions.showPhone)}
    </button>
  );
}
