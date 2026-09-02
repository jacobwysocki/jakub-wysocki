import { NextResponse, type NextRequest } from "next/server";
import { findCaseStudy, parseProjectId } from "@/data/case-studies";

/**
 * Odrzuca nieznane i nieopublikowane slugi przed dopasowaniem `[slug]`.
 * Przy wielu root layoutach tylko global-not-found składa pełny dokument 404;
 * `notFound()` z dopasowanej trasy nie ma wspólnego root boundary i w
 * produkcyjnym SSR wpada w generyczny `__next_error__`.
 */
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.slice("/work/".length);
  const projectId = parseProjectId(slug);
  const study = projectId ? findCaseStudy(projectId) : undefined;

  if (!projectId || study?.slug !== projectId) {
    const notFoundUrl = request.nextUrl.clone();
    notFoundUrl.pathname = "/__portfolio-not-found";
    return NextResponse.rewrite(notFoundUrl);
  }

  if (slug !== projectId) {
    return NextResponse.redirect(
      new URL(`/work/${projectId}`, request.url),
      308,
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/work/:slug",
};
