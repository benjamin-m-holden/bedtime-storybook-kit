import React from "react";
import {AbsoluteFill} from "remotion";
import {Sheet, fontFamily} from "../kit/common";
import {Fox} from "../kit/example/Fox";
import {Owl} from "../kit/example/Owl";

// The cast sheet: every character in three moods and four walk phases, labelled. Render it
// and LOOK at it (npm run still:cast) before drawing a single scene; get the owner's OK on it.
const Label: React.FC<{x: number; y: number; text: string}> = ({x, y, text}) => (
  <text x={x} y={y} textAnchor="middle" fontFamily={fontFamily} fontWeight={600} fontSize={30} fill="#2b2346">{text}</text>
);

const Cast: React.FC = () => {
  const moods: {label: string; mouth: "smile" | "open" | "o"; blink: number; lookOut: number; pose?: "stand" | "curl"}[] = [
    {label: "smile", mouth: "smile", blink: 0, lookOut: 0},
    {label: "talking, facing us", mouth: "open", blink: 0, lookOut: 1},
    {label: "drowsy", mouth: "smile", blink: 1, lookOut: 0},
    {label: "asleep, curled", mouth: "smile", blink: 1, lookOut: 0, pose: "curl"},
  ];
  return (
    <AbsoluteFill style={{background: "#fbf5e6"}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <text x={960} y={64} textAnchor="middle" fontFamily={fontFamily} fontWeight={600} fontSize={44} fill="#2b2346">Cast sheet: Pip (fox) and Moon (owl)</text>
        <line x1={40} x2={1880} y1={490} y2={490} stroke="#d6c9a8" strokeWidth={3} />
        {moods.map((m, i) => (
          <g key={m.label}>
            <Fox x={215 + i * 300} y={420} s={0.6} id={`fox-m${i}`} mouth={m.mouth} blink={m.blink} lookOut={m.lookOut} ears={m.pose ? 0.1 : 0.6} pose={m.pose} />
            <Label x={215 + i * 300} y={455} text={m.label} />
          </g>
        ))}
        {moods.slice(0, 3).map((m, i) => (
          <g key={m.label}>
            <Owl x={1330 + i * 200} y={420} s={0.7} id={`owl-m${i}`} mouth={m.mouth} blink={m.blink} look={i === 0 ? -1 : 0} flap={i === 1 ? 24 : 0} />
            <Label x={1330 + i * 200} y={455} text={m.label} />
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75].map((p, i) => (
          <g key={p}>
            <Fox x={230 + i * 370} y={900} s={0.72} id={`fox-w${i}`} phase={p} tail={Math.sin(p * 6.28) * 7} />
            <Label x={230 + i * 370} y={1010} text={`walk phase ${p}`} />
          </g>
        ))}
        <g>
          <Owl x={1740} y={900} s={0.7} id="owl-w" look={1} flap={-10} />
          <Label x={1740} y={1010} text="looking right" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export const SHEETS: Sheet[] = [{id: "CastSheet", component: Cast, durationInFrames: 1}];
