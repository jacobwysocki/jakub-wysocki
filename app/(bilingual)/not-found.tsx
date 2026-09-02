import type { Metadata } from "next";
import NotFoundView from "@/components/NotFoundView";
import { person } from "@/data/site";

export const metadata: Metadata = {
  title: `404 | ${person.fullName}`,
  robots: { index: false, follow: true },
};

/** Obsługuje `notFound()` rzucane wewnątrz dwujęzycznych tras. */
export default function BilingualNotFound() {
  return <NotFoundView />;
}
