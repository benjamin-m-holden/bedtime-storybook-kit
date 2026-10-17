import React from "react";
import {AbsoluteFill, Composition} from "remotion";
import {fontFamily} from "./kit/common";
import {SHEETS as cast} from "./sheets/CastSheet";
import {SHEETS as book} from "./sheets/ExampleBook";
import {SHEETS as flip} from "./sheets/FlipStills";

// Each sheets/*.tsx file lists its own compositions, so separate pieces of work never
// edit this file: add your story's sheet file here and nothing else.
const SmokeTest: React.FC = () => (
  <AbsoluteFill style={{background: "#1c2560", justifyContent: "center", alignItems: "center", color: "#ffecaa", fontSize: 96, fontFamily}}>Kit</AbsoluteFill>
);

export const RemotionRoot: React.FC = () => (
  <>
    {[...cast, ...book, ...flip].map(s => (
      <Composition key={s.id} id={s.id} component={s.component} durationInFrames={s.durationInFrames ?? 150} fps={30} width={1920} height={1080} />
    ))}
    <Composition id="Kit" component={SmokeTest} durationInFrames={90} fps={30} width={1920} height={1080} />
  </>
);
