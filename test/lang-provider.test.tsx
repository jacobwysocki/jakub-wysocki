import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const routerRefresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

import LangProvider from "@/components/LangProvider";
import LangSwitch from "@/components/LangSwitch";
import { LANG_COOKIE } from "@/lib/lang";

describe("LangProvider", () => {
  beforeEach(() => {
    routerRefresh.mockReset();
    document.cookie = `${LANG_COOKIE}=;path=/;max-age=0`;
    document.documentElement.lang = "en";
  });

  afterEach(cleanup);

  it("switches content optimistically and refreshes server metadata", () => {
    render(
      <LangProvider initialLang="en">
        <LangSwitch tone="light" />
      </LangProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "pl" }));

    expect(screen.getByRole("button", { name: "pl" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(document.documentElement.lang).toBe("pl");
    expect(document.cookie).toContain(`${LANG_COOKIE}=pl`);
    expect(routerRefresh).toHaveBeenCalledOnce();
  });
});
