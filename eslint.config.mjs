import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  prettier,
  {
    files: [
      "components/CountUp.tsx",
      "components/LangProvider.tsx",
      "components/LazyVideo.tsx",
      "components/LiveSite.tsx",
      "components/SiteOverlay.tsx",
      "components/SmoothScrollProvider.tsx",
      "components/VenorPipeline.tsx",
    ],
    rules: {
      // React 19 surfaced these pre-existing lifecycle patterns. Each exception
      // is named so new code remains protected while behavior-preserving fixes
      // are handled with focused tests.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["components/ModeGate.tsx", "components/desktop/Window.tsx"],
    rules: {
      "react-hooks/refs": "off",
    },
  },
  {
    files: ["components/logos.tsx"],
    rules: {
      // These local SVG marks are tiny decorative app glyphs whose rendered
      // size is owned by each caller.
      "@next/next/no-img-element": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "build/**",
    "coverage/**",
    "dist/**",
    "out/**",
    "next-env.d.ts",
  ]),
]);
