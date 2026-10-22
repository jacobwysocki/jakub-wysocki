import { describe, expect, it } from "vitest";

import {
  TECH_FILTERS,
  allRoles,
  deloitteDigital,
  engineeringRoles,
  roleMatchesFilter,
  studioNote,
} from "@/data/experience";

describe("experience order", () => {
  it("opens every role list with the current Deloitte Digital role", () => {
    expect(engineeringRoles[0]).toBe(deloitteDigital);
    expect(allRoles.slice(0, 2)).toEqual([deloitteDigital, studioNote]);
    expect(allRoles.filter((role) => role === deloitteDigital)).toHaveLength(1);
  });

  it("writes the ongoing role in the shared period convention", () => {
    expect(deloitteDigital.period).toEqual({
      pl: "paź 2026 - dziś",
      en: "Oct 2026 - present",
    });
  });
});

describe("experience filters", () => {
  it("keeps every curated filter useful", () => {
    for (const filter of TECH_FILTERS) {
      expect(
        allRoles.some((role) => roleMatchesFilter(role, filter)),
        `${filter} should match at least one role`,
      ).toBe(true);
    }
  });

  it("maps broader filters to detailed technology labels", () => {
    const squizzu = engineeringRoles.find((role) => role.id === "squizzu");
    const university = engineeringRoles.find(
      (role) => role.id === "northumbria",
    );

    expect(squizzu).toBeDefined();
    expect(university).toBeDefined();
    expect(roleMatchesFilter(deloitteDigital, "AI")).toBe(true);
    expect(roleMatchesFilter(squizzu!, "AI")).toBe(true);
    expect(roleMatchesFilter(squizzu!, "SQL")).toBe(true);
    expect(roleMatchesFilter(university!, "Mobile")).toBe(true);
  });
});
