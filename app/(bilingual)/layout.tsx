import type { Metadata, Viewport } from "next";
import SiteDocument, {
  siteMetadata,
  siteViewport,
} from "@/app/_components/SiteDocument";
import { resolveLang } from "@/lib/lang-server";
import "../globals.css";

export const metadata: Metadata = siteMetadata;
export const viewport: Viewport = siteViewport;

/** Dwujęzyczne adresy: język dokumentu i treści pochodzi z jednego resolvera. */
export default async function BilingualRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const lang = await resolveLang();

  return (
    <SiteDocument lang={lang} initializeMode>
      {children}
    </SiteDocument>
  );
}
