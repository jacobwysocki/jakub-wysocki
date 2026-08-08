import { describe, expect, it } from "vitest";

import {
  TECH_FILTERS,
  allRoles,
  engineeringRoles,
  roleMatchesFilter,
} from "@/data/experience";

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
    expect(roleMatchesFilter(squizzu!, "AI")).toBe(true);
    expect(roleMatchesFilter(squizzu!, "SQL")).toBe(true);
    expect(roleMatchesFilter(university!, "Mobile")).toBe(true);
  });
});
