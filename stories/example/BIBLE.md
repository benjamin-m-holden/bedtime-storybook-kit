# The Fox Who Could Not Sleep: story bible

A tool-independent description of the example picture book, so that any person or tool can
redraw it without reading the code. Real stories keep a bible like this one next to their
`pages.json`; write it before the scene code.

Conventions: **T** is story time in seconds (T = 0 is the first sound of the audio). Video time is
T + 4.0 s (the cover takes the first 4 s). A **picture page** is 960 wide by 1080 tall; the left
half of the screen is the text page, the right half the picture. Coordinates are picture-page
pixels. The ground line is y = 900; characters stand with their feet at y = 930 (fox) or on the
branch (owl). All motion is a pure function of time.

## 1. About

| | |
|---|---|
| Title | The Fox Who Could Not Sleep |
| Told by / to | blank placeholders, printed as "____" on the cover and last page |
| Length | Story 38 s, cover 4 s, closing spread 6 s: 48 s at 30 fps, 1920x1080 |
| Look | STYLE.md; night meadow, one tree with one low branch |

## 2. Rules

- The words on the page are exactly `pages.txt`; nothing is paraphrased.
- The sentence being read is highlighted; a page turn starts 0.8 s before its first sentence.
- The listener's question is never printed; the characters react to it instead.
- Every page has a slow 5 percent push-in; Pip blinks every few seconds and his tail sways.

## 3. Cast

- **Pip**, an orange fox, faces right, about 360 tall at s=1, shown at s=1.15. Props: blink, mouth
  (smile, open, o, frown), look, lookOut (0 three-quarter head, 1 face to the viewer), tail, ears, phase.
- **Moon**, a grey owl, faces the viewer, about 400 tall at s=1, shown at s=0.75 on the branch at
  (730, 568). Props: blink, mouth (smile closed beak, open), look (the face turns), flap (wings).

## 4. Pages

| Page | T | On screen |
|---|---|---|
| Cover | -4 to 0 | Title, the night meadow with both characters, "A bedtime story told by ____"; swings open in the last 1.4 s |
| 1 | 1 | Pip standing at (340, 930), frowning, eyes open. Empty branch. |
| 2 | 7 | More stars. Pip looks up, mouth "o". Bubble "...47, 48, 49..." beside his head from T 7 for 2.8 s. |
| 3 | 13 | Moon glides down onto the branch during the first 1.4 s, wings flapping. At T 14.4 to 15.9 Pip glances out at the viewer (cue). At T 16 Moon's bubble "Why are you awake?" for 2.8 s. |
| 4 | 19 | Pip yawns (eyes shut, mouth open) from T 20.4 to 22. Bubble "I am not sleepy" at T 19 for 1.6 s. |
| 5 | 25 | Moon sings with her beak open; three music notes drift up and left; sparkles round her. Pip's eyes droop more and more. |
| 6 | 31 | Pip asleep: eyes shut, Zzz rising, a few sparkles. |
| Closing | 38 to 44 | Left: "The End / Told by ____, for ____ / at bedtime, YYYY-MM-DD". Right: the sleeping fox. |

## 5. Bubbles

Speech bubbles use `SpeechBubble` with the `speaker` option: the tail points at the mouth and
stops 8 px outside the head, and the body avoids every character.

## 6. Open questions

- None: this story is made up. For a real story, list here every question put to the owner and
  the answer, with the date.
