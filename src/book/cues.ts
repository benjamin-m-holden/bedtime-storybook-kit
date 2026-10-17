import {Easing, interpolate} from "remotion";

// The listener's chime-ins and the narrator's slips, shared by every book. A story keeps them in
// stories/<name>/cues.json (same shape for each) and calls makeCues(that file) once:
//   export const {CUES, cueAt, listening} = makeCues(cues as Cue[]);
// Nothing here knows which book it is in.
// `who` is "narrator", "listener" or "both".
export type Cue = {at: number; end: number; page: number; who: "narrator" | "listener" | "both" | string; heard: string; react: string; sign?: string; icon?: string};

const ease = Easing.inOut(Easing.cubic);
// eases 0 -> 1 between a and b (or `from` -> `to`; a > b reverses it), clamped
const ramp = (t: number, a: number, b: number, from = 0, to = 1) => a < b
  ? interpolate(t, [a, b], [from, to], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease})
  : interpolate(t, [b, a], [to, from], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease});

export const makeCues = (CUES: Cue[]) => {
  // The cue being heard at story time T, with seconds since it began.
  const cueAt = (T: number) => {
    const c = CUES.find(c => T >= c.at && T < c.end);
    return c ? {cue: c, t: T - c.at} : null;
  };
  // 0..1: how much the characters are "listening out" to the voice outside the book at T
  // (eases in when a listener/both cue starts, out 0.6 s after it ends).
  const listening = (T: number) => Math.max(0, ...CUES.filter(c => c.who !== "narrator").map(c =>
    Math.min(ramp(T, c.at - 0.1, c.at + 0.4), ramp(T, c.end + 0.1, c.end + 0.7, 1, 0))));
  return {CUES, cueAt, listening};
};
