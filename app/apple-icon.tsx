import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/**
 * Ikona iOS/Safari (PNG 180×180) — ten sam design co app/icon.svg:
 * ciemny kafelek, "jw", vermilion kropka. iOS sam zaokrągla rogi,
 * więc tło jest pełnym kwadratem.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1D1D1F",
        color: "#FFFFFF",
        fontSize: 84,
        fontWeight: 700,
        letterSpacing: "-4px",
      }}
    >
      jw
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#FF6A3D",
          marginLeft: 10,
          marginTop: 34,
        }}
      />
    </div>,
    size,
  );
}
