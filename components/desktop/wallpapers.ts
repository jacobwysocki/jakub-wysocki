import type { L10n } from "@/lib/lang-store";

export type Wallpaper = {
  id: string;
  name: L10n;
  /**
   * Wartość CSS background — gradienty albo url(...) z obrazem.
   * Wpisy obrazkowe ustawiają też sizing przez backgroundSize/Position
   * (patrz getWallpaperStyle).
   */
  css: string;
  /** true = tło obrazkowe (cover + center zamiast czystego gradientu) */
  image?: boolean;
};

/**
 * Chcesz prawdziwe zdjęcie jako tapetę? Wrzuć plik do /public (np.
 * wallpaper-tatry.jpg) i dodaj wpis:
 * { id: "tatry", name: { pl: "Tatry", en: "Tatras" }, css: "url('/wallpaper-tatry.jpg')", image: true }
 */
export const WALLPAPERS: Wallpaper[] = [
  {
    id: "moon",
    name: { pl: "Księżyc", en: "Moon" },
    css: `url("/images/wallpaper-moon.jpg")`,
    image: true,
  },
  {
    id: "gory",
    name: { pl: "Góry", en: "Mountains" },
    css: `url("/images/wallpaper-mountains.jpg")`,
    image: true,
  },
  {
    id: "ultra",
    name: { pl: "Ultra", en: "Ultra" },
    css: "radial-gradient(120% 140% at 80% 0%, rgba(255,106,61,0.32) 0%, rgba(255,106,61,0) 52%), radial-gradient(110% 130% at 8% 100%, rgba(194,65,12,0.5) 0%, rgba(194,65,12,0) 58%), linear-gradient(165deg, #050507 0%, #40180A 58%, #82330D 100%)",
  },
  {
    id: "grafit",
    name: { pl: "Grafit", en: "Graphite" },
    css: "radial-gradient(120% 120% at 75% 8%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 55%), linear-gradient(160deg, #1D1D1F 0%, #101012 55%, #26262B 100%)",
  },
  {
    id: "swit",
    name: { pl: "Świt", en: "Dawn" },
    css: "radial-gradient(100% 90% at 85% 10%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 55%), linear-gradient(170deg, #F5D3AE 0%, #E9B39C 48%, #D98D7B 100%)",
  },
];

/** Pełny styl tła dla danej tapety (obrazy: cover + center) */
export function getWallpaperStyle(id: string): React.CSSProperties {
  const wallpaper = getWallpaper(id);
  return wallpaper.image
    ? {
        backgroundImage: wallpaper.css,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: wallpaper.css };
}

const WALLPAPER_KEY = "jw-wallpaper";

export function loadWallpaperId(): string {
  try {
    const saved = localStorage.getItem(WALLPAPER_KEY);
    if (saved && WALLPAPERS.some((w) => w.id === saved)) return saved;
  } catch {
    /* brak localStorage */
  }
  return WALLPAPERS[0].id;
}

export function saveWallpaperId(id: string) {
  try {
    localStorage.setItem(WALLPAPER_KEY, id);
  } catch {
    /* brak localStorage */
  }
}

export function getWallpaper(id: string): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
}
