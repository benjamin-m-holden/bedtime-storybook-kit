import React from "react";
import {fontFamily} from "../common";

// Comic sound words ("BOOM!", "SPLASH!", "ZZZ"): chunky Fredoka 600 with a
// coloured gradient fill, a thick white outline and a dark outer edge. (x, y) is the
// middle of the baseline; `size` is the font size; `rot` tilts it in degrees; `pop` scales
// about the middle (animate 0 -> 1.15 -> 1 for a pop-in). `color` is the fill colour and
// `dark` the shade at the bottom of the letters.
export type BigWordProps = {
  x: number; y: number; text: string; size?: number; color?: string; dark?: string; rot?: number; pop?: number; id: string;
};

export const BigWord: React.FC<BigWordProps> = ({x, y, text, size = 96, color = "#ff5a4a", dark = "#c42a2a", rot = -7, pop = 1, id}) => {
  const g = `bigword-${id}`;
  const common = {x: 0, y: 0, textAnchor: "middle" as const, fontFamily, fontWeight: 600, fontSize: size, strokeLinejoin: "round" as const, letterSpacing: size * 0.02};
  return (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${pop}) translate(0,${-size * 0.3})`}>
      <defs>
        <linearGradient id={`${g}-fill`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} /><stop offset="1" stopColor={dark} /></linearGradient>
      </defs>
      <text {...common} transform={`translate(${size * 0.04},${size * 0.06})`} fill="rgba(40,25,10,.25)" stroke="rgba(40,25,10,.25)" strokeWidth={size * 0.2}>{text}</text>
      <text {...common} fill="#2b2346" stroke="#2b2346" strokeWidth={size * 0.2}>{text}</text>
      <text {...common} fill="#fff" stroke="#fff" strokeWidth={size * 0.14}>{text}</text>
      <text {...common} fill={`url(#${g}-fill)`}>{text}</text>
      <text {...common} fill="none" stroke="#fff" strokeWidth={size * 0.03} opacity={0.35} transform={`translate(${-size * 0.01},${-size * 0.025})`}>{text}</text>
    </g>
  );
};
