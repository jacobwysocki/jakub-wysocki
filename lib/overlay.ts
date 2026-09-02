/**
 * Sygnał najwyższej warstwy modalnej.
 *
 * Nakładki pełnoekranowe (lightbox iteracji) żyją PONAD oknami pulpitu
 * i arkuszem mobilnym, ale te warstwy słuchają klawiatury na window w fazie
 * capture i rejestrują się wcześniej, więc kolejność listenerów nie może
 * rozstrzygać, kto obsłuży Escape. Zamiast tego nakładka oznacza się
 * atrybutem, a niższe warstwy ustępują, dopóki atrybut istnieje w DOM.
 */
export const TOPMOST_OVERLAY_ATTR = "data-topmost-overlay";

/** Czy jakaś nakładka pełnoekranowa jest otwarta nad bieżącą warstwą. */
export function hasTopmostOverlay(): boolean {
  return (
    typeof document !== "undefined" &&
    document.querySelector(`[${TOPMOST_OVERLAY_ATTR}]`) !== null
  );
}
