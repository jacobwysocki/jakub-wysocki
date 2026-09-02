import { beforeEach, describe, expect, it, vi } from "vitest";
import { person } from "@/data/site";

const resolveLang = vi.hoisted(() => vi.fn());

vi.mock("@/lib/lang-server", () => ({ resolveLang }));

import { generateMetadata } from "@/app/(bilingual)/page";

describe("homepage metadata", () => {
  beforeEach(() => resolveLang.mockReset());

  it.each([
    {
      lang: "pl",
      title: `${person.fullName} | ${person.jobTitle.pl}`,
      descriptionFragment: "Współzałożyciel Ultra Studio i Squizzu",
      locale: "pl_PL",
      alternateLocale: "en_GB",
    },
    {
      lang: "en",
      title: `${person.fullName} | ${person.jobTitle.en}`,
      descriptionFragment: "Co-founder of Ultra Studio and Squizzu",
      locale: "en_GB",
      alternateLocale: "pl_PL",
    },
  ] as const)(
    "emits $lang metadata matching the resolved reader language",
    async ({ lang, title, descriptionFragment, locale, alternateLocale }) => {
      resolveLang.mockResolvedValue(lang);

      const metadata = await generateMetadata();

      expect(metadata).toMatchObject({
        title,
        description: expect.stringContaining(descriptionFragment),
        alternates: { canonical: "/" },
        openGraph: { title, locale, alternateLocale },
        twitter: { card: "summary_large_image", title },
      });
      expect(metadata.alternates?.languages).toBeUndefined();
    },
  );
});
