import React from "react";
import {Merge} from "../rig";
import {Moon, Page, PlaceProps, Stars, showBack, showFront, wavePath} from "../places/util";

// The example place: a meadow with one tree, by day or by night. A place draws one 960x1080
// picture page and takes the PlaceProps from places/util.tsx. `layer` splits it so a scene
// can put characters BETWEEN the back (sky, hills, tree) and the front (grass tufts) and
// push each layer at a different speed for parallax.
export const GROUND_Y = 900;                    // where characters' feet go
export const BRANCH = {x: 760, y: 560};         // the owl's perch: put her feet on branchTop(x)
// The top edge of the owl's branch at page x (it slopes gently up toward its tip at the left).
export const branchTop = (x: number) => 574 - ((792 - x) / 140) * 16;

export const Meadow: React.FC<PlaceProps & {t?: number}> = ({night, twinkle = 0, layer = "all", uid = "meadow", t = 0}) => {
  const hill1 = wavePath(760, 22, 520, 0, 0, t);
  const hill2 = wavePath(830, 18, 380, 0, 2, t);
  const bark = "#6b4524", barkInk = "#3b2410";
  const leaf = night ? "#2d6a45" : "#4fa24f", leafInk = night ? "#17402a" : "#2f6a30", leafLight = night ? "#3a7d52" : "#66b55c";
  return (
    <Page uid={uid}>
      {showBack(layer) && (
        <g>
          <defs>
            <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={night ? "#141c4e" : "#8ccbf2"} /><stop offset="1" stopColor={night ? "#3b3480" : "#d8f0ff"} />
            </linearGradient>
            <linearGradient id={`${uid}-grass`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={night ? "#2f6a4a" : "#7cc46a"} /><stop offset="1" stopColor={night ? "#1c4a36" : "#4f9a4a"} />
            </linearGradient>
          </defs>
          <rect width={960} height={1080} fill={`url(#${uid}-sky)`} />
          {night && <Stars n={70} seed={7} y1={620} twinkle={twinkle} />}
          {night && <Moon x={190} y={210} r={70} uid={`${uid}-moon`} />}
          <path d={hill1.fill} fill={night ? "#26436a" : "#9ad18c"} />
          <path d={hill2.fill} fill={night ? "#1f4a52" : "#80c274"} />
          <rect x={0} y={GROUND_Y - 40} width={960} height={1080 - GROUND_Y + 40} fill={`url(#${uid}-grass)`} />
          {/* the tree: one outline round trunk, roots and the owl's limb, so the limb grows out of the trunk */}
          <Merge fill={bark} ink={barkInk} sw={5}>
            <path d="M748,908 C776,896 782,820 790,640 L796,330 L846,330 L854,640 C862,820 870,896 904,908 Z" />
            <path d={`M792,${branchTop(792) + 4} C740,${branchTop(740)} 690,${branchTop(690)} 656,${branchTop(656)} C640,${branchTop(656) + 2} 636,${branchTop(656) + 26} 652,${branchTop(656) + 30} C700,${branchTop(700) + 40} 750,${branchTop(750) + 44} 794,${branchTop(794) + 48} Z`} />
          </Merge>
          {/* bark: a couple of soft lines, and the limb's shaded underside */}
          <path d="M812,860 C808,760 810,620 814,480 M834,840 C834,740 832,640 830,560" fill="none" stroke={barkInk} strokeWidth={3} opacity={0.35} strokeLinecap="round" />
          <path d={`M660,${branchTop(656) + 24} C700,${branchTop(700) + 34} 750,${branchTop(750) + 38} 790,${branchTop(790) + 42}`} fill="none" stroke={barkInk} strokeWidth={4} opacity={0.3} strokeLinecap="round" />
          {/* crown: overlapping rounds, one outline */}
          <Merge fill={leaf} ink={leafInk} sw={5}>
            <circle cx={830} cy={270} r={150} />
            <circle cx={720} cy={340} r={100} />
            <circle cx={920} cy={350} r={95} />
            <circle cx={760} cy={220} r={90} />
            <circle cx={900} cy={190} r={90} />
          </Merge>
          <g fill={leafLight} opacity={0.6}>
            <circle cx={770} cy={200} r={44} /><circle cx={860} cy={170} r={36} /><circle cx={700} cy={310} r={30} />
          </g>
        </g>
      )}
      {showFront(layer) && (
        <g>
          <ellipse cx={480} cy={1040} rx={560} ry={90} fill={night ? "#1c4a36" : "#4f9a4a"} />
          {[60, 150, 250, 400, 520, 640, 730, 900].map((gx, i) => (
            <path key={gx} d={`M${gx - 14},1050 Q${gx - 8},${990 - (i % 3) * 14} ${gx - 22},${960 - (i % 3) * 14} Q${gx + 4},${1000 - (i % 3) * 10} ${gx},1050 Z`}
                  fill={night ? "#3a8a5a" : "#6cc060"} stroke={night ? "#17402a" : "#2f6a30"} strokeWidth={3} strokeLinejoin="round" />
          ))}
        </g>
      )}
    </Page>
  );
};
