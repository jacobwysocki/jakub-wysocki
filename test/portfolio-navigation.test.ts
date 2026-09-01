import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PROJECT_IDS,
  caseStudies,
  findCaseStudy,
  type ProjectId,
  type UxCaseStudy,
} from "@/data/case-studies";
import { allRoles } from "@/data/experience";
import { personalProjects } from "@/data/personal";
import { studioProjects } from "@/data/projects";
import { showcase } from "@/data/showcase";
import {
  PortfolioNavigator,
  decodePortfolioPathname,
  encodePortfolioLocation,
  resolvePortfolioLocation,
  type AppLaunchPayload,
  type AppId,
  type PortfolioHref,
  type PortfolioLocation,
} from "@/features/portfolio-navigation";
import { reduceLaunchSelections } from "@/features/portfolio-navigation/launch-selection";
import { useWindowStore } from "@/lib/window-store";

const originalCaseStudies = { ...caseStudies };

function caseStudyFixture(slug: ProjectId): UxCaseStudy {
  const copy = { pl: `Test ${slug}`, en: `Test ${slug}` };
  return {
    slug,
    client: slug,
    tag: copy,
    role: copy,
    gradient: "linear-gradient(#000, #fff)",
    cover: null,
    problem: copy,
    decisions: [],
    solution: { summary: copy, media: [] },
  };
}

function publishCaseStudy(projectId: ProjectId) {
  caseStudies[projectId] = caseStudyFixture(projectId);
}

function publishedHref(value: string, fallback: PortfolioHref): PortfolioHref {
  const study = findCaseStudy(value);
  return study ? `/work/${study.slug}` : fallback;
}

afterEach(() => {
  for (const projectId of PROJECT_IDS) delete caseStudies[projectId];
  Object.assign(caseStudies, originalCaseStudies);
});

describe("Portfolio Location resolution", () => {
  it("covers every frozen location area", () => {
    publishCaseStudy("printly");
    const fixtures: readonly [PortfolioLocation, string, PortfolioHref][] = [
      [{ area: "ask-jakub" }, "ask-jakub", "/#about"],
      [{ area: "about" }, "about", "/#about"],
      [{ area: "experience" }, "experience", "/#engineering"],
      [
        { area: "experience", roleId: "mandata" },
        "experience",
        "/#engineering",
      ],
      [{ area: "education" }, "education", "/#engineering"],
      [{ area: "education", itemId: "languages" }, "education", "/#extras"],
      [
        { area: "project", projectId: "printly" },
        "project:printly",
        "/work/printly",
      ],
      [{ area: "studio" }, "studio", "/#studio"],
      [{ area: "studio", projectSlug: "printly" }, "studio", "/work/printly"],
      [
        { area: "personal-project", projectId: "interactive-os" },
        "info",
        "/#personal-projects",
      ],
      [
        { area: "personal-project", projectId: "venor" },
        "venor",
        publishedHref("venor", "/#personal-projects"),
      ],
      [
        { area: "showcase", slug: "squizzu", view: "overview" },
        "site:squizzu",
        publishedHref("squizzu", "/#studio"),
      ],
      [
        { area: "showcase", slug: "drone-path", view: "live" },
        "site:drone-path",
        publishedHref("drone-path", "/#engineering"),
      ],
      [{ area: "contact" }, "contact", "/#contact"],
      [{ area: "portfolio-info" }, "info", "/#personal-projects"],
    ];

    for (const [location, appId, href] of fixtures) {
      expect(resolvePortfolioLocation(location)).toEqual({
        launch: { appId, selection: location },
        href,
      });
    }
  });

  it("maps each published project to its current Desktop destination", () => {
    const targets = [
      ["squizzu", "site:squizzu"],
      ["ultra-studio", "studio"],
      ["venor", "venor"],
      ["alumed", "project:alumed"],
      ["printly", "project:printly"],
      ["drone-path", "site:drone-path"],
    ] as const satisfies readonly [ProjectId, AppId][];

    for (const [projectId, appId] of targets) {
      publishCaseStudy(projectId);
      const location: PortfolioLocation = { area: "project", projectId };
      expect(resolvePortfolioLocation(location)).toEqual({
        launch: { appId, selection: location },
        href: `/work/${projectId}`,
      });
    }
  });

  it("fails closed when a project identity has no published record", () => {
    delete caseStudies.printly;

    expect(
      resolvePortfolioLocation({ area: "project", projectId: "printly" }),
    ).toBeUndefined();
    expect(
      encodePortfolioLocation({ area: "project", projectId: "printly" }),
    ).toBeUndefined();
    expect(decodePortfolioPathname("/work/printly")).toBeUndefined();
  });

  it("upgrades legacy hrefs without changing their Desktop launch payloads", () => {
    for (const projectId of [
      "ultra-studio",
      "venor",
      "squizzu",
      "drone-path",
    ] as const) {
      publishCaseStudy(projectId);
    }

    const fixtures: readonly [
      PortfolioLocation,
      AppLaunchPayload,
      PortfolioHref,
    ][] = [
      [
        { area: "studio", projectSlug: "ultrastudio-site" },
        {
          appId: "studio",
          selection: { area: "studio", projectSlug: "ultrastudio-site" },
        },
        "/work/ultra-studio",
      ],
      [
        { area: "personal-project", projectId: "venor" },
        {
          appId: "venor",
          selection: { area: "personal-project", projectId: "venor" },
        },
        "/work/venor",
      ],
      [
        { area: "showcase", slug: "squizzu", view: "live" },
        {
          appId: "site:squizzu",
          selection: { area: "showcase", slug: "squizzu", view: "live" },
        },
        "/work/squizzu",
      ],
      [
        { area: "showcase", slug: "drone-path", view: "overview" },
        {
          appId: "site:drone-path",
          selection: {
            area: "showcase",
            slug: "drone-path",
            view: "overview",
          },
        },
        "/work/drone-path",
      ],
    ];

    for (const [location, launch, href] of fixtures) {
      expect(resolvePortfolioLocation(location)).toEqual({ launch, href });
    }
  });

  it("round-trips canonical project paths and normalizes the legacy alias", () => {
    publishCaseStudy("ultra-studio");
    const location: PortfolioLocation = {
      area: "project",
      projectId: "ultra-studio",
    };

    const href = encodePortfolioLocation(location);
    expect(href).toBe("/work/ultra-studio");
    expect(decodePortfolioPathname(href)).toEqual(location);
    expect(decodePortfolioPathname("/work/ultrastudio-site")).toEqual(location);
    expect(
      resolvePortfolioLocation({
        area: "project",
        projectId: "ultrastudio-site",
      }),
    ).toMatchObject({ href: "/work/ultra-studio" });
  });

  it("rejects malformed and non-project pathnames in the URL codec", () => {
    publishCaseStudy("squizzu");

    expect(decodePortfolioPathname("/work/squizzu/extra")).toBeUndefined();
    expect(decodePortfolioPathname("/work/squizzu/")).toBeUndefined();
    expect(decodePortfolioPathname("/#studio")).toBeUndefined();
    expect(decodePortfolioPathname("/work/%E0%A4%A")).toBeUndefined();
    expect(
      decodePortfolioPathname({ pathname: "/work/squizzu" }),
    ).toBeUndefined();
  });

  it("keeps canonical identity collections resolvable", () => {
    for (const role of allRoles) {
      expect(
        resolvePortfolioLocation({ area: "experience", roleId: role.id }),
      ).toBeDefined();
    }
    for (const project of studioProjects) {
      expect(
        resolvePortfolioLocation({
          area: "studio",
          projectSlug: project.slug,
        }),
      ).toBeDefined();
    }
    for (const project of personalProjects) {
      expect(
        resolvePortfolioLocation({
          area: "personal-project",
          projectId: project.id,
        }),
      ).toBeDefined();
    }
    for (const site of showcase) {
      expect(
        resolvePortfolioLocation({ area: "showcase", slug: site.slug }),
      ).toBeDefined();
    }
  });

  it("fails closed for stale, malformed, and over-specified targets", () => {
    const invalid = [
      null,
      {},
      { area: "missing" },
      { area: "about", roleId: "mandata" },
      { area: "ask-jakub", roleId: "mandata" },
      { area: "experience", roleId: "missing" },
      { area: "education", itemId: "missing" },
      { area: "project", projectId: "missing" },
      { area: "project", projectId: "squizzu", view: "live" },
      { area: "studio", projectSlug: "missing" },
      { area: "personal-project", projectId: "missing" },
      { area: "showcase", slug: "missing" },
      { area: "showcase", slug: "squizzu", view: "source" },
    ];

    for (const location of invalid) {
      expect(resolvePortfolioLocation(location)).toBeUndefined();
    }
  });
});

describe("Portfolio Navigator Adapters", () => {
  it("launches a Desktop App with its semantic selection", () => {
    const launch = vi.fn<(payload: AppLaunchPayload) => void>();
    const navigator = PortfolioNavigator.desktop(launch);
    const location: PortfolioLocation = {
      area: "experience",
      roleId: "mandata",
    };

    expect(navigator.open(location)).toMatchObject({ opened: true });
    expect(launch).toHaveBeenCalledWith({
      appId: "experience",
      selection: location,
    });
  });

  it("uses the canonical href in Simple Mode", () => {
    const navigate = vi.fn<(href: PortfolioHref) => void>();
    const navigator = PortfolioNavigator.simpleMode(navigate);

    expect(
      navigator.open({ area: "education", itemId: "certifications" }),
    ).toMatchObject({ opened: true });
    expect(navigate).toHaveBeenCalledWith("/#extras");
  });

  it("does not invoke either Adapter for an invalid generated target", () => {
    const launch = vi.fn<(payload: AppLaunchPayload) => void>();
    const navigator = PortfolioNavigator.desktop(launch);

    expect(
      navigator.open({
        area: "showcase",
        slug: "missing",
      } as PortfolioLocation),
    ).toEqual({ opened: false, reason: "invalid-location" });
    expect(launch).not.toHaveBeenCalled();
  });
});

describe("Desktop launch selection lifecycle", () => {
  const selection: PortfolioLocation = {
    area: "experience",
    roleId: "mandata",
  };

  it("preserves selection while focusing an open singleton", () => {
    const selected = reduceLaunchSelections(
      new Map(),
      { appId: "experience", selection },
      false,
    );

    expect(
      reduceLaunchSelections(selected, { appId: "experience" }, true).get(
        "experience",
      ),
    ).toEqual(selection);
  });

  it("clears a stale selection when an app is reopened normally", () => {
    const selected = reduceLaunchSelections(
      new Map(),
      { appId: "experience", selection },
      false,
    );

    expect(
      reduceLaunchSelections(selected, { appId: "experience" }, false).has(
        "experience",
      ),
    ).toBe(false);
  });
});

describe("typed singleton window launch", () => {
  beforeEach(() => {
    useWindowStore.setState({ windows: [], focusedId: null, nextZ: 1 });
  });

  it("focuses and restores an existing app instead of duplicating it", () => {
    const store = useWindowStore.getState();
    const options = { size: { w: 640, h: 480 }, area: { w: 1200, h: 800 } };

    store.open("experience", options);
    useWindowStore.getState().minimize("experience");
    useWindowStore.getState().open("experience", options);

    const state = useWindowStore.getState();
    expect(state.windows).toHaveLength(1);
    expect(state.windows[0]).toMatchObject({
      id: "experience",
      minimized: false,
    });
    expect(state.focusedId).toBe("experience");
  });

  it("rejects an unvalidated dynamic app identity", () => {
    expect(() =>
      useWindowStore.getState().open("site:missing" as AppId, {
        size: { w: 640, h: 480 },
        area: { w: 1200, h: 800 },
      }),
    ).toThrow("Unknown Desktop App");
    expect(useWindowStore.getState().windows).toEqual([]);
  });
});
