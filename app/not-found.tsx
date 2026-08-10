import type { Metadata } from "next";
import NotFoundView from "@/components/NotFoundView";
import { person } from "@/data/site";

/**
 * Ten plik jest komponentem serwerowym wyłącznie po to, żeby mógł
 * wyeksportować `metadata`. W komponencie klienckim eksport `metadata` jest
 * zabroniony, a bez niego /_not-found renderował <title> strony głównej —
 * czyli każdy błędny adres zapowiadał się w wynikach i podglądach linków
 * jako wizytówka osoby. Cała interaktywna treść siedzi w NotFoundView.
 */
export const metadata: Metadata = {
  title: `404 | ${person.fullName}`,
  // Strona błędu nie ma być indeksowana, ale linki na niej mają być
  // przechodzone — inaczej crawler, który trafi na 404, gubi ścieżkę powrotną
  // na stronę główną.
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundView />;
}
