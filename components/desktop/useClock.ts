"use client";

import { useEffect, useState } from "react";

/** Żywy zegar aktualizowany raz na minutę, wyrównany do pełnej minuty. */
export function useClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(
      () => {
        setNow(new Date());
        interval = setInterval(() => setNow(new Date()), 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  return now;
}

export function formatMenuBarClock(
  now: Date,
  lang: "pl" | "en" = "pl",
): string {
  const locale = lang === "pl" ? "pl-PL" : "en-GB";
  const date = now.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const time = now.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} ${time}`;
}
