import type { Metadata, Viewport } from "next";
import SiteDocument, {
  siteMetadata,
  siteViewport,
} from "@/app/_components/SiteDocument";
import "../globals.css";

export const metadata: Metadata = siteMetadata;
export const viewport: Viewport = siteViewport;

/** `/about` ma stały język na URL i nie może zależeć od ciastka. */
export default function EnglishRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SiteDocument lang="en">{children}</SiteDocument>;
}
