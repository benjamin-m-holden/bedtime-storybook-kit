import React from "react";

// Shared bits for the animals in src/kit/example. Each animal is
// drawn facing RIGHT, origin on the floor under the body centre, y negative up. Every
// animatable thing is a prop (see STYLE.md): the caller drives blink, tail, ears, phase.

export type Mouth = "smile" | "open" | "o" | "frown";

export type CommonProps = {
  x: number; y: number; s?: number;
  id?: string;                 // prefix for SVG ids; defaults to one made from x and y
  flip?: boolean;              // true = faces left
  blink?: number;              // 0 open .. 1 closed
  mouth?: Mouth;               // smile | open | o | frown
  look?: number;               // gaze -1 .. 1 (pupils)
  lookOut?: number | boolean;  // 0 = three-quarter head, 1 = face turned to the viewer
  tail?: number;               // tail sway in degrees
  ears?: number;               // 0 = down .. 1 = perked
  phase?: number;              // cycle 0..1 for walk / run / hop
};

export const TAU = Math.PI * 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lookOutOf = (v: number | boolean | undefined) => (v === true ? 1 : !v ? 0 : clamp01(v));
export const makeId = (id: string | undefined, name: string, x: number, y: number) => id ?? `${name}-${Math.round(x)}-${Math.round(y)}`;

// Gradient in the character's own space, lit from the top-left, so joined parts shade as one.
export const Grad: React.FC<{id: string; light: string; base: string; cx?: number; cy?: number; r?: number}> =
  ({id, light, base, cx = -40, cy = -300, r = 420}) => (
  <radialGradient id={id} gradientUnits="userSpaceOnUse" cx={cx} cy={cy} r={r}>
    <stop offset="0" stopColor={light} /><stop offset="0.55" stopColor={base} /><stop offset="1" stopColor={base} />
  </radialGradient>
);

// A path with a translate+rotate baked into its coordinates. Use it for the parts inside a
// Merge that move (legs, ears, a tail): a `transform` attribute on a child would also move the
// child's copy of the shared gradient (userSpaceOnUse is the referencing element's own space),
// so the part shades differently from the body and shows as a patch. Absolute M/L/C/Q/Z only.
export const placed = (d: string, tx: number, ty: number, deg = 0) => {
  const c = Math.cos((deg * Math.PI) / 180), s = Math.sin((deg * Math.PI) / 180);
  return d.replace(/(-?\d*\.?\d+)[,\s]+(-?\d*\.?\d+)/g, (_, a, b) => {
    const x = +a, y = +b;
    return `${(tx + x * c - y * s).toFixed(1)},${(ty + x * s + y * c).toFixed(1)}`;
  });
};

// Several shapes that read as ONE outlined silhouette: outlines first, then fills on top.
// Children must not carry their own `transform` (see `placed`).
export const Merge: React.FC<{fill: string; ink: string; sw?: number; children: React.ReactNode}> = ({fill, ink, sw = 4, children}) => (
  <g strokeLinejoin="round" strokeLinecap="round">
    <g fill={ink} stroke={ink} strokeWidth={sw * 2}>{children}</g>
    <g fill={fill} stroke="none">{children}</g>
  </g>
);
