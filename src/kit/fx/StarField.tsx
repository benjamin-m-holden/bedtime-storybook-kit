import React from "react";
import {rand, STAR4} from "./rand";

// Night-sky stars in the rectangle (x, y, w, h), twinkling with `t` (seconds). Pure
// stars, no sky: put it over your night gradient (`#141c4e` -> `#3b3480`). `sky` draws that
// gradient behind them for a standalone panel. `seed` picks a different arrangement.
export type StarFieldProps = {
  x: number; y: number; w: number; h: number; t: number; count?: number; seed?: number; sky?: boolean; id?: string;
};

export const StarField: React.FC<StarFieldProps> = ({x, y, w, h, t, count = 60, seed = 0, sky = false, id = "sf"}) => (
  <g transform={`translate(${x},${y})`}>
    {sky && (
      <g>
        <defs><linearGradient id={`starfield-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141c4e" /><stop offset="1" stopColor="#3b3480" /></linearGradient></defs>
        <rect x={0} y={0} width={w} height={h} fill={`url(#starfield-${id})`} />
      </g>
    )}
    {[...Array(count)].map((_, i) => {
      const k = i + seed * 1000;
      const px = rand(k, 1) * w, py = rand(k, 2) * h;
      const big = rand(k, 3) > 0.82;
      const ph = t * (0.6 + rand(k, 4) * 1.4) + rand(k, 5) * 6.28;
      const tw = 0.55 + 0.45 * Math.sin(ph);
      const r = big ? 7 + rand(k, 6) * 6 : 1.6 + rand(k, 6) * 2.2;
      return big ? (
        <path key={i} d={STAR4} transform={`translate(${px},${py}) scale(${r * (0.7 + 0.3 * tw)})`} fill="#fff8d8" opacity={0.5 + 0.5 * tw} />
      ) : (
        <circle key={i} cx={px} cy={py} r={r * (0.75 + 0.25 * tw)} fill="#fff8d8" opacity={0.35 + 0.65 * tw} />
      );
    })}
  </g>
);
