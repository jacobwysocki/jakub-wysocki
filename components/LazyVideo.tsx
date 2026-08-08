"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Wideo ładowane leniwie: dopóki nie zbliży się do widoku, renderuje
 * lekki placeholder (ciemny kadr), a ciężki plik (.mp4/.webm) pobiera
 * się dopiero po wejściu w pole obserwatora. Bez tego autoPlay-owe wideo
 * buforuje kilka MB już przy pierwszym ładowaniu strony — nawet gdy jest
 * daleko pod zgięciem — i spowalnia start na telefonie.
 */
export default function LazyVideo({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          observer.disconnect();
        }
      },
      // Startujemy ładowanie z wyprzedzeniem, zanim wideo wjedzie w kadr
      { rootMargin: "300px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`overflow-hidden bg-white/[0.04] ${className}`}>
      {show && (
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}
