import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const routerRefresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", async (importOriginal) => {
  const navigation = await importOriginal<typeof import("next/navigation")>();
  return {
    ...navigation,
    useRouter: () => ({ refresh: routerRefresh }),
  };
});

import WorkPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/(bilingual)/work/[slug]/page";
import { generateImageMetadata } from "@/app/(bilingual)/work/[slug]/opengraph-image";
import { generateMetadata as generateWorkIndexMetadata } from "@/app/(bilingual)/work/page";
import {
  PROJECT_IDS,
  caseStudies,
  findCaseStudy,
  type ProjectId,
  type UxCaseStudy,
} from "@/data/case-studies";
import { person } from "@/data/site";

const resolveLang = vi.hoisted(() => vi.fn());

vi.mock("@/lib/lang-server", () => ({ resolveLang }));

const originalCaseStudies = { ...caseStudies };

function caseStudyFixture(slug: ProjectId): UxCaseStudy {
  return {
    slug,
    client: `Client ${slug}`,
    tag: { pl: "Case testowy", en: "Test case" },
    role: { pl: "Projektant", en: "Designer" },
    gradient: "linear-gradient(#000, #fff)",
    cover: null,
    problem: {
      pl: `Problem testowy dla ${slug}.`,
      en: `Test problem for ${slug}.`,
    },
    decisions: [],
    solution: {
      summary: { pl: "Rozwiązanie", en: "Solution" },
      media: [],
    },
  };
}

function publish(projectId: ProjectId) {
  caseStudies[projectId] = caseStudyFixture(projectId);
  return caseStudies[projectId] as UxCaseStudy;
}

beforeEach(() => {
  routerRefresh.mockReset();
  resolveLang.mockReset();
  resolveLang.mockResolvedValue("en");
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: true,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  for (const projectId of PROJECT_IDS) delete caseStudies[projectId];
  Object.assign(caseStudies, originalCaseStudies);
});

describe("/work/[slug]", () => {
  it("generates params for published canonical records only", () => {
    publish("alumed");
    delete caseStudies.printly;
    const params = generateStaticParams();

    expect(params).toContainEqual({ slug: "alumed" });
    expect(params).not.toContainEqual({ slug: "printly" });
    expect(params).not.toContainEqual({ slug: "ultrastudio-site" });
    expect(params.every(({ slug }) => findCaseStudy(slug)?.slug === slug)).toBe(
      true,
    );
  });

  it("emits a self-canonical bilingual case metadata record without hreflang", async () => {
    const study = publish("printly");
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "printly" }),
    });

    // Mock resolvera reprezentuje angielski fallback po rozpatrzeniu
    // ciastka i Accept-Language.
    expect(metadata).toMatchObject({
      title: `${study.client} UX case study | ${person.fullName}`,
      description: study.problem.en,
      alternates: { canonical: "/work/printly" },
      openGraph: {
        url: "/work/printly",
        locale: "en_GB",
        alternateLocale: "pl_PL",
      },
      twitter: {
        card: "summary_large_image",
        title: `${study.client} UX case study | ${person.fullName}`,
        description: study.problem.en,
      },
    });
    expect(metadata.alternates?.languages).toBeUndefined();
    expect(metadata.openGraph?.images).toBeUndefined();
    const workIndexMetadata = await generateWorkIndexMetadata();
    expect(workIndexMetadata.openGraph?.images).toBeUndefined();
    expect(workIndexMetadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: `UX case studies | ${person.fullName}`,
      description: expect.stringContaining("Six UX/UI case studies"),
    });
  });

  it("emits Polish case and index metadata for a Polish reader", async () => {
    const study = publish("alumed");
    resolveLang.mockResolvedValue("pl");

    const caseMetadata = await generateMetadata({
      params: Promise.resolve({ slug: "alumed" }),
    });
    const indexMetadata = await generateWorkIndexMetadata();

    expect(caseMetadata).toMatchObject({
      title: `${study.client}: studium przypadku UX | ${person.fullName}`,
      description: study.problem.pl,
      openGraph: { locale: "pl_PL", alternateLocale: "en_GB" },
      twitter: {
        title: `${study.client}: studium przypadku UX | ${person.fullName}`,
        description: study.problem.pl,
      },
    });
    expect(indexMetadata).toMatchObject({
      title: `Realizacje UX | ${person.fullName}`,
      openGraph: { locale: "pl_PL", alternateLocale: "en_GB" },
      twitter: { title: `Realizacje UX | ${person.fullName}` },
    });
  });

  it("names the case-study client in generated OG image metadata", () => {
    const study = publish("squizzu");

    expect(
      generateImageMetadata({ params: { slug: "squizzu" } }),
    ).toContainEqual(
      expect.objectContaining({
        id: "squizzu",
        alt: `${study.client} UX case study | ${person.fullName}`,
      }),
    );
  });

  it("renders a published case in the linear Simple Mode chrome", async () => {
    const study = publish("squizzu");
    const page = await WorkPage({
      params: Promise.resolve({ slug: "squizzu" }),
    });

    render(page);

    expect(
      screen.getByRole("heading", { level: 1, name: study.client }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: "About" })
        .every((link) => link.getAttribute("href") === "/#about"),
    ).toBe(true);
    expect(document.querySelector('[lang="en"]')).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("fails closed for an unknown or unpublished slug", async () => {
    delete caseStudies.printly;

    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "missing" }) }),
    ).resolves.toMatchObject({
      title: `404 | ${person.fullName}`,
      robots: { index: false, follow: true },
    });

    await expect(
      WorkPage({ params: Promise.resolve({ slug: "missing" }) }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
    await expect(
      WorkPage({ params: Promise.resolve({ slug: "printly" }) }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("permanently redirects the data alias to its canonical slug", async () => {
    publish("ultra-studio");

    await expect(
      WorkPage({
        params: Promise.resolve({ slug: "ultrastudio-site" }),
      }),
    ).rejects.toMatchObject({
      digest: expect.stringContaining("/work/ultra-studio;308"),
    });
  });
});
