import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Sheet} from "../kit/common";
import {PageText} from "../book/Book";
import {SCENES, Cover, EndLeft, EndRight, END} from "./ExampleBook";
import pages from "../../stories/example/pages.json";
import moments from "../../stories/example/moments.json";

// Stills for the web flip book (web/render_stills.py). One frame per still: frames 0..N-1
// are the N pictures, frame N the front cover, frame N+1 the closing spread. Each picture is
// drawn at the story time in moments.json (page number -> seconds) or, when a page is not
// listed, at the middle of its page.
const PAPER = "#fbf5e6", LEAD = 0.8;
const P = pages as PageText[];
const N = P.length;
const starts = P.map((p, i) => (i === 0 ? 0 : p.s[0].at - LEAD));
const M = (moments as {T: Record<string, number>}).T;

const FlipStills: React.FC = () => {
  const f = useCurrentFrame();
  if (f < N) {
    const S = SCENES[f];
    const dur = (f + 1 < N ? starts[f + 1] : END + 0.4) - starts[f];
    const tt = M[String(f + 1)] ?? starts[f] + dur / 2;
    return (
      <AbsoluteFill style={{background: PAPER}}>
        <svg viewBox="0 0 960 1080" width={960} height={1080} style={{display: "block"}}>
          <S t={tt - starts[f]} T={tt} dur={dur} />
        </svg>
      </AbsoluteFill>
    );
  }
  if (f === N) return <AbsoluteFill><Cover t={2} /></AbsoluteFill>;
  return (
    <AbsoluteFill style={{background: PAPER}}>
      <div style={{position: "absolute", left: 0, top: 0, width: 960, height: 1080}}><EndLeft t={3} /></div>
      <svg viewBox="0 0 960 1080" width={960} height={1080} style={{position: "absolute", left: 960, top: 0}}>
        <EndRight t={3} T={END + 3} dur={8} />
      </svg>
    </AbsoluteFill>
  );
};

export const SHEETS: Sheet[] = [{id: "FlipStills", component: FlipStills, durationInFrames: N + 2}];
