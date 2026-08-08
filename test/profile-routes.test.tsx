import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import AboutPage from "@/app/about/page";
import OMniePage from "@/app/o-mnie/page";
import { person } from "@/data/site";

afterEach(cleanup);

describe("localized profile routes", () => {
  it("renders the English profile and links to its Polish counterpart", () => {
    const { container } = render(<AboutPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: person.fullName }),
    ).toBeInTheDocument();
    expect(container.querySelector('[lang="en"]')).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Przeczytaj tę stronę po polsku" }),
    ).toHaveAttribute("href", person.entityHome.pl);
  });

  it("renders the Polish profile and links to its English counterpart", () => {
    const { container } = render(<OMniePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: person.fullName }),
    ).toBeInTheDocument();
    expect(container.querySelector('[lang="pl"]')).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Read this page in English" }),
    ).toHaveAttribute("href", person.entityHome.en);
  });
});
