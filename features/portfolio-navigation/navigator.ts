import type { PortfolioLocation } from "./contract";
import {
  resolvePortfolioLocation,
  type AppLaunchPayload,
  type PortfolioHref,
  type ResolvedPortfolioLocation,
} from "./locations";

export type PortfolioNavigationResult =
  | Readonly<{
      opened: true;
      target: ResolvedPortfolioLocation;
    }>
  | Readonly<{
      opened: false;
      reason: "invalid-location";
    }>;

export type PortfolioNavigationAdapter = Readonly<{
  open(target: ResolvedPortfolioLocation): void;
}>;

export type PortfolioNavigator = Readonly<{
  open(location: PortfolioLocation): PortfolioNavigationResult;
}>;

export type DesktopLaunch = (payload: AppLaunchPayload) => void;
export type SimpleModeNavigate = (href: PortfolioHref) => void;

export function createPortfolioNavigator(
  adapter: PortfolioNavigationAdapter,
): PortfolioNavigator {
  return {
    open(location) {
      const target = resolvePortfolioLocation(location);
      if (!target) return { opened: false, reason: "invalid-location" };
      adapter.open(target);
      return { opened: true, target };
    },
  };
}

export function createDesktopNavigationAdapter(
  launch: DesktopLaunch,
): PortfolioNavigationAdapter {
  return {
    open(target) {
      launch(target.launch);
    },
  };
}

export function createSimpleModeNavigationAdapter(
  navigate: SimpleModeNavigate,
): PortfolioNavigationAdapter {
  return {
    open(target) {
      navigate(target.href);
    },
  };
}

/** Factory namespace for the two real in-process presentation Adapters. */
export const PortfolioNavigator = Object.freeze({
  desktop(launch: DesktopLaunch): PortfolioNavigator {
    return createPortfolioNavigator(createDesktopNavigationAdapter(launch));
  },

  simpleMode(navigate: SimpleModeNavigate): PortfolioNavigator {
    return createPortfolioNavigator(
      createSimpleModeNavigationAdapter(navigate),
    );
  },
});
