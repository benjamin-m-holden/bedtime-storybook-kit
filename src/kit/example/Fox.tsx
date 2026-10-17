import React from "react";
import {CommonProps, Grad, Merge, lerp, lookOutOf, makeId, placed, TAU} from "../rig";

// Pip, the example fox. Faces RIGHT, origin on the floor under the body, y negative up,
// about 360 tall at s=1 with the ears up. Everything that moves is a prop (see STYLE.md):
//   blink 0..1, mouth, look -1..1, lookOut 0..1 (3/4 head -> face turned to the viewer),
//   tail (degrees of sway), ears 0..1, phase 0..1 (walk cycle),
//   pose "stand" (default) | "curl" (asleep in a ball: body on the floor, tail round the front).
//
// Built ONCE from parts, joined the way a body is: the tail, body, chest, head, ears and the
// near legs all go through one Merge, so a single outline wraps the whole silhouette and the
// hips, the neck and the ear roots are hidden inside it. The moving parts are placed with
// `placed()` (coordinates baked in) so they shade with the same gradient as the body. The far
// legs are the same shape in a darker shade, drawn behind. Details (cream patches, inner ears,
// face, paws) go on top. Copy this file to make a new animal.
const INK = "#5a2a12", FUR = "#e8892b", LIGHT = "#ffc47a", CREAM = "#fff1d8";
const FAR = "#cf7424", SOCK = "#3b1c0c", SOCK_FAR = "#4a2410", PINK = "#f4a6a0";

// A leg in its own space: hip pivot at (0,0), paw sole at y = LEG (the floor when the hip is
// at -LEG). The rounded top sits inside the body, so the hip never shows.
const LEG = 128;
const LEG_PATH = "M-24,-14 C-24,-30 24,-30 24,-14 C26,34 19,74 16,96 C28,100 32,118 24,128 L-24,128 C-32,118 -28,100 -16,96 C-19,74 -26,34 -24,-14 Z";
const SOCK_PATH = "M-16,96 Q0,88 16,96 C28,100 32,118 24,128 L-24,128 C-32,118 -28,100 -16,96 Z";
// An ear: base centre at (0,0) inside the head, tip at (-2,-78).
const EAR_PATH = "M-26,10 C-18,-30 -10,-60 -2,-78 C8,-60 16,-30 24,10 Z";
const EAR_INNER = "M-14,2 C-9,-24 -5,-42 -2,-54 C2,-42 6,-24 12,2 Z";
// The tail: root at (0,0) inside the rump, trailing left; the cream tip is its last third.
const TAIL_PATH = "M0,-20 C-40,-44 -104,-58 -142,-40 C-176,-24 -176,20 -144,30 C-104,42 -40,24 0,16 Z";
const TAIL_TIP = "M-142,-40 C-176,-24 -176,20 -144,30 C-128,22 -126,-22 -142,-40 Z";

export type FoxPose = "stand" | "curl";

// The face, drawn round a head centre (hx, hy); shared by both poses.
const Face: React.FC<{hx: number; hy: number; lo: number; blink: number; mouth: string; look: number; ears: number}> =
  ({hx, hy, lo, blink, mouth, look, ears}) => {
  const eyeX = [lerp(hx - 16, hx - 20, lo), lerp(hx + 18, hx + 20, lo)];
  const eyeOpen = Math.max(0.08, 1 - blink);
  const noseX = lerp(hx + 56, hx, lo), noseY = hy + 26;
  const earFar = {x: lerp(hx - 26, hx - 34, lo), y: hy - 40, a: -8 - (1 - ears) * 30};
  const earNear = {x: lerp(hx + 30, hx + 34, lo), y: hy - 38, a: 8 + (1 - ears) * 30};
  return (
    <g>
      <path d={placed(EAR_INNER, earFar.x, earFar.y, earFar.a)} fill={PINK} />
      <path d={placed(EAR_INNER, earNear.x, earNear.y, earNear.a)} fill={PINK} />
      <ellipse cx={lerp(hx + 40, hx, lo)} cy={hy + 28} rx={lerp(36, 52, lo)} ry={24} fill={CREAM} />
      {eyeX.map((ex, i) => eyeOpen < 0.25 ? (
        <path key={i} d={`M${ex - 11},${hy - 4} Q${ex},${hy + 6} ${ex + 11},${hy - 4}`} fill="none" stroke={INK} strokeWidth={3.4} />
      ) : (
        <g key={i} transform={`translate(${ex},${hy - 6}) scale(1,${eyeOpen})`}>
          <ellipse cx={0} cy={0} rx={11} ry={14} fill="#fff" stroke={INK} strokeWidth={2.4} />
          <circle cx={look * 4} cy={1} r={7} fill="#2a1608" />
          <circle cx={look * 4 + 3} cy={-3} r={2.6} fill="#fff" />
        </g>
      ))}
      <ellipse cx={noseX} cy={noseY} rx={9} ry={7} fill="#2a1608" />
      {mouth === "smile" && <path d={`M${noseX - 18},${noseY + 12} Q${noseX},${noseY + 28} ${noseX + 18},${noseY + 12}`} fill="none" stroke={INK} strokeWidth={3.2} />}
      {mouth === "open" && <path d={`M${noseX - 18},${noseY + 10} Q${noseX},${noseY + 44} ${noseX + 18},${noseY + 10} Z`} fill="#6a2a3c" stroke={INK} strokeWidth={3} />}
      {mouth === "o" && <ellipse cx={noseX} cy={noseY + 20} rx={8} ry={11} fill="#6a2a3c" stroke={INK} strokeWidth={3} />}
      {mouth === "frown" && <path d={`M${noseX - 16},${noseY + 22} Q${noseX},${noseY + 10} ${noseX + 16},${noseY + 22}`} fill="none" stroke={INK} strokeWidth={3.2} />}
    </g>
  );
};
// The head's shapes for the Merge: skull, muzzle, both ears.
const headShapes = (hx: number, hy: number, lo: number, ears: number) => (
  <g>
    <ellipse cx={hx} cy={hy} rx={60} ry={54} />
    <ellipse cx={lerp(hx + 42, hx, lo)} cy={hy + 22} rx={lerp(44, 40, lo)} ry={30} />
    <path d={placed(EAR_PATH, lerp(hx - 26, hx - 34, lo), hy - 40, -8 - (1 - ears) * 30)} />
    <path d={placed(EAR_PATH, lerp(hx + 30, hx + 34, lo), hy - 38, 8 + (1 - ears) * 30)} />
  </g>
);

// Asleep in a ball, about 200 tall: the body on the floor, the head resting on it at the right,
// the tail curled round the front with its cream tip under the chin.
const TAIL_CURL = "M-116,-70 C-176,-50 -170,10 -110,8 C-30,12 50,8 118,-6 C142,-12 140,-40 118,-40 C70,-34 10,-30 -60,-38 C-96,-44 -108,-58 -116,-70 Z";
const TAIL_CURL_TOP = "M-60,-38 C10,-30 70,-34 118,-40";
const TAIL_CURL_TIP = "M86,-36 C100,-38 110,-39 118,-40 C140,-40 142,-12 118,-6 C106,-4 96,-3 86,-3 C94,-14 94,-26 86,-36 Z";
const Curled: React.FC<{k: string; blink: number; mouth: string; look: number; ears: number; lo: number}> = ({k, blink, mouth, look, ears, lo}) => {
  const hx = 76, hy = -112;
  return (
    <g>
      <ellipse cx={0} cy={2} rx={165} ry={14} fill="rgba(40,25,10,.22)" />
      <Merge fill={`url(#${k}-g)`} ink={INK} sw={4}>
        <ellipse cx={-20} cy={-70} rx={136} ry={70} />
        <path d={TAIL_CURL} />
        {headShapes(hx, hy, lo, ears)}
      </Merge>
      <path d={TAIL_CURL_TOP} fill="none" stroke={INK} strokeWidth={3} opacity={0.8} />
      <path d={TAIL_CURL_TIP} fill={CREAM} />
      <Face hx={hx} hy={hy} lo={lo} blink={blink} mouth={mouth} look={look} ears={ears} />
    </g>
  );
};

export const Fox: React.FC<CommonProps & {pose?: FoxPose}> = ({x, y, s = 1, id, flip, blink = 0, mouth = "smile", look = 0, lookOut, tail = 0, ears = 0.5, phase = 0, pose = "stand"}) => {
  const k = makeId(id, "fox", x, y);
  const lo = lookOutOf(lookOut);
  if (pose === "curl") return (
    <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`} strokeLinejoin="round" strokeLinecap="round">
      <defs><Grad id={`${k}-g`} light={LIGHT} base={FUR} cx={-40} cy={-200} r={360} /></defs>
      <Curled k={k} blink={blink} mouth={mouth} look={look} ears={ears} lo={lo} />
    </g>
  );
  // Walk cycle: diagonal pairs swing together. A leg swings forward (and lifts) on one half of
  // the cycle and is planted on the other; the planted leg is pushed down by what its rotation
  // would otherwise lift, so the paw sits on the floor line in every phase.
  const walking = phase !== 0;
  const legPose = (off: number) => {
    const q = TAU * (phase + off);
    const ang = walking ? Math.sin(q) * 18 : 0;
    const lift = walking ? Math.max(0, -Math.cos(q)) * 18 : 0;
    const settle = LEG * (1 - Math.cos((ang * Math.PI) / 180));
    return {ang, dy: settle - lift};
  };
  const bob = walking ? -3 * (0.5 + 0.5 * Math.cos(TAU * phase * 2)) : 0;
  const leg = (d: string, lx: number, off: number, up = 0) => {
    const {ang, dy} = legPose(off);
    return placed(d, lx, -LEG + dy - up, ang);
  };
  // Legs: [x, cycle offset]. Near pair in the Merge, far pair behind in a darker shade.
  const nearLegs: [number, number][] = [[-46, 0], [86, 0.5]];
  const farLegs: [number, number][] = [[-68, 0.5], [64, 0]];

  // Head: three-quarter view at lo=0, turned to the viewer at lo=1.
  const hx = lerp(128, 112, lo), hy = -246 + bob;
  const tailAt = (d: string) => placed(d, -94, -190, 14 + tail);
  return (
    <g transform={`translate(${x},${y}) scale(${flip ? -s : s},${s})`} strokeLinejoin="round" strokeLinecap="round">
      <defs><Grad id={`${k}-g`} light={LIGHT} base={FUR} cx={-40} cy={-300} r={420} /></defs>
      <ellipse cx={10} cy={2} rx={150} ry={16} fill="rgba(40,25,10,.22)" />
      {/* far legs: same shape, a shade darker, behind the body */}
      {farLegs.map(([lx, off]) => (
        <g key={lx}>
          <path d={leg(LEG_PATH, lx, off)} fill={FAR} stroke={INK} strokeWidth={4} />
          <path d={leg(SOCK_PATH, lx, off)} fill={SOCK_FAR} />
        </g>
      ))}
      <g transform={`translate(0,${bob})`}>
        <Merge fill={`url(#${k}-g)`} ink={INK} sw={4}>
          <path d={tailAt(TAIL_PATH)} />
          <ellipse cx={0} cy={-176} rx={118} ry={62} />
          <ellipse cx={80} cy={-196} rx={52} ry={56} />
          {headShapes(hx, hy, lo, ears)}
          {nearLegs.map(([lx, off]) => <path key={lx} d={leg(LEG_PATH, lx, off, bob)} />)}
        </Merge>
        {/* markings on top of the joined silhouette */}
        <path d={tailAt(TAIL_TIP)} fill={CREAM} />
        <ellipse cx={14} cy={-138} rx={80} ry={28} fill={CREAM} opacity={0.92} />
        <Face hx={hx} hy={hy} lo={lo} blink={blink} mouth={mouth} look={look} ears={ears} />
      </g>
      {/* near paws (dark socks) sit on the merged legs */}
      {nearLegs.map(([lx, off]) => <path key={lx} d={leg(SOCK_PATH, lx, off)} fill={SOCK} />)}
    </g>
  );
};
