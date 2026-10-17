import React from "react";
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {fontFamily} from "../kit/common";

// A read-along picture book: text page on the left, picture page on the right, filling
// the 1920x1080 frame. Pages turn with a 3D page curl, timed so the new spread lands just
// as its first sentence is read; the sentence being read is highlighted.

export type Sentence = {text: string; at: number};
export type PageText = {page: number; s: Sentence[]};
// A scene draws one 960x1080 picture page. `t` is seconds since its page began (it is
// slightly negative while the page is being turned to); `T` is seconds into the story.
export type Scene = React.FC<{t: number; T: number; dur: number}>;

const TURN = 1.1;          // seconds a page takes to turn
const LEAD = 0.8;          // a turn starts this long before the page's first sentence
const PAPER = "#fbf5e6";

const fit = (page: PageText) => {
  const chars = page.s.reduce((n, s) => n + s.text.length, 0);
  return Math.max(34, Math.min(64, Math.floor(0.93 * Math.sqrt((750 * 780) / (0.8 * chars)))));
};

const TextPage: React.FC<{page: PageText; T: number; End?: React.FC<{t: number}>; endStart?: number}> = ({page, T, End, endStart = 0}) => {
  if (page.s.length === 0 && End) return (
    <div style={{position: "absolute", inset: 0, background: PAPER}}>
      <End t={T - endStart} />
      <div style={{position: "absolute", right: 0, top: 0, width: 90, height: "100%", background: "linear-gradient(90deg, rgba(80,50,20,0), rgba(80,50,20,.24))"}} />
    </div>
  );
  const fontSize = fit(page);
  return (
    <div style={{position: "absolute", inset: 0, background: PAPER}}>
      <div style={{position: "absolute", top: 58, width: "100%", textAlign: "center", color: "#d6b25a", fontSize: 40, letterSpacing: 22}}>✦ ✦ ✦</div>
      <div style={{position: "absolute", left: 110, top: 120, width: 750, height: 840, display: "flex", flexDirection: "column",
                   justifyContent: "center", fontFamily, fontWeight: 500, fontSize, lineHeight: 1.4, color: "#2b2346"}}>
        {page.s.map((s, i) => {
          const end = i + 1 < page.s.length ? page.s[i + 1].at : 1e6;  // the last line stays lit until the page turns
          const on = interpolate(T, [s.at - 0.15, s.at + 0.1, end - 0.1, end + 0.15], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
          return (
            <span key={i} style={{display: "table", padding: "4px 12px", margin: "0 -12px .5em", borderRadius: 14,
                                  background: `rgba(255,229,138,${on})`}}>{s.text}</span>
          );
        })}
      </div>
      <div style={{position: "absolute", bottom: 44, width: "100%", textAlign: "center", fontFamily, fontSize: 30, color: "#a08e70"}}>{page.page}</div>
      <div style={{position: "absolute", right: 0, top: 0, width: 90, height: "100%", background: "linear-gradient(90deg, rgba(80,50,20,0), rgba(80,50,20,.24))"}} />
    </div>
  );
};

const PicturePage: React.FC<{scene: Scene; t: number; T: number; dur: number}> = ({scene: S, t, T, dur}) => (
  <div style={{position: "absolute", inset: 0, background: PAPER, overflow: "hidden"}}>
    <svg viewBox="0 0 960 1080" width={960} height={1080} style={{display: "block"}}>
      <S t={t} T={T} dur={dur} />
    </svg>
    <div style={{position: "absolute", left: 0, top: 0, width: 90, height: "100%", background: "linear-gradient(270deg, rgba(80,50,20,0), rgba(80,50,20,.24))"}} />
  </div>
);

// A leaf that is only paper, for the quick extra leaves of a riffle: a few faint lines where
// text would be, and the shade of the gutter on the side it lands.
const Blank: React.FC<{side: "left" | "right"}> = ({side}) => (
  <div style={{position: "absolute", inset: 0, background: PAPER}}>
    <div style={{position: "absolute", left: 130, top: 180, width: 700, height: 700,
                 background: "repeating-linear-gradient(180deg, rgba(150,125,85,.13) 0, rgba(150,125,85,.13) 5px, rgba(0,0,0,0) 5px, rgba(0,0,0,0) 62px)"}} />
    <div style={{position: "absolute", top: 0, height: "100%", width: 90, [side === "left" ? "right" : "left"]: 0,
                 background: `linear-gradient(${side === "left" ? 90 : 270}deg, rgba(80,50,20,0), rgba(80,50,20,.24))`}} />
  </div>
);

const LEAF = 0.5;            // seconds one riffle leaf takes to flip

// The book opens on a full-screen front cover that swings open before the narration
// starts (`intro` seconds), and after the last line it turns one more page to a closing
// spread (`end`: a left page and a picture) before fading out (`outro` seconds).
export const Book: React.FC<{
  pages: PageText[]; scenes: Scene[]; audio: string; endAt: number;
  intro?: number; outro?: number; Cover?: React.FC<{t: number}>;
  end?: {Left: React.FC<{t: number}>; Right: Scene};
  // Optional: a riffle is `count` quick extra leaves that flip over from story time `at` and
  // land exactly where the next page turn begins, so the book seems to skip ahead (the
  // leaves are blank paper; the real turn that follows then shows blank paper too).
  riffles?: {at: number; count: number}[];
}> = ({pages: story, scenes: storyScenes, audio, endAt, intro = 0, outro = 0, Cover, end, riffles = []}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const Tall = frame / fps;
  const T = Tall - intro;                       // story time: the narration starts at 0
  const pages: (PageText & {turnAt?: number})[] = end ? [...story, {page: 0, s: [], turnAt: endAt + 0.4}] : story;
  const scenes = end ? [...storyScenes, end.Right] : storyScenes;
  const starts = pages.map((p, i) => (i === 0 ? 0 : p.turnAt ?? p.s[0].at - LEAD));
  // the page whose turn has most recently begun
  let i = 0;
  while (i + 1 < pages.length && T >= starts[i + 1]) i++;
  const turning = i > 0 && T < starts[i] + TURN;
  const u = turning ? Easing.inOut(Easing.cubic)((T - starts[i]) / TURN) : 1;
  const prev = turning ? i - 1 : i;
  const dur = (k: number) => (k + 1 < pages.length ? starts[k + 1] : endAt + outro) - starts[k];
  const endStart = starts[starts.length - 1];
  const pic = (k: number) => <PicturePage scene={scenes[k]} t={T - starts[k]} T={T} dur={dur(k)} />;
  const angle = -180 * u;
  // riffles: each lands on the first page turn that starts at or after its `at`
  const riffleOf = (j: number) => riffles.find(r => j > 0 && starts[j] >= r.at && (j === 1 || starts[j - 1] < r.at));
  const riffleTurn = turning ? riffleOf(i) : undefined;       // this turn follows a riffle
  const rif = riffles.find(r => { const j = starts.findIndex(st => st >= r.at); return j > 0 && T >= r.at && T < starts[j]; });
  const rifSpan = rif ? starts[starts.findIndex(st => st >= rif.at)] - rif.at : 0;
  const rifP = (k: number) => {
    if (!rif) return 0;
    const gap = rif.count > 1 ? (rifSpan - LEAF) / (rif.count - 1) : 0;
    return Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, (T - rif.at - k * gap) / LEAF)));
  };
  const rif0 = rif ? rifP(0) : 0;
  const finish = end ? endAt + outro : endAt;
  const fade = interpolate(T, [finish - 1.5, finish], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  // the front cover swings open on its left edge over the first spread
  const open = Cover ? Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, (Tall - (intro - 1.4)) / 1.4))) : 1;

  return (
    <AbsoluteFill style={{background: "#000"}}>
      <Sequence from={Math.round(intro * fps)}><Audio src={staticFile(audio)} /></Sequence>
      <AbsoluteFill style={{opacity: fade, perspective: 2600}}>
        {/* under the turning leaf: the old text stays on the left, the new picture on the right */}
        <div style={{position: "absolute", left: 0, top: 0, width: 960, height: 1080}}>
          {riffleTurn || rif0 >= 1 ? <Blank side="left" /> : <TextPage page={pages[prev]} T={T} End={end?.Left} endStart={endStart} />}
        </div>
        <div style={{position: "absolute", left: 960, top: 0, width: 960, height: 1080}}>
          {rif0 > 0 ? <Blank side="right" /> : pic(i)}
          {turning && <div style={{position: "absolute", inset: 0, background: `rgba(30,15,5,${0.38 * (1 - u)})`}} />}
        </div>
        {turning && (
          <div style={{position: "absolute", left: 960, top: 0, width: 960, height: 1080, transformOrigin: "0 50%",
                       transform: `rotateY(${angle}deg)`, transformStyle: "preserve-3d"}}>
            {/* front of the leaf: the old picture (blank paper if a riffle already took it away) */}
            <div style={{position: "absolute", inset: 0, backfaceVisibility: "hidden"}}>
              {riffleTurn ? <Blank side="right" /> : pic(i - 1)}
              <div style={{position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(0,0,0,${0.3 * u}), rgba(255,255,255,${0.18 * Math.sin(Math.PI * u)}) 60%, rgba(0,0,0,${0.12 * u}))`}} />
            </div>
            {/* back of the leaf: the new text page, which lands on the left */}
            <div style={{position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)"}}>
              <TextPage page={pages[i]} T={T} End={end?.Left} endStart={endStart} />
              <div style={{position: "absolute", inset: 0, background: `linear-gradient(270deg, rgba(0,0,0,${0.3 * (1 - u)}), rgba(0,0,0,0) 70%)`}} />
            </div>
          </div>
        )}
        {/* the riffle: quick blank leaves (the first carries the old picture away) */}
        {rif && [...Array(rif.count)].map((_, k) => {
          const uk = rifP(k);
          if (uk <= 0 || uk >= 1) return null;
          return (
            <div key={k} style={{position: "absolute", left: 960, top: 0, width: 960, height: 1080, transformOrigin: "0 50%",
                                 transform: `rotateY(${-180 * uk}deg)`, transformStyle: "preserve-3d", zIndex: uk < 0.5 ? 100 - k : 100 + k}}>
              <div style={{position: "absolute", inset: 0, backfaceVisibility: "hidden"}}>
                {k === 0 ? pic(i) : <Blank side="right" />}
                <div style={{position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(0,0,0,${0.3 * uk}), rgba(255,255,255,${0.18 * Math.sin(Math.PI * uk)}) 60%, rgba(0,0,0,${0.12 * uk}))`}} />
              </div>
              <div style={{position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)"}}>
                <Blank side="left" />
                <div style={{position: "absolute", inset: 0, background: `linear-gradient(270deg, rgba(0,0,0,${0.3 * (1 - uk)}), rgba(0,0,0,0) 70%)`}} />
              </div>
            </div>
          );
        })}
        {/* the left page darkens a touch as the leaf comes over it */}
        {turning && u > 0.5 && <div style={{position: "absolute", left: 0, top: 0, width: 960, height: 1080, background: `rgba(30,15,5,${0.16 * (1 - u) * 2})`}} />}
        {/* spine */}
        <div style={{position: "absolute", left: 952, top: 0, width: 16, height: 1080, background: "linear-gradient(90deg, rgba(60,35,15,.25), rgba(60,35,15,.45), rgba(60,35,15,.25))"}} />
        {Cover && open < 1 && (
          <>
            <div style={{position: "absolute", inset: 0, background: `rgba(20,10,5,${0.55 * (1 - open)})`}} />
            <div style={{position: "absolute", inset: 0, transformOrigin: "0 50%", transform: `rotateY(${-100 * open}deg)`,
                         opacity: open > 0.82 ? Math.max(0, (1 - open) / 0.18) : 1}}>
              <Cover t={Tall} />
              <div style={{position: "absolute", inset: 0, background: `linear-gradient(90deg, rgba(0,0,0,${0.35 * open}), rgba(255,255,255,${0.12 * Math.sin(Math.PI * open)}) 55%, rgba(0,0,0,${0.25 * open}))`}} />
            </div>
          </>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
