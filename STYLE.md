# Storybook kit: style guide

Every drawing in `src/kit/` follows this, so pieces made by different hands match. The
approved reference is the cast sheet (`npm run still:cast`) and the example book: match them.

## Look
- **Clean flat-vector picture book.** Shapes with a dark outline, a soft gradient for
  form, a rim light on the shadow side. No textures, no photo effects, no realism.
- **Outlines**: 3-4 units at s=1 (thinner, 2-3, for small details). Colour is a darker
  shade of the fill, never pure black on light things: fox `#5a2a12`, owl `#2e2a3a`,
  wood `#3b2410`, metal `#5b6170`.
- **Form**: radialGradient lit from the top-left, light stop -> base (`Grad` in `rig.tsx`).
- **One body, one outline.** A character is built from parts, but every part that is the same
  fur or feather (body, chest, head, ears, tail, the near legs, a folded wing) goes through
  ONE `Merge` so a single outline wraps the silhouette: hips and shoulders disappear under
  the body, the neck joins head to body, ears root inside the head. Far legs are the same
  shape in a darker shade, drawn behind. Markings (a belly, inner ears, a cream tail tip) and
  the face go on top afterwards. A part that moves (a leg, a tail, a wing) is placed with
  `placed()` -- its translate/rotate baked into the path -- never with a `transform`, because
  a transform also moves that part's copy of the shared gradient and it shows as a patch.
  Paws sit on the floor line in every walk phase; a lifted paw is the swinging one.
- **Rim light** on dark things (night objects): a 3-5 unit stroke along the back/top edge,
  cool lavender `#8d86c9`-ish at ~0.6 opacity.
- **Shadows on the floor**: ellipse `rgba(40,25,10,.22)`.
- **Night**: sky `#141c4e` -> `#3b3480`, moon `#fff1c4` with a soft halo, stars `#fff8d8`
  that twinkle (opacity driven by a `twinkle` prop). **Day**: sky `#8ccbf2` -> `#d8f0ff`.
- **Warm interiors**: wall `#d7b98a`-ish, wood `#a8703f` -> `#7d4f29`, a lamp glow
  (radial `rgba(255,214,140,.55)` -> 0), a soft vignette at the edges.
- Text inside pictures (speech bubbles, sound words): font Fredoka 600, `#2b2346`, white
  bubble with a 5-unit `#2b2346` outline.

## Coordinates and scale
- A **picture page is 960x1080** (SVG viewBox `0 0 960 1080`). Places are drawn for that.
- **Characters**: origin on the floor under the figure, y negative up, `x, y, s` props.
  At s=1 a child figure is ~570 tall and a sitting animal ~420. Pick the scene scale from a
  height chart (child s=0.62 -> ~355; sitting animal s=0.45 -> ~190) and keep it on every page.
  Magic (wings, a cape) never changes a character's body size.
- **Everything animatable is a prop**, not a timer: `blink`, `tail`, `flap`, `wave`,
  `phase` (walk cycle 0..1), `twinkle`, `flicker`. Callers drive them from
  `useCurrentFrame()`. Never use Date, setTimeout or CSS animations.
- **Unique SVG ids**: every `<defs>` id must include the component's own `id` prop (or
  x/y), because many copies share one document. A shared id breaks when the first copy is
  hidden.
- Layers: places export their layers separately where parallax helps
  (`<Meadow layer="back" | "front" />`).

## Privacy
Draw characters, never real people's faces or identifying marks. No real place names,
addresses, brand marks or lettering that identifies a person or a building in the art.
Keep recordings and drawings of real people out of public repositories.
