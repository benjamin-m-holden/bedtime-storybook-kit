import React from "react";
import {CommonProps, Grad, Merge, makeId, placed} from "../rig";

// Moon, the example owl. She stands on the floor (or a branch) facing the viewer, about 400
// tall at s=1 with the ear tufts. Props: blink 0..1, mouth ("smile" shuts the beak, "open" opens
// it), look -1..1 (the face turns toward that side), flap (wing angle in degrees, 0 = folded),
// tail is unused. Her feet sit at y = 0: on a branch, put y on the branch's top edge and the
// toes curl over its front.
//
// One Merge wraps body, head, ear tufts and both wings, so the wings grow from the shoulder
// and the neck never shows; the wing's inner edge is a line drawn on top. Moving wings are
// placed with `placed()` so they shade with the body (see rig.tsx).
const INK = "#2e2a3a", FEATHER = "#9aa0b4", LIGHT = "#d3d8e8", BELLY = "#e9e6dc", BEAK = "#f0b13c", BEAK_INK = "#8a5a12";

// Right wing in its own space: shoulder pivot at (0,0), hanging down and a little out.
const WING = "M-12,-8 C30,-2 60,60 46,150 C38,200 16,224 -6,212 C-24,160 -34,80 -12,-8 Z";
const WING_EDGE = "M-12,-8 C-34,80 -24,160 -6,212";
const WING_LINES = "M14,120 C30,150 28,180 14,204 M-2,80 C12,110 14,150 4,190";
const mirror = (d: string) => d.replace(/(-?\d*\.?\d+)([,\s]+)(-?\d*\.?\d+)/g, (_, a, sep, b) => `${-(+a)}${sep}${b}`);

export const Owl: React.FC<CommonProps & {flap?: number}> = ({x, y, s = 1, id, flip, blink = 0, mouth = "smile", look = 0, flap = 0}) => {
  const k = makeId(id, "owl", x, y);
  const open = Math.max(0.08, 1 - blink);
  const fx = look * 9;                        // the face disc slides a little toward where she looks, staying inside the head
  const spread = Math.max(0, flap);          // folded is 0; a negative flap would turn the wings into the body
  const wing = (side: 1 | -1, d: string) => placed(side === 1 ? d : mirror(d), side * 62, -248, -side * spread);
  const Foot: React.FC<{fx: number}> = ({fx}) => (
    <g>
      <Merge fill={BEAK} ink={BEAK_INK} sw={2.5}>
        <ellipse cx={fx} cy={-16} rx={22} ry={11} />
        <ellipse cx={fx - 15} cy={-6} rx={7} ry={11} />
        <ellipse cx={fx} cy={-4} rx={7} ry={12} />
        <ellipse cx={fx + 15} cy={-6} rx={7} ry={11} />
      </Merge>
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`} strokeLinejoin="round" strokeLinecap="round">
      <defs><Grad id={`${k}-g`} light={LIGHT} base={FEATHER} cx={-40} cy={-340} r={300} /></defs>
      <ellipse cx={0} cy={2} rx={90} ry={10} fill="rgba(40,25,10,.22)" />
      <Merge fill={`url(#${k}-g)`} ink={INK} sw={4}>
        <path d={wing(-1, WING)} />
        <path d={wing(1, WING)} />
        <ellipse cx={0} cy={-150} rx={96} ry={122} />
        <ellipse cx={0} cy={-300} rx={86} ry={76} />
        <path d="M-82,-336 C-80,-370 -72,-398 -60,-418 C-46,-396 -32,-376 -20,-362 Z" />
        <path d="M82,-336 C80,-370 72,-398 60,-418 C46,-396 32,-376 20,-362 Z" />
      </Merge>
      {/* belly and its soft feather rows */}
      <ellipse cx={0} cy={-132} rx={60} ry={88} fill={BELLY} />
      {[-150, -116, -82, -48].map((yy, i) => (
        <path key={i} d={`M${-36 + (i % 2) * 12},${yy} q12,14 24,0 q12,14 24,0 ${i % 2 ? "" : "q12,14 24,0"}`} fill="none" stroke="#c9c3b1" strokeWidth={2.6} />
      ))}
      {/* the wings' inner edges, on top of the merged silhouette */}
      {([-1, 1] as const).map(sd => (
        <g key={sd} fill="none" stroke={INK}>
          <path d={wing(sd, WING_EDGE)} strokeWidth={3.2} opacity={0.85} />
          <path d={wing(sd, WING_LINES)} strokeWidth={2.4} opacity={0.45} />
        </g>
      ))}
      <Foot fx={-36} /><Foot fx={36} />
      {/* face: a heart-shaped disc, eyes, beak */}
      <g transform={`translate(${fx},0)`}>
        <Merge fill={BELLY} ink={INK} sw={2.6}>
          <circle cx={-34} cy={-306} r={40} />
          <circle cx={34} cy={-306} r={40} />
        </Merge>
        {[-1, 1].map(sd => (
          <g key={sd} transform={`translate(${sd * 34},-306)`}>
            {open < 0.25 ? <path d="M-24,2 Q0,18 24,2" fill="none" stroke={INK} strokeWidth={4} /> : (
              <g transform={`scale(1,${open})`}>
                <circle cx={look * 5} r={22} fill="#f3c34a" stroke={INK} strokeWidth={2.4} />
                <circle cx={look * 7} r={11} fill="#1d1a26" />
                <circle cx={look * 7 + 5} cy={-6} r={4} fill="#fff" />
              </g>
            )}
          </g>
        ))}
        {mouth === "open"
          ? <path d="M-13,-280 L13,-280 L0,-246 Z M-11,-278 L11,-278 L0,-264 Z" fill={BEAK} stroke={INK} strokeWidth={3} />
          : <path d="M-13,-284 L13,-284 L0,-256 Z" fill={BEAK} stroke={INK} strokeWidth={3} />}
      </g>
    </g>
  );
};
