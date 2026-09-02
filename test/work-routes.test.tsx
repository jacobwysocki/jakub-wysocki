import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WorkPage, {
  generateMetadata,
  generateStaticParams,
} from "@/app/work/[slug]/page";
import { generateMetadata as generateWorkIndexMetadata } from "@/app/work/page";
import {
  PROJECT_IDS,
  caseStudies,
  findCaseStudy,
  type ProjectId,
  type UxCaseStudy,
} from "@/data/case-studies";
import { person } from "@/data/site";

vi.mock("@/lib/lang-server", () => ({
  resolveLang: vi.fn(async () => "en"),
}));

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

    // Bez ciastka języka metadane mówią po angielsku (domyślny język
    // robota); locale OG podąża za rozstrzygniętym językiem.
    expect(metadata).toMatchObject({
      title: `${study.client} UX case study | ${person.fullName}`,
      description: study.problem.en,
      alternates: { canonical: "/work/printly" },
      openGraph: {
        url: "/work/printly",
        locale: "en_GB",
        alternateLocale: "pl_PL",
      },
    });
    expect(metadata.alternates?.languages).toBeUndefined();
    expect(metadata.openGraph?.images).toBeUndefined();
    const workIndexMetadata = await generateWorkIndexMetadata();
    expect(workIndexMetadata.openGraph?.images).toBeUndefined();
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
