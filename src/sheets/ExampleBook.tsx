import React from "react";
import {Sheet, fontFamily, useIdle} from "../kit/common";
import {Book, PageText, Scene} from "../book/Book";
import {Cue, makeCues} from "../book/cues";
import {clamp01} from "../kit/rig";
import {Fox} from "../kit/example/Fox";
import {Owl} from "../kit/example/Owl";
import {BRANCH, GROUND_Y, Meadow, branchTop} from "../kit/example/Meadow";
import {Sparkles} from "../kit/fx/Sparkles";
import {Zzz} from "../kit/fx/Zzz";
import {StarField} from "../kit/fx/StarField";
import {SpeechBubble, Zone} from "../kit/props/Bubbles";
import pages from "../../stories/example/pages.json";
import cues from "../../stories/example/cues.json";
import meta from "../../stories/example/meta.json";

// The example book: the pattern every story follows. The audio is public/example.m4a (made
// by stories/example/make_audio.py; for a real story it is a clean AAC copy of the recording).
// INTRO: the front cover, which swings open before the narration; END: story time of the last
// spoken word; OUTRO: the closing spread. All three come from meta.json.
const INTRO = meta.intro, END = meta.end, OUTRO = meta.outro;
const P = pages as PageText[];
const {listening} = makeCues(cues as Cue[]);
const told = meta.told_by || "____";
const to = meta.told_to || "____";

// The sentence being said: its text shows as a speech bubble for `len` seconds from `at`.
const at = (page: number, sentence = 0) => P[page - 1].s[sentence].at;
const spoken = (T: number, from: number, len = 2.8) => (T >= from && T < from + len ? clamp01((T - from) / 0.25) : 0);

const GY = GROUND_Y + 30, FS = 1.15;
// Pip standing at (px, GY): where his head and mouth are on the page, for bubbles, and the
// zones a bubble must keep off: his head, his ears (a box above it) and his body.
const pipHead = (px: number) => ({cx: px + 128 * FS, cy: GY - 246 * FS, rx: 60 * FS, ry: 54 * FS});
const pipMouth = (px: number): [number, number] => [px + 184 * FS, GY - 200 * FS];
const pipZones = (px: number): Zone[] => [pipHead(px),
  {x0: px + 66 * FS, y0: GY - 368 * FS, x1: px + 200 * FS, y1: GY - 296 * FS},
  {x0: px - 270 * FS, y0: GY - 250 * FS, x1: px + 70 * FS, y1: GY}];
// Moon on her branch: feet on the limb's top edge, toes over its front.
const OWL = {x: BRANCH.x - 30, y: branchTop(BRANCH.x - 30), s: 0.75};
const owlHead = {cx: OWL.x, cy: OWL.y - 300 * OWL.s, rx: 86 * OWL.s, ry: 76 * OWL.s};
const owlMouth: [number, number] = [OWL.x, OWL.y - 268 * OWL.s];
const owlZones: Zone[] = [owlHead, {x0: OWL.x - 124 * OWL.s, y0: OWL.y - 420 * OWL.s, x1: OWL.x + 124 * OWL.s, y1: OWL.y}];

// A picture page: slow push-in on everything, characters between the meadow's back and front.
const Frame: React.FC<{t: number; dur: number; night?: boolean; children: React.ReactNode}> = ({t, dur, night = true, children}) => {
  const {twinkle} = useIdle();
  const z = 1 + 0.05 * clamp01(t / dur);
  return (
    <g transform={`translate(480,640) scale(${z}) translate(-480,-640)`}>
      <Meadow night={night} twinkle={twinkle} layer="back" uid="mb" />
      {children}
      <Meadow night={night} twinkle={twinkle} layer="front" uid="mf" />
    </g>
  );
};

const Page1: Scene = ({t, dur}) => {
  const {blink, tail} = useIdle();
  return <Frame t={t} dur={dur}><Fox x={340} y={GY} s={FS} blink={blink} tail={tail} mouth="frown" ears={0.4} /></Frame>;
};

const Page2: Scene = ({t, T, dur}) => {
  const {blink, tail, twinkle} = useIdle(20);
  const a = at(2);
  return (
    <Frame t={t} dur={dur}>
      <StarField x={0} y={0} w={960} h={600} t={twinkle} count={110} seed={3} />
      <Fox x={340} y={GY} s={FS} blink={blink} tail={tail} mouth="o" look={0.6} ears={0.7} />
      {T >= a && <SpeechBubble text={"...47, 48, 49..."} speaker={{mouth: pipMouth(340), head: pipHead(340)}} avoid={pipZones(340)} side="up" pop={spoken(T, a)} />}
    </Frame>
  );
};

const Page3: Scene = ({t, T, dur}) => {
  const {blink, tail} = useIdle(40);
  const land = clamp01(t / 1.4);                       // Moon glides down onto the branch
  const flap = (1 - land) * 40 + Math.sin(t * 16) * 12 * (1 - land);
  const hear = listening(T);                           // 0..1: Pip glances out at the viewer
  const a = at(3, 1);
  return (
    <Frame t={t} dur={dur}>
      <Fox x={340} y={GY} s={FS} blink={hear > 0.5 ? 0 : blink} tail={tail} lookOut={hear} look={hear > 0.5 ? 0 : 0.8} mouth={hear > 0.5 ? "o" : "smile"} ears={0.9} />
      <Owl {...OWL} y={OWL.y - (1 - land) * 340} x={OWL.x - (1 - land) * 160} blink={blink} flap={flap} look={-0.8} mouth={T >= a && T < a + 2.4 ? "open" : "smile"} />
      {T >= a && <SpeechBubble text={"Why are you awake?"} speaker={{mouth: owlMouth, head: owlHead}}
                               avoid={[...owlZones, ...pipZones(340)]} side="left" pop={spoken(T, a)} />}
    </Frame>
  );
};

const Page4: Scene = ({t, T, dur}) => {
  const {blink, tail} = useIdle(60);
  const a = at(4), yawn = T >= a + 1.4 && T < a + 3;
  return (
    <Frame t={t} dur={dur}>
      <Fox x={340} y={GY} s={FS} blink={yawn ? 1 : blink} tail={tail * 0.4} mouth={yawn ? "open" : "smile"} ears={0.3} />
      <Owl {...OWL} blink={blink} look={-0.8} />
      {T >= a && <SpeechBubble text={"I am not sleepy"} speaker={{mouth: pipMouth(340), head: pipHead(340)}} avoid={[...pipZones(340), ...owlZones]} side="up" pop={spoken(T, a, 1.6)} />}
    </Frame>
  );
};

const Page5: Scene = ({t, T, dur}) => {
  const {blink, twinkle} = useIdle(80);
  const drowsy = 0.5 * clamp01((T - at(5)) / 5);        // Pip's eyes droop as the song goes on
  return (
    <Frame t={t} dur={dur}>
      <Fox x={340} y={GY} s={FS} blink={Math.max(drowsy, blink * 0.5)} tail={0} mouth="smile" ears={0.2} />
      <Owl {...OWL} blink={blink} look={-0.8} mouth="open" flap={Math.sin(t * 2) * 6} />
      {[0, 1, 2].map(i => {
        const p = ((t * 0.3 + i / 3) % 1);
        return <text key={i} x={OWL.x - 90 - p * 120 + Math.sin(p * 9) * 12} y={OWL.y - 330 - p * 160} fontSize={56} fontFamily={fontFamily} fontWeight={600} fill="#fff1c4" opacity={Math.sin(p * Math.PI)}>♪</text>;
      })}
      <Sparkles x={OWL.x} y={OWL.y - 150} t={twinkle} w={320} h={300} count={8} size={20} />
    </Frame>
  );
};

const Sleeper: React.FC<{t: number; T: number; dur: number}> = ({t, T, dur}) => {
  const {twinkle} = useIdle(100);
  return (
    <Frame t={t} dur={dur}>
      <Fox x={400} y={GY} s={FS} pose="curl" blink={1} mouth="smile" ears={0.1} />
      <Zzz x={400 + 120 * FS} y={GY - 175 * FS} t={T} />
      <Sparkles x={480} y={300} t={twinkle} w={700} h={300} count={10} size={18} ring={false} />
    </Frame>
  );
};
const Page6: Scene = Sleeper;

const SCENES: Scene[] = [Page1, Page2, Page3, Page4, Page5, Page6];

// Front cover: the whole 1920x1080 frame.
const Cover: React.FC<{t: number}> = ({t}) => {
  const {twinkle} = useIdle();
  void t;
  return (
    <div style={{position: "absolute", inset: 0, background: "#1c2560"}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080}>
        <rect x={30} y={30} width={1860} height={1020} rx={36} fill="none" stroke="#ffd65a" strokeWidth={6} />
        <text x={960} y={170} textAnchor="middle" fontFamily={fontFamily} fontWeight={600} fontSize={104} fill="#ffecaa">{meta.title}</text>
        <svg x={540} y={205} width={840} height={780} viewBox="0 0 960 1080" overflow="hidden">
          <Meadow night twinkle={twinkle} uid="cov" layer="back" />
          <Fox x={340} y={GY} s={FS} blink={0} lookOut={1} mouth="smile" ears={0.6} id="cover-fox" />
          <Owl {...OWL} look={-0.6} id="cover-owl" />
          <Meadow night twinkle={twinkle} uid="covf" layer="front" />
        </svg>
        <text x={960} y={1020} textAnchor="middle" fontFamily={fontFamily} fontWeight={500} fontSize={40} fill="#ffecaa">A bedtime story told by {told}</text>
      </svg>
    </div>
  );
};

// Closing spread: a text page on the left, the sleeping fox on the right.
const EndLeft: React.FC<{t: number}> = () => (
  <div style={{position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
               fontFamily, fontWeight: 500, color: "#2b2346", textAlign: "center", gap: 28}}>
    <div style={{fontSize: 90, color: "#d6b25a"}}>✦</div>
    <div style={{fontSize: 56}}>The End</div>
    <div style={{fontSize: 40, lineHeight: 1.4}}>Told by {told}, for {to}<br />at bedtime, {meta.recorded}</div>
  </div>
);
const EndRight: Scene = (p) => <Sleeper {...p} />;

const Example: React.FC = () => (
  <Book pages={P} scenes={SCENES} audio="example.m4a" endAt={END} intro={INTRO} outro={OUTRO}
        Cover={Cover} end={{Left: EndLeft, Right: EndRight}} />
);

export const SHEETS: Sheet[] = [{id: "ExampleBook", component: Example, durationInFrames: Math.ceil((INTRO + END + OUTRO) * 30)}];
// Exported for web/ stills (FlipStills.tsx)
export {SCENES, Cover, EndLeft, EndRight, END};
