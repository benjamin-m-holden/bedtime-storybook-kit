import React from "react";
import {fontFamily} from "../common";

// Sleeping Z's drifting up and to the right from (x, y) (put it by the sleeper head),
// growing and fading, looping with `t` (seconds). `rise` is the travel height, `size` the
// biggest letter size, `color` the letter fill.
export type ZzzProps = {x: number; y: number; t: number; rise?: number; size?: number; color?: string; speed?: number; id?: string};

export const Zzz: React.FC<ZzzProps> = ({x, y, t, rise = 170, size = 64, color = "#cfe0ff", speed = 0.28}) => (
  <g transform={`translate(${x},${y})`}>
    {[0, 1, 2].map((i) => {
      const p = (t * speed + i / 3) % 1;
      const sc = 0.4 + p * 0.6;
      const op = Math.min(1, p * 5) * Math.min(1, (1 - p) * 3);
      return (
        <text key={i} x={p * rise * 0.55 + Math.sin(p * 6 + i) * 8} y={-p * rise} textAnchor="middle" fontFamily={fontFamily} fontWeight={600}
              fontSize={size * sc} fill={color} stroke="#3b3480" strokeWidth={size * sc * 0.12} paintOrder="stroke" strokeLinejoin="round"
              opacity={op} transform={`rotate(${-10 + Math.sin(p * 5 + i) * 8} ${p * rise * 0.55} ${-p * rise})`}>Z</text>
      );
    })}
  </g>
);
