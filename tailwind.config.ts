import type { Config } from "tailwindcss";

/**
 * Design tokens — jedyne źródło prawdy dla kolorów, typografii i ruchu.
 * Wartości lustrzane do zmiennych CSS w app/globals.css.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#FBFBFD", // jasne tło
        ink: "#1D1D1F", // tekst główny
        muted: "#86868B", // tekst drugorzędny
        line: "#D2D2D7", // obramowania / separatory
        accent: "#C2410C", // akcent na jasnym tle
        "accent-bright": "#FF6A3D", // akcent na ciemnym tle
      },
      fontFamily: {
        sans: [
          "SF Pro Display",
          "SF Pro Text",
          "-apple-system",
          "BlinkMacSystemFont",
          "var(--font-inter)",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      fontSize: {
        // Skala typograficzna z briefu — clamp() desktop → mobile
        display: [
          "clamp(40px, 6.5vw, 84px)",
          // -0.015em zamiast -0.03em: przy -0.03em litery w „I build brands
          // and software." zlewały się ze sobą. Angielski headline ma więcej
          // krótkich słów niż polski, więc ciasny tracking bolał tam bardziej.
          { lineHeight: "1.05", letterSpacing: "-0.015em", fontWeight: "700" },
        ],
        h2: [
          "clamp(36px, 5vw, 64px)",
          { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        h3: [
          "clamp(22px, 3vw, 32px)",
          { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" },
        ],
        body: ["clamp(17px, 1.5vw, 19px)", { lineHeight: "1.5" }],
        caption: [
          "13px",
          { lineHeight: "1.4", letterSpacing: "0.06em", fontWeight: "500" },
        ],
      },
      maxWidth: {
        content: "1120px",
        prose: "680px",
      },
      borderRadius: {
        card: "20px",
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0, 0, 0, 0.08)",
        lift: "0 24px 60px rgba(0, 0, 0, 0.12)",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
