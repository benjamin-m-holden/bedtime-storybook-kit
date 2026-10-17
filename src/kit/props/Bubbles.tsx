import React from "react";
import {fontFamily} from "../common";

const INK = "#2b2346";

// Rough Fredoka 600 text width in units of font size.
export const textWidth = (text: string, fs: number) => {
  let w = 0;
  for (const ch of text) {
    if ("iljtf.,!':;|I ".includes(ch)) w += 0.34;
    else if ("mwMW".includes(ch)) w += 0.86;
    else if (ch >= "A" && ch <= "Z") w += 0.66;
    else w += 0.56;
  }
  return w * fs;
};

// SpeechBubble: white bubble with a 5-unit #2b2346 outline, Fredoka 600 text. Width grows with
// the text; "\n" starts a new line. `pop` scales the whole thing about the tail tip (animate
// 0 -> 1 for a pop-in that grows out of the speaker's mouth).
//
// Three ways to place it:
//  - `speaker: {mouth, head}` (the comic-book way): the tail POINTS at the
//    mouth but its tip stops just outside the speaker's head ellipse (an 8 px gap), so it never
//    crosses a face. The body is put beside or above the head, on `side` when it fits, and never
//    over any zone in `avoid` (every character's head ellipse AND body boxes); it stays inside
//    the 960x1080 page. Candidates are scored by tail length plus a small penalty for leaving the
//    asked side, so a bubble crowded off its side goes to the nearest clear spot, not the far one.
//    (x, y) then nudge the body. The rule: a tail must never cross a
//    face, and a body must never cover another character.
//  - `to: [tipX, tipY]` (or `tipX`, `tipY`): the tail tip, put at the speaker's MOUTH, and the body
//    sits BESIDE the head on `side` ("left" | "right" | "up"), up and out of the way of the face,
//    kept inside the 960-wide page. (x, y) then nudge the body from that spot. Set `cx`/`cy` to put
//    the body centre exactly somewhere instead.
//  - legacy: (x, y) is the tail tip and the body sits straight above it, the tail leaning out of
//    its lower-left ("left"), lower-right ("right") or middle ("down") -- the old `tail` prop.
// The tail is a curved, tapering comma from the body edge to the tip, drawn in one pass with the
// body so the join is seamless.
export type Head = {cx: number; cy: number; rx: number; ry: number};
export type Box = {x0: number; y0: number; x1: number; y1: number};   // an axis-aligned rect in page coordinates
export type Zone = Head | Box;                                          // anything a bubble must keep off: a head ellipse or a body box
export const isBox = (z: Zone): z is Box => "x0" in z;
export type SpeechBubbleProps = {
  x?: number; y?: number; text: string; tail?: "left" | "right" | "down"; fontSize?: number; pop?: number; id?: string;
  to?: [number, number]; tipX?: number; tipY?: number; side?: "left" | "right" | "up"; cx?: number; cy?: number;
  bend?: number;   // how much the tail bows (0 straight, 1 a full comma); default 0.6
  head?: number;   // with `to` and side left/right: how far the speaker's head reaches sideways from the lips (ears, hair), so the body clears it
  rise?: number;   // with `to`: how far above the lips the body's bottom edge sits (default 1.5 x fontSize; raise it over a horn or a bow)
  speaker?: {mouth: [number, number]; head: Head};
  avoid?: Zone[];  // every character on the page, whole: head ellipses AND body boxes (the speaker's too). The body never sits on
                   // one and the tail never crosses one; the tail's last reach to the speaker's own head edge is the only exception.
                   // heads alone left bubbles on legs and tails, so list body boxes here too.
  minFontSize?: number;  // with `speaker`: the text shrinks (4 px a step, never below this; default 30) when no clear spot fits the full size
  bounds?: Box;    // with `speaker`: the visible area in the bubble's own frame (default the 960-wide page); a zoomed page passes the part still on screen
};

const PAGE_W = 960, MARGIN = 18;
const inHead = (px: number, py: number, h: Head, pad = 0) => ((px - h.cx) / (h.rx + pad)) ** 2 + ((py - h.cy) / (h.ry + pad)) ** 2 < 1;
export const inZone = (px: number, py: number, z: Zone, pad = 0) =>
  isBox(z) ? px > z.x0 - pad && px < z.x1 + pad && py > z.y0 - pad && py < z.y1 + pad : inHead(px, py, z, pad);
// does the rect (centre, size) touch the zone? for an ellipse: its nearest point to the centre, plus the rim sampled.
export const rectHitsZone = (cx: number, cy: number, w: number, h: number, z: Zone, pad = 6) => {
  const L = cx - w / 2 - pad, R = cx + w / 2 + pad, T = cy - h / 2 - pad, B = cy + h / 2 + pad;
  if (isBox(z)) return L < z.x1 && R > z.x0 && T < z.y1 && B > z.y0;
  const qx = Math.max(L, Math.min(R, z.cx)), qy = Math.max(T, Math.min(B, z.cy));
  if (inHead(qx, qy, z)) return true;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, px = z.cx + Math.cos(a) * z.rx, py = z.cy + Math.sin(a) * z.ry;
    if (px > L && px < R && py > T && py < B) return true;
  }
  return false;
};
const sameHead = (a: Zone, b: Head) => !isBox(a) && a.cx === b.cx && a.cy === b.cy && a.rx === b.rx && a.ry === b.ry;
// where the line from C toward M first meets the ellipse (t in 0..1 along C->M), or undefined
const hitEllipse = (C: [number, number], M: [number, number], e: Head): number | undefined => {
  const fx = (C[0] - e.cx) / e.rx, fy = (C[1] - e.cy) / e.ry, dx = (M[0] - C[0]) / e.rx, dy = (M[1] - C[1]) / e.ry;
  const A = dx * dx + dy * dy, B = 2 * (fx * dx + fy * dy), K = fx * fx + fy * fy - 1;
  const disc = B * B - 4 * A * K;
  if (A < 1e-9 || disc < 0) return undefined;
  const t = (-B - Math.sqrt(disc)) / (2 * A);
  return t >= 0 && t <= 1 ? t : undefined;
};
// the tail tip for a body centred at C: on the line C -> mouth, 8 px outside the speaker's head
const tipFor = (C: [number, number], M: [number, number], H: Head): [number, number] => {
  const t = hitEllipse(C, M, H);
  if (t === undefined) return M;
  const px = C[0] + (M[0] - C[0]) * t, py = C[1] + (M[1] - C[1]) * t, d = Math.hypot(M[0] - C[0], M[1] - C[1]) || 1;
  return [px - (M[0] - C[0]) / d * 8, py - (M[1] - C[1]) / d * 8];
};
// the tail: a curved, tapering comma from the body edge to the tip. Returned as its two quadratic edges, so the same
// shape is drawn and checked (and reported through data-bubble).
type Tail = {b1: [number, number]; m1: [number, number]; b2: [number, number]; m2: [number, number]; tip: [number, number]; reach: number};
const tailFor = (CX: number, CY: number, TX: number, TY: number, w: number, h: number, fs: number, bend: number): Tail => {
  const dx = TX - CX, dy = TY - CY;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const kEdge = Math.min(w / 2 / Math.max(1e-6, Math.abs(dx) / len), h / 2 / Math.max(1e-6, Math.abs(dy) / len));
  const kIn = Math.max(0, kEdge - fs * 0.5);
  const bx = CX + ux * kIn, by = CY + uy * kIn;
  const px = -uy, py = ux;                              // perpendicular
  const half = Math.min(fs * 0.42, len * 0.22);
  const sgn = dx === 0 ? 1 : -Math.sign(dx);            // the comma hangs out of the body and swoops down to the lips
  const b1: [number, number] = [bx + px * half, by + py * half], b2: [number, number] = [bx - px * half, by - py * half];
  const reach = Math.max(0, len - kIn);
  const bow = bend * reach * 0.36 * sgn;
  const m1: [number, number] = [(b1[0] + TX) / 2 + px * bow, (b1[1] + TY) / 2 + py * bow];
  const m2: [number, number] = [(b2[0] + TX) / 2 + px * bow * 0.7, (b2[1] + TY) / 2 + py * bow * 0.7];
  return {b1, m1, b2, m2, tip: [TX, TY], reach};
};
const q = (a: [number, number], c: [number, number], b: [number, number], t: number): [number, number] =>
  [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
// points along both edges of the tail (the visible part only: from the body edge, past the inset start)
export const tailSamples = (t: Tail, n = 10): [number, number][] => {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) { out.push(q(t.b1, t.m1, t.tip, i / n)); out.push(q(t.b2, t.m2, t.tip, i / n)); }
  return out;
};

export const SpeechBubble: React.FC<SpeechBubbleProps> = ({x = 0, y = 0, text, tail = "left", fontSize = 44, pop = 1, to, tipX, tipY, side, cx, cy, bend = 0.6, head = 0, rise, speaker, avoid, minFontSize = 30, bounds}) => {
  const lines = text.split("\n");
  let fs = fontSize;
  const size = (f: number) => {
    const w = Math.max(...lines.map((l) => textWidth(l, f))) + f * 1.6;
    return {w, h: lines.length * f * 1.2 + f * 0.8};
  };
  let {w, h} = size(fs);
  const tailLen = fs * 1.1;
  // tip and body centre in page coordinates
  let TX: number, TY: number, CX: number, CY: number;
  const tip = to ?? (tipX !== undefined && tipY !== undefined ? [tipX, tipY] as [number, number] : undefined);
  if (speaker) {
    const H = speaker.head, M = speaker.mouth, zones: Zone[] = avoid && avoid.length ? avoid : [H];
    const sd = side ?? "left";
    const B = bounds ?? {x0: 0, y0: 0, x1: PAGE_W, y1: 1e9};
    type Best = {cx: number; cy: number; score: number; bad: number};
    // place the body for a text size: beside the head on the asked side, else above, else anywhere clear on the page
    const place = (f: number, w: number, h: number): Best => {
      const gap = f * 0.95;                                    // body edge to head edge: room for a visible tail
      const clampX = (v: number) => Math.max(B.x0 + w / 2 + MARGIN, Math.min(B.x1 - w / 2 - MARGIN, v));
      const clampY = (v: number) => Math.max(B.y0 + h / 2 + MARGIN, Math.min(B.y1 - h / 2 - MARGIN, v));
      type Cand = {cx: number; cy: number; pen: number};
      const cands: Cand[] = [];
      const sidePen = (s: "left" | "right" | "up") => (s === sd ? 0 : s === "up" ? 90 : 150);   // beside the head on the asked side unless that costs a much longer tail
      for (const s of ["left", "right"] as const) {
        const bx = s === "left" ? H.cx - H.rx - gap - w / 2 : H.cx + H.rx + gap + w / 2;
        const ys = [H.cy - H.ry * 0.5, H.cy - H.ry - h / 2 + 24];
        for (let k = 1; k <= 8; k++) ys.push(H.cy - H.ry - h / 2 + 24 - 70 * k);
        for (const by of ys) cands.push({cx: bx, cy: by, pen: sidePen(s)});
        // pushed further out, for a head that another head stands right beside
        for (let k = 1; k <= 3; k++) cands.push({cx: bx + (s === "left" ? -1 : 1) * 90 * k, cy: ys[0], pen: sidePen(s) + 10 * k});
      }
      const topY = H.cy - H.ry - gap - h / 2;
      const shifts = [0, 0.35, -0.35, 0.7, -0.7, 1.0, -1.0];
      for (const lift of [0, 90, 180, 270]) for (const sh of shifts) cands.push({cx: H.cx + sh * w, cy: topY - lift, pen: sidePen("up") + Math.abs(sh) * 30});
      // the whole page on a coarse grid, well behind the shaped candidates: a crowded page takes the nearest clear spot
      for (let gx = B.x0 + w / 2 + MARGIN; gx <= B.x1 - w / 2 - MARGIN + 1; gx += 40) for (let gy = B.y0 + h / 2 + MARGIN; gy <= H.cy; gy += 40)
        cands.push({cx: gx, cy: gy, pen: 200 + Math.abs(gx - H.cx) * 0.15});
      let best: Best | undefined;
      for (const c of cands) {
        const bx = clampX(c.cx + x), by = clampY(c.cy + y);
        let bad = 0;
        for (const z of zones) if (rectHitsZone(bx, by, w, h, z)) bad += 1;
        const [tx, ty] = tipFor([bx, by], M, H);
        const tl = tailFor(bx, by, tx, ty, w, h, f, bend);
        const pts = tailSamples(tl, 8);
        for (const z of zones) if (!sameHead(z, H)) { for (const p of pts) if (inZone(p[0], p[1], z, 3)) { bad += 0.5; break; } }
        const score = bad * 10000 + tl.reach + c.pen;
        if (!best || score < best.score) best = {cx: bx, cy: by, score, bad};
      }
      return best!;
    };
    let best = place(fs, w, h);
    // no clear spot at this size: a little smaller, down to minFontSize, keeps a crowded page's characters uncovered
    while (best.bad > 0 && fs - 4 >= minFontSize) {
      const f = fs - 4, sz = size(f), b = place(f, sz.w, sz.h);
      fs = f; w = sz.w; h = sz.h; best = b;
    }
    CX = cx ?? best.cx; CY = cy ?? best.cy;
    [TX, TY] = tipFor([CX, CY], M, H);
  } else if (tip) {
    [TX, TY] = tip;
    const sd = side ?? "left";
    const gap = fs * 0.7 + head, up = rise ?? fs * 1.5;
    CX = cx ?? (sd === "up" ? TX : sd === "left" ? TX - gap - w / 2 : TX + gap + w / 2) + x;
    CY = cy ?? TY - up - h / 2 + y;
    // keep the body on the page
    CX = Math.max(w / 2 + MARGIN, Math.min(PAGE_W - w / 2 - MARGIN, CX));
    CY = Math.max(h / 2 + MARGIN, CY);
  } else {
    TX = x; TY = y;
    const tipLocal = tail === "left" ? Math.max(fs * 1.2, w * 0.14) : tail === "right" ? w - Math.max(fs * 1.2, w * 0.14) : w / 2;
    CX = x - tipLocal + w / 2; CY = y - tailLen - h / 2;
  }
  const rx = Math.min(h / 2, fs * 1.1);
  const tl = tailFor(CX, CY, TX, TY, w, h, fs, bend);
  const tailD = `M${tl.b1[0]},${tl.b1[1]} Q${tl.m1[0]},${tl.m1[1]} ${TX},${TY} Q${tl.m2[0]},${tl.m2[1]} ${tl.b2[0]},${tl.b2[1]} Z`;
  const hasTail = tl.reach > fs * 0.3;
  const shape = (
    <g>
      <rect x={CX - w / 2} y={CY - h / 2} width={w} height={h} rx={rx} />
      {hasTail && <path d={tailD} strokeLinejoin="round" />}
    </g>
  );
  // the geometry, for tools/bubble_check.py (body rect, tail edge samples, the zones it was kept off)
  const geom = JSON.stringify({cx: CX, cy: CY, w, h, fs, text, tail: hasTail ? tailSamples(tl, 10).map(p => [Math.round(p[0]), Math.round(p[1])]) : [],
    speakerHead: speaker?.head, avoid: avoid ?? []});
  return (
    <g transform={`translate(${TX},${TY}) scale(${pop}) translate(${-TX},${-TY})`} data-bubble={geom}>
      <g fill={INK} stroke={INK} strokeWidth={10} strokeLinejoin="round">{shape}</g>
      <g fill="#fff" stroke="#fff" strokeWidth={0.5} strokeLinejoin="round">{shape}</g>
      {lines.map((l, i) => (
        <text key={i} x={CX} y={CY - h / 2 + fs * 0.4 + fs * 1.2 * (i + 0.5) + fs * 0.34} textAnchor="middle" fontFamily={fontFamily} fontWeight={600} fontSize={fs} fill={INK}>{l}</text>
      ))}
    </g>
  );
};

// ThoughtBubble: a cloud with `children` inside (drawn in the cloud own frame: (0,0) is
// the cloud centre, so a character or a prop at x=0,y=0 sits in the middle). (x, y) is the
// smallest trail dot, near the thinker head; the cloud floats up and to the right of it.
// `w`, `h` set the cloud size. `pop` scales about the trail dot.
export type ThoughtBubbleProps = {
  x: number; y: number; w?: number; h?: number; pop?: number; id?: string; children?: React.ReactNode;
};

export const ThoughtBubble: React.FC<ThoughtBubbleProps> = ({x, y, w = 300, h = 220, pop = 1, children}) => {
  const rx = w / 2, ry = h / 2;
  const cx = rx * 0.55, cy = -ry * 1.45 - 26;
  const n = 11;
  const bumps = [...Array(n)].map((_, i) => {
    const a = (i / n) * Math.PI * 2;
    return {x: Math.cos(a) * rx * 0.86, y: Math.sin(a) * ry * 0.84, r: Math.min(rx, ry) * 0.3};
  });
  const trail = [{x: 0, y: 0, r: 7}, {x: rx * 0.2, y: -ry * 0.34 - 6, r: 12}, {x: rx * 0.38, y: -ry * 0.72 - 16, r: 18}];
  const shape = (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx * 0.88} ry={ry * 0.84} />
      {bumps.map((b, i) => <circle key={i} cx={cx + b.x} cy={cy + b.y} r={b.r} />)}
      {trail.map((t, i) => <circle key={`t${i}`} cx={t.x} cy={t.y} r={t.r} />)}
    </g>
  );
  return (
    <g transform={`translate(${x},${y}) scale(${pop})`}>
      <g fill={INK} stroke={INK} strokeWidth={10}>{shape}</g>
      <g fill="#fff" stroke="#fff" strokeWidth={0.5}>{shape}</g>
      <g transform={`translate(${cx},${cy})`}>{children}</g>
    </g>
  );
};
