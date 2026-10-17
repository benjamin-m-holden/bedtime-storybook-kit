import React from "react";
import {rand, STAR4} from "./rand";

// Twinkling four-point stars scattered round an area. (x, y) is the centre, `w` x `h` the
// size of the area (stars sit on and inside the ellipse; with `ring` they hug its edge).
// `size` is the biggest star radius. Driven by `t` in seconds.
export type SparklesProps = {
  x: number; y: number; t: number; w?: number; h?: number; count?: number; size?: number; color?: string; ring?: boolean; id?: string;
};

export const Sparkles: React.FC<SparklesProps> = ({x, y, t, w = 300, h = 200, count = 12, size = 22, color = "#ffd65a", ring = true, id}) => (
  <g transform={`translate(${x},${y})`} data-fx={id}>
    {[...Array(count)].map((_, i) => {
      const a = (i / count) * Math.PI * 2 + rand(i, 1) * 0.6;
      const rr = ring ? 0.85 + rand(i, 2) * 0.25 : Math.sqrt(rand(i, 2));
      const px = Math.cos(a) * (w / 2) * rr, py = Math.sin(a) * (h / 2) * rr;
      const ph = t * (0.9 + rand(i, 3) * 0.8) + rand(i, 4) * 6.28;
      const tw = Math.max(0, Math.sin(ph));
      const sc = (0.25 + 0.75 * tw) * size * (0.6 + rand(i, 5) * 0.5);
      return (
        <g key={i} transform={`translate(${px},${py}) rotate(${Math.sin(ph * 0.5) * 18})`} opacity={0.35 + 0.65 * tw}>
          <path d={STAR4} transform={`scale(${sc})`} fill={color} stroke="#e09a1a" strokeWidth={2.2 / Math.max(sc, 1)} strokeLinejoin="round" />
          <circle r={sc * 0.16} fill="#fff" />
        </g>
      );
    })}
  </g>
);
