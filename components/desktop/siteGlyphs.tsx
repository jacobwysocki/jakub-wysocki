import { SquizzuLogo, DroneIcon } from "@/components/logos";

/**
 * Brandowe znaki żywych stron (data/showcase.ts) — wspólne dla kafelków
 * na pulpicie/docku (registry) i nagłówka/ekranu ładowania okna (SiteApp).
 * Rozmiary procentowe: skalują się do kwadratowego kontenera kafelka.
 */
export const SITE_GLYPHS: Record<string, React.ReactNode> = {
  squizzu: <SquizzuLogo className="h-[54%] w-[54%] drop-shadow-xs" />,
  "drone-path": <DroneIcon className="h-[56%] w-[56%] drop-shadow-xs" />,
};
