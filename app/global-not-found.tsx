import type { Metadata } from "next";
import SiteDocument from "@/app/_components/SiteDocument";
import NotFoundView from "@/components/NotFoundView";
import { person } from "@/data/site";
import "./globals.css";

/**
 * Globalny 404 omija root layouty, więc sam zwraca cały dokument. Nie czyta
 * ciastka ani nagłówków: pozostaje statyczny, a LangProvider w NotFoundView
 * może po hydratacji dopasować dwujęzyczną treść do przeglądarki.
 */
export const metadata: Metadata = {
  title: `404 | ${person.fullName}`,
  // Strona błędu nie ma być indeksowana, ale linki na niej mają być
  // przechodzone — inaczej crawler, który trafi na 404, gubi ścieżkę powrotną
  // na stronę główną.
  robots: { index: false, follow: true },
};

export default function GlobalNotFound() {
  return (
    <SiteDocument lang="en">
      <NotFoundView />
    </SiteDocument>
  );
}
