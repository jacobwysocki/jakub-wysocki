import { ImageResponse } from "next/og";

/**
 * Wspólny szablon podglądu linku (LinkedIn/Slack/iMessage) — ciemne tło
 * w duchu tapety Ultra z vermilion poświatą.
 *
 * Wydzielony z app/opengraph-image.tsx, bo Next dokleja plikowy obrazek OG
 * tylko do segmentów, które NIE eksportują własnego `openGraph`. /about
 * i /o-mnie eksportują je (canonical, locale, hreflang), więc każda z tych
 * tras musi mieć własny opengraph-image.tsx — a nie własny szablon.
 */

/** Rozmiar kanoniczny OG. Trasy re-eksportują tę stałą, nie własną kopię. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export function renderOg({ heading, sub }: { heading: string; sub: string }) {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 96px",
        background:
          "radial-gradient(90% 120% at 100% 0%, rgba(255,106,61,0.35) 0%, rgba(255,106,61,0) 55%), linear-gradient(165deg, #050507 0%, #1D1D1F 55%, #40180A 100%)",
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 26,
          fontWeight: 600,
          color: "rgba(255,255,255,0.55)",
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#FF6A3D",
          }}
        />
        jakub-wysocki.com
      </div>
      <div
        style={{
          marginTop: 28,
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: "-4px",
          lineHeight: 1.02,
        }}
      >
        {heading}
      </div>
      <div
        style={{
          marginTop: 24,
          fontSize: 36,
          fontWeight: 500,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {sub}
      </div>
      <div
        style={{
          marginTop: 18,
          fontSize: 26,
          color: "rgba(255,255,255,0.45)",
        }}
      >
        Ultra Studio · Squizzu · Kraków, PL
      </div>
    </div>,
    OG_SIZE,
  );
}
