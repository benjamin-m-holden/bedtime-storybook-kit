# RECIPE: making a read-along picture book from a bedtime recording

For an AI coding agent (and the person who owns the recording). Do the steps in order. Free tools
unless the owner says otherwise. Look at every render you make: open the image, watch the clip.

The spirit: a recording is not just a story. It is a storyteller and a listener making it up
together, with questions, detours, songs and tangles. The words on the page are the story *as
told*; the pictures carry everything else, and the characters know they are in a story being told.

## 0. Ask first

- **Who is narrating.** Never infer it from voice pitch; that is how it goes wrong.
- **Who is listening**, and whether the listener is also in the story.
- **Photos of real characters and toys** before drawing anything. Drawing first and redrawing
  from photos later costs a second build.
- **Whether anything may be published.** Default: nothing leaves the machine. Real names, voices
  and likenesses stay out of public repositories and public pages.

## 1. Save the recording properly (before anything else)

The story's data goes INTO the audio file as tags, so the file is self-describing like a podcast
episode: title, date, a one-line description, told-by and told-to, the full Whisper transcript with
timestamps in the lyrics field, and cover art.

1. Copy the original into `recordings/` (git-ignored). Never edit it in place.
2. Write `stories/<name>/meta.json` (copy `stories/example/meta.json`): title, told_by, told_to,
   recorded date, summary, intro seconds, credits, caption_fixes.
3. Run, right away and without a transcript yet:
   `python3 -I tools/tag_recording.py recordings/story.m4a stories/<name>/meta.json cover.jpg -o out/story-tagged.m4a`
   (pass `-` instead of a cover until you have one). After step 2 run it again with
   `--words stories/<name>/words.json` so the lyrics tag holds the transcript.
4. It uses ffmpeg only: `-map 0:a -map 1:v -c copy -disposition:v:0 attached_pic -movflags +faststart`
   plus `-metadata` for title, artist (told_by), album "Home Recordings", genre "Bedtime Story", date,
   description and synopsis, a comment ("Told by X to Y, recorded D"), lyrics (`[mm:ss] line`) and
   `creation_time` copied from the original.
5. Then `tools/verify_media.sh`: a full decode with zero errors, and the same audio packet count
   and duration as the original. `tag_recording.py` runs it and deletes its output if it fails.

**The trap.** A Python tag library (mutagen) wrote tags into a phone voice memo and they read back
fine, but the file used 64-bit chunk-offset tables (`co64`, plus `mett` data tracks) that were not
shifted when the header grew: nearly every audio packet no longer decoded, and the broken file had
already replaced the good one. So: tag with an ffmpeg remux, never in place, never trust "the tags
read back", and decode the whole stream before copying the result anywhere. Keep the original.

## 2. Transcribe

`python3 -I tools/transcribe.py recordings/story.m4a --model large-v3 --hint "names and odd words" --out-dir stories/<name>`

This writes `words.json` (`[{"w","s","e"}]`) and `transcript.txt`. large-v3 with int8 on a CPU
peaks around 6 GB of RAM; `large-v3-turbo` is the fallback. Run two models and diff them with
`tools/compare_transcripts.py A_words.json B_words.json`: every disagreement is a spot to check
by ear. Homophones and invented names are the narrator's call, not the model's.

To see it on something you know the words of, transcribe the voiced example
(`public/example.m4a`, read by Piper) and compare it with the script: with `small.en`, Whisper
heard "Why are you awake?" as "By our wake" and "yawned" as "yearned". A clean synthetic voice
still gets misheard, so a real bedtime recording will be too.

## 3. Page text as told

Write `stories/<name>/pages.txt` in the narrator's words. Allowed edits, and only these:

- the listener's chime-ins come off the page (they go in `cues.json`),
- stumbles and repeats are trimmed,
- mishearings are fixed,
- interruptions get no text; the picture stays up.

Never paraphrase "for reading level": the narrator's voice is the point. One sentence per line,
a blank line starts a page, a trailing `@12.3` pins a time. If a page has too much text, split it
into two spreads rather than shrinking the type. Run `python3 -I tools/time_pages.py stories/<name>`
to get `pages.json` and `page-text.md`, then list the off-script moments (laughs, questions, songs,
a name chosen on the spot) in `cues.json` for the owner: `at`, `end`, `page`, `who`
("narrator", "listener" or "both"), `heard`, and `react` (what the characters do about it).

## 4. Cast once, from parts

Make a model sheet, then a rig: one component per character with props for everything that moves
(`blink`, `mouth`, `look`, `lookOut`, `tail`, `ears`, `phase`, see `src/kit/example/Fox.tsx` and
`Owl.tsx`). Every SVG id includes the component's `id`; no `Date` or `Math.random` (use
`src/kit/fx/rand.ts`); a consistent height chart (see STYLE.md). Render the cast sheet
(`src/sheets/CastSheet.tsx`), **look at it**, and get the owner's approval before drawing scenes.
Signature details (a collar, a hat) are how lookalikes are told apart. Outfits are swappable layers.

## 5. Scenes

One 960x1080 picture per page. Every motion is a pure function of time `t` (seconds since the page
began) or `T` (seconds into the story). Parallax layers, a slow push-in, idle motion, effects in
code. Characters know they are in a story being told: when the room leaks in (`cues.json`), they
notice, using `listening(T)` from `src/book/cues.ts` (for example the fox glances out at the viewer).
Give every gag about 3 seconds to land; do not clutter the picture with labels unless the label is
the joke. Speech bubbles are timed to the spoken words (the `spoken()` pattern in
`src/sheets/ExampleBook.tsx`), the tail stops 8 px outside the speaker's head, and the bubble body
never covers any character's head or body: pass every character to `avoid`. Write the story's
`BIBLE.md` first (what is on screen, where, when, why), then the code, so any other tool could
redraw the book from the bible alone.

## 6. Art review pass

Drawing in code drifts: legs that do not quite meet the body, a face that slides off its head
when the character looks aside, a bubble over someone's ears, a picture that does not show what
the words say. Before the full render, hand `prompts/art-review.md` to the most capable model you
have, filled in with the story folder and the owner's notes, and let it go through **everything
drawn**, page by page: characters, places, props, effects, cover and end page. It renders and
looks after every change, keeps every component's props so the scenes still work, and reports
each fix with before and after stills. Run it again whenever the art changes.
`docs/art-review-before-after.jpg` shows what one pass did to this kit's example.

## 7. Render in Remotion

- `npx remotion still src/index.ts <Composition> out/x.png --frame=N` for frames and contact sheets.
- Then a 30 second clip at normal speed, **timed**; extrapolate to the whole book. Timing is never
  judged from stills.
- Then the full render. For later fixes render only `--frames=a-b` and splice.
- Check every render by looking at it. On a small machine keep `Config.setConcurrency(2)` and run
  long renders under a memory cap.

## 8. Finish

`python3 -I tools/finish_video.py stories/<name> out/render.mp4 "out/<Title>.mp4"` re-encodes the
picture to H.264 from the full-quality render, adds soft captions of everything said in the room
(including the listener), a chapter per page, the cover art, tags, `.en.srt` and poster sidecars,
and decodes the result. Keep the full-quality render as the source and never re-encode a finished
file. Credit who told the story on the cover and the last page (`meta.json` `told_by`).

## 9. Optional web flip book

`python3 -I web/render_stills.py out/stills`, then
`python3 -I web/build_book.py stories/<name> out/stills web/out`, then open `web/out/index.html`
(for example `python3 -m http.server -d web/out 8123`). It has real text pages, WebP pictures,
StPageFlip page turning and a synthesized page-turn sound, but no narration. If you publish it,
swap or drop real names with `--names names.json` and let the build's `assert not leftover` check
confirm none remain; also check the pictures themselves.
