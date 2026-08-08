import type { AppId } from "./app-catalog";
import type { PortfolioLocation } from "./contract";
import type { AppLaunchPayload } from "./locations";

export type AppLaunchSelections = ReadonlyMap<AppId, PortfolioLocation>;

/**
 * A semantic selection is a launch intent, not durable app state.
 *
 * Focusing an already-open singleton preserves its current intent. Reopening
 * an app after it was closed clears an old intent unless the new launch brings
 * an explicit replacement.
 */
export function reduceLaunchSelections(
  current: AppLaunchSelections,
  payload: AppLaunchPayload,
  appAlreadyOpen: boolean,
): AppLaunchSelections {
  if (payload.selection) {
    const next = new Map(current);
    next.set(payload.appId, payload.selection);
    return next;
  }

  if (appAlreadyOpen || !current.has(payload.appId)) return current;

  const next = new Map(current);
  next.delete(payload.appId);
  return next;
}
