"use client";

/**
 * Rysunek konstrukcyjny znaku Venora, w liczbach wprost z brandbooka:
 * siatka 64 jednostek, obserwacja r8 w (20,20), konkluzja r12
 * w (37.333, 37.333), kurs 45°, środek ciężkości ważony polami dokładnie
 * w (32,32), pola kół w stosunku 4:9. To geometria, nie ilustracja —
 * każda linia odpowiada wymiarowi, który da się sprawdzić.
 */

const INK = "#171216";
const MULBERRY = "#8A2853";
const MUTED = "#6B6066";

/** Współrzędne konstrukcyjne znaku. */
const SMALL = { cx: 20, cy: 20, r: 8 };
const LARGE = { cx: 37.333333, cy: 37.333333, r: 12 };

export default function VenorConstruction() {
  const gridLines = Array.from({ length: 7 }, (_, i) => (i + 1) * 8);

  return (
    <svg
      viewBox="-13 -8 90 82"
      role="img"
      aria-label="Rysunek konstrukcyjny znaku Venora / Construction drawing of the Venor mark"
      className="h-auto w-full"
    >
      {/* Siatka co 8 jednostek */}
      {gridLines.map((v) => (
        <g key={v} stroke={INK} strokeOpacity="0.06" strokeWidth="0.22">
          <line x1={v} y1={0} x2={v} y2={64} />
          <line x1={0} y1={v} x2={64} y2={v} />
        </g>
      ))}
      {/* Pole konstrukcyjne 64 × 64 */}
      <rect
        x="0"
        y="0"
        width="64"
        height="64"
        fill="none"
        stroke={INK}
        strokeOpacity="0.28"
        strokeWidth="0.35"
      />
      <text
        x="0"
        y="-3"
        fontSize="3"
        fill={MUTED}
        fontFamily="ui-monospace, monospace"
      >
        64 × 64
      </text>

      {/* Kurs 45°: przedłużona przerywana oś przez oba środki */}
      <line
        x1={SMALL.cx - 9}
        y1={SMALL.cy - 9}
        x2={LARGE.cx + 13}
        y2={LARGE.cy + 13}
        stroke={MUTED}
        strokeOpacity="0.55"
        strokeWidth="0.35"
        strokeDasharray="1.4 1.4"
      />
      <text
        x={SMALL.cx - 11.5}
        y={SMALL.cy - 10.5}
        fontSize="3"
        fill={MUTED}
        fontFamily="ui-monospace, monospace"
      >
        45°
      </text>

      {/* Obserwacja: r8, rysunek liniowy */}
      <circle
        cx={SMALL.cx}
        cy={SMALL.cy}
        r={SMALL.r}
        fill="none"
        stroke={INK}
        strokeWidth="0.6"
      />
      <line
        x1={SMALL.cx}
        y1={SMALL.cy}
        x2={SMALL.cx - SMALL.r}
        y2={SMALL.cy}
        stroke={INK}
        strokeWidth="0.35"
      />
      <circle cx={SMALL.cx} cy={SMALL.cy} r="0.7" fill={INK} />
      <text
        x={SMALL.cx - SMALL.r - 1.6}
        y={SMALL.cy + 1}
        fontSize="3"
        fill={INK}
        textAnchor="end"
        fontFamily="ui-monospace, monospace"
      >
        r 8
      </text>

      {/* Konkluzja: r12, wypełniona produkcyjnym burgundem */}
      <circle
        cx={LARGE.cx}
        cy={LARGE.cy}
        r={LARGE.r}
        fill={MULBERRY}
        fillOpacity="0.12"
        stroke={MULBERRY}
        strokeWidth="0.6"
      />
      <line
        x1={LARGE.cx}
        y1={LARGE.cy}
        x2={LARGE.cx + LARGE.r}
        y2={LARGE.cy}
        stroke={MULBERRY}
        strokeWidth="0.35"
      />
      <circle cx={LARGE.cx} cy={LARGE.cy} r="0.7" fill={MULBERRY} />
      <text
        x={LARGE.cx + LARGE.r + 1.6}
        y={LARGE.cy + 1}
        fontSize="3"
        fill={MULBERRY}
        fontFamily="ui-monospace, monospace"
      >
        r 12
      </text>

      {/* Środek ciężkości ważony polami: dokładnie (32,32) */}
      <g stroke={INK} strokeOpacity="0.7" strokeWidth="0.35">
        <line x1={30.4} y1={32} x2={33.6} y2={32} />
        <line x1={32} y1={30.4} x2={32} y2={33.6} />
      </g>
      <text
        x={33.4}
        y={30.8}
        fontSize="2.6"
        fill={MUTED}
        fontFamily="ui-monospace, monospace"
      >
        (32, 32)
      </text>

      {/* Stosunek pól */}
      <text
        x="64"
        y="70.5"
        fontSize="3"
        fill={MUTED}
        textAnchor="end"
        fontFamily="ui-monospace, monospace"
      >
        4 : 9
      </text>
    </svg>
  );
}
