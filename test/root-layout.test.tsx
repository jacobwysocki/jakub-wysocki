import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveLang = vi.hoisted(() => vi.fn());

vi.mock("@/lib/lang-server", () => ({ resolveLang }));
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "test-font" }),
}));

import RootLayout from "@/app/layout";

describe("root document language", () => {
  beforeEach(() => resolveLang.mockReset());

  it.each(["pl", "en"] as const)(
    "uses the server-resolved %s language on <html>",
    async (lang) => {
      resolveLang.mockResolvedValue(lang);

      const document = await RootLayout({ children: <main /> });

      expect(document.props.lang).toBe(lang);
    },
  );
});
