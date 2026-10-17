import {useCurrentFrame} from "remotion";
import {loadFont} from "@remotion/google-fonts/Fredoka";

export const {fontFamily} = loadFont("normal", {weights: ["500", "600"]});

// Idle motion shared by every character: a blink every few seconds, a slow tail sway, a
// wing flap and a hand wave. `offset` desynchronises characters in the same scene.
export const useIdle = (offset = 0) => {
  const f = useCurrentFrame() + offset;
  const cycle = f % 110;
  const blink = cycle < 3 ? cycle / 3 : cycle < 6 ? (6 - cycle) / 3 : 0;
  return {f, blink, tail: Math.sin(f / 18) * 7, flap: Math.sin(f / 5) * 12, wave: Math.sin(f / 4) * 14,
          twinkle: f / 30, phase: (f % 24) / 24};
};

// A sheet is a composition that shows part of the kit for review.
export type Sheet = {id: string; component: React.FC; durationInFrames?: number};
