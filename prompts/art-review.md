# Art review pass

Hand this to a coding agent after the cast and scenes are drafted, and again whenever the art
changes. Use the most capable model you have for it: drawing in code is where a stronger model
shows the biggest difference, and one careful pass costs far less than redrawing later. In this
kit's own example, one such pass turned the fox from separate parts stuck together into one
animal (see `docs/art-review-before-after.jpg`).

Fill in the two lines in angle brackets, then paste everything below the rule.

---

Review and clean up every drawing in this picture book so each character looks like one
well-built body, not loose parts, and every page looks right. Book: <story folder, e.g.
stories/example>. Owner's notes on what looks off: <anything they said, or "none">.

**Scope: everything drawn.** Every character in `src/kit/` that the story uses, every place
(sky, ground, trees, buildings, props within the place), every prop and effect (speech bubbles
and their tails, sound words, Zzz, sparkles, stars), the cover, the end page, and the flip-book
stills. Go through the book page by page, not only the cast sheet.

**What good looks like**
- One body, one outline: body, head, neck or chest, ears, legs and tail sit inside one `Merge`
  (from `src/kit/rig.tsx`), so one outline wraps the silhouette and joints disappear under it.
  Legs grow out of the body; ears are rooted in the head; a tail tapers from the rump; wings
  root at the shoulder.
- Far limbs are the same shape as near ones, a shade darker, drawn behind.
- Feet are on the ground line (or gripping the branch or seat) in every pose and every walk phase.
- Parts that move get their position with `placed()` rather than a `transform`, so a moving part
  shades the same as the body (a transform inside `Merge` shifts the shared gradient).
- Faces stay inside heads whatever the characters look at; eyes, nose or beak, mouth placed on
  the face, not floating.
- Characters, props and places in believable scale to each other; nothing clipped at the page
  edge or the gutter by accident; nothing floating that should rest on something.
- Each picture shows what its words say (a character who "fell asleep in the grass" is lying
  down asleep, not standing with eyes shut).
- Speech bubbles never cover any character's head or body: every character on the page goes into
  the bubble's `avoid` list; the tail stops just outside the speaker's head.
- Still simple, friendly shapes for a children's book, following `STYLE.md`. Quality over detail.

**Rules**
- Keep every component's props and behaviour (blink, mouth, look, walk phase, tail, and so on) so
  the scenes keep working. Adding an optional prop is fine; changing or removing one is not.
- Every motion stays a pure function of the frame: no `Date`, no `Math.random` (use
  `src/kit/fx/rand.ts`).
- Render and LOOK after every change: the cast sheet
  (`npx remotion still src/index.ts CastSheet out/cast.png`) and stills inside every page
  (`npx remotion still src/index.ts <Book> out/pN.png --frame=N`). Check walk phases, sleeping or
  special poses, and mid-page frames, not just a standing pose. Save a "before" copy of each still
  first so the owner can compare.
- `npx tsc --noEmit` must pass. Then re-render the book and run `tools/finish_video.py`.

**Report**: every issue found, page by page, and how it was fixed; before and after paths for the
cast sheet and two or three pages; anything left for the owner to decide.
