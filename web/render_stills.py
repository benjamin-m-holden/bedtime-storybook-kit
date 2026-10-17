#!/usr/bin/env python3
"""Render the flip book's stills: one PNG per picture, the cover and the closing spread.

usage: python3 -I web/render_stills.py OUT_DIR

Renders the FlipStills composition (src/sheets/FlipStills.tsx) as an image sequence into
OUT_DIR (element-N.png, N = 0 .. pictures+1). Run it from anywhere; it works in the repo root.
For a heavy machine, wrap it in whatever job runner limits memory. Never run it for a book whose
pictures show names you do not want published: fix the drawing (or the text in the scene file),
then render.
"""
import subprocess, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
out = Path(sys.argv[1] if len(sys.argv) > 1 else "out/stills").resolve()
out.mkdir(parents=True, exist_ok=True)
subprocess.run(["npx", "remotion", "render", "src/index.ts", "FlipStills", str(out),
                "--sequence", "--image-format=png", "--concurrency=2"], cwd=root, check=True)
print(sorted(p.name for p in out.glob("*.png")))
