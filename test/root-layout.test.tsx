import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveLang = vi.hoisted(() => vi.fn());

vi.mock("@/lib/lang-server", () => ({ resolveLang }));
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "test-font" }),
}));

import BilingualRootLayout from "@/app/(bilingual)/layout";
import EnglishRootLayout from "@/app/(english)/layout";
import PolishRootLayout from "@/app/(polish)/layout";
import GlobalNotFound from "@/app/global-not-found";

describe("root layout language boundaries", () => {
  beforeEach(() => resolveLang.mockReset());

  it.each(["pl", "en"] as const)(
    "uses the server-resolved %s language for bilingual routes",
    async (lang) => {
      resolveLang.mockResolvedValue(lang);

      const document = await BilingualRootLayout({ children: <main /> });

      expect(document.props.lang).toBe(lang);
      expect(document.props.initializeMode).toBe(true);
    },
  );

  it("keeps profile roots fixed and free of request-time language reads", () => {
    const english = EnglishRootLayout({ children: <main /> });
    const polish = PolishRootLayout({ children: <main /> });

    expect(english.props.lang).toBe("en");
    expect(polish.props.lang).toBe("pl");
    expect(resolveLang).not.toHaveBeenCalled();
  });

  it("keeps the global 404 statically renderable", () => {
    const document = GlobalNotFound();

    expect(document.props.lang).toBe("en");
    expect(resolveLang).not.toHaveBeenCalled();
  });
});
