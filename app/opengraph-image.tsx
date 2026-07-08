import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Jakub Wysocki — Software Engineer & UX/UI Designer";

/**
 * Podgląd linku (LinkedIn/Slack/iMessage) — ciemne tło w duchu tapety
 * Ultra z vermilion poświatą, imię i rola. Generowany raz w buildzie.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
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
          jakub-wysocki
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
          Jakub Wysocki
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 36,
            fontWeight: 500,
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Software Engineer &amp; UX/UI Designer
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
      </div>
    ),
    size
  );
}
