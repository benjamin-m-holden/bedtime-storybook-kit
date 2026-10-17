import React from "react";

// Shared helpers for the places. Every place takes these props.
export type PlaceProps = {
  night?: boolean;            // where the place has a night variant
  twinkle?: number;           // seconds-ish clock driving stars / motes (use useIdle().twinkle)
  layer?: "back" | "front" | "all";
  uid?: string;               // unique prefix for SVG ids when one place is drawn twice in a document
};

export const rnd = (seed: number) => {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
};

export const showBack = (layer?: string) => layer !== "front";
export const showFront = (layer?: string) => layer !== "back";

export const Stars: React.FC<{n: number; seed: number; x0?: number; x1?: number; y0?: number; y1: number; twinkle: number; r?: number}> =
  ({n, seed, x0 = 0, x1 = 960, y0 = 0, y1, twinkle, r = 3.4}) => {
    const g = rnd(seed);
    return (
      <g>
        {[...Array(n)].map((_, i) => {
          const x = x0 + g() * (x1 - x0), y = y0 + g() * (y1 - y0), big = g() > 0.82;
          const o = 0.5 + 0.5 * Math.sin(twinkle * 3 + i * 1.7);
          return big ? (
            <path key={i} transform={`translate(${x},${y})`} d="M0,-9 L2.4,-2.4 L9,0 L2.4,2.4 L0,9 L-2.4,2.4 L-9,0 L-2.4,-2.4 Z" fill="#fff8d8" opacity={0.45 + 0.55 * o} />
          ) : (
            <circle key={i} cx={x} cy={y} r={r * (0.6 + g() * 0.7)} fill="#fff8d8" opacity={0.35 + 0.65 * o} />
          );
        })}
      </g>
    );
  };

// A full moon with a soft halo (one radial gradient, so it never shows as rings). `uid` keeps
// the gradient id unique when a document draws more than one.
export const Moon: React.FC<{x: number; y: number; r: number; uid?: string}> = ({x, y, r, uid = "moon"}) => (
  <g>
    <defs>
      <radialGradient id={`${uid}-halo`} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={r * 2.8}>
        <stop offset="0.3" stopColor="rgba(255,240,190,.34)" /><stop offset="0.55" stopColor="rgba(255,240,190,.12)" /><stop offset="1" stopColor="rgba(255,240,190,0)" />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r * 2.8} fill={`url(#${uid}-halo)`} />
    <circle cx={x} cy={y} r={r} fill="#fff1c4" />
    <circle cx={x - r * 0.3} cy={y - r * 0.2} r={r * 0.18} fill="#eedcaa" />
    <circle cx={x + r * 0.32} cy={y + r * 0.3} r={r * 0.13} fill="#eedcaa" />
    <circle cx={x + r * 0.05} cy={y + r * 0.55} r={r * 0.08} fill="#eedcaa" />
  </g>
);

export const Cloud: React.FC<{x: number; y: number; s?: number; fill?: string; opacity?: number}> = ({x, y, s = 1, fill = "#fff", opacity = 1}) => (
  <g transform={`translate(${x},${y}) scale(${s})`} fill={fill} opacity={opacity}>
    <circle cx={-40} cy={0} r={34} /><circle cx={0} cy={-16} r={44} /><circle cx={44} cy={0} r={32} />
    <rect x={-74} y={0} width={150} height={30} rx={15} />
  </g>
);

// Soft darkening at the edges (a vignette), the same on every page.
export const Vignette: React.FC<{uid: string; strength?: number; cy?: number}> = ({uid, strength = 0.35, cy = 0.45}) => (
  <g>
    <defs>
      <radialGradient id={`${uid}-vig`} cx="0.5" cy={cy} r="0.75">
        <stop offset="0.6" stopColor="rgba(0,0,0,0)" /><stop offset="1" stopColor={`rgba(30,15,5,${strength})`} />
      </radialGradient>
    </defs>
    <rect width={960} height={1080} fill={`url(#${uid}-vig)`} />
  </g>
);

// Floor tiles in perspective: rows are the y of each tile edge, columns fan out from a
// vanishing point (vx, vy). colW is the tile width at the last row.
export const FloorTiles: React.FC<{rows: number[]; vx: number; vy: number; colW: number; cols: number; a: string; b: string; line: string; lw?: number}> =
  ({rows, vx, vy, colW, cols, a, b, line, lw = 2.5}) => {
    const yb = rows[rows.length - 1];
    const X = (k: number, y: number) => vx + (k - cols / 2) * colW * ((y - vy) / (yb - vy));
    const out: React.ReactNode[] = [];
    for (let j = 0; j < rows.length - 1; j++) {
      for (let k = 0; k < cols; k++) {
        const y0 = rows[j], y1 = rows[j + 1];
        out.push(<path key={`${j}-${k}`} d={`M${X(k, y0)},${y0} L${X(k + 1, y0)},${y0} L${X(k + 1, y1)},${y1} L${X(k, y1)},${y1} Z`}
                       fill={(j + k) % 2 ? a : b} stroke={line} strokeWidth={lw} strokeLinejoin="round" />);
      }
    }
    return <g>{out}</g>;
  };

// A wavy filled band: surface at y (+ sine), filled down to yBottom. t in seconds.
export const wavePath = (y: number, amp: number, wl: number, speed: number, phase: number, t: number, yBottom = 1080, x0 = -20, x1 = 980, step = 20) => {
  let d = "";
  for (let x = x0; x <= x1; x += step) {
    const yy = y + amp * Math.sin((x / wl) * Math.PI * 2 + t * speed + phase) + amp * 0.35 * Math.sin((x / (wl * 0.53)) * Math.PI * 2 - t * speed * 1.3 + phase * 2);
    d += `${d ? "L" : "M"}${x},${yy.toFixed(1)} `;
  }
  return {line: d, fill: `${d}L${x1},${yBottom} L${x0},${yBottom} Z`};
};

// Clips everything a place draws to its 960x1080 page, so a place never spills onto its neighbour.
export const Page: React.FC<{uid: string; children: React.ReactNode}> = ({uid, children}) => (
  <g>
    <defs><clipPath id={`${uid}-page`}><rect width={960} height={1080} /></clipPath></defs>
    <g clipPath={`url(#${uid}-page)`}>{children}</g>
  </g>
);
