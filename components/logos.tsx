type LogoProps = {
  className?: string;
};

/** Znaki marek — pliki SVG w /public/app-icons (białe, pod ciemne kafelki). */

export function UltraStudioLogo({ className = "" }: LogoProps) {
  return (
    <img
      src="/app-icons/us-icon.svg"
      alt=""
      aria-hidden
      className={`object-contain ${className}`}
    />
  );
}

export function SquizzuLogo({ className = "" }: LogoProps) {
  return (
    <img
      src="/app-icons/squizzu-icon.svg"
      alt=""
      aria-hidden
      className={`object-contain ${className}`}
    />
  );
}

export function DroneIcon({ className = "" }: LogoProps) {
  return (
    <img
      src="/app-icons/drone-icon.svg"
      alt=""
      aria-hidden
      className={`object-contain ${className}`}
    />
  );
}
