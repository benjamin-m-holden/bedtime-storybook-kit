#!/usr/bin/env python3
"""Build a before/after reel for a phone: for each moment, a title card, then the OLD clip on top
and the NEW clip underneath, playing in sync frame for frame (easier to see
exactly what changed, and half as long). Sound is the NEW clip's. 1080 wide, portrait.

usage: compare_reel.py OLD.mp4 NEW.mp4 MOMENTS.tsv OUT.mp4 [--spread]
MOMENTS.tsv lines: label<TAB>start<TAB>end[<TAB>text|picture|spread]   (seconds in the VIDEO)
The optional 4th column picks the half to show for that moment: the picture page (default),
the text page (for wording changes), or the whole spread.
"""
import subprocess, sys, tempfile, os

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
ENC = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p", "-r", "30",
       "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-ac", "2"]

# The picture page only (the right half of the spread): the text pages rarely change, and on a
# phone this makes each version fill half the screen. Pass --spread to keep the whole spread.
PIC = "crop=960:1080:960:0,scale=-2:950,pad=1080:950:(ow-iw)/2:0:color=0x2b2346"
SPREAD = "scale=1080:-2"
TEXT = "crop=960:1080:0:0,scale=-2:950,pad=1080:950:(ow-iw)/2:0:color=0x2b2346"

def esc(s): return s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’")

def run(cmd): subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)

def main(old, new, tsv, out):
    moments = [(l.rstrip("\n").split("\t") + [""])[:4] for l in open(tsv) if l.strip() and not l.startswith("#")]
    tmp = tempfile.mkdtemp(prefix="reel-")
    parts = []
    for i, (label, a, b, part) in enumerate(moments, 1):
        view = {"text": TEXT, "spread": SPREAD, "picture": PIC}.get(part.strip(), PIC)
        a, b = float(a), float(b)
        card = os.path.join(tmp, f"{i:02d}-card.mp4")
        run(["ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=0x2b2346:s=1080x1920:d=2.5:r=30",
             "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-t", "2.5",
             "-vf", f"drawtext=fontfile={FONT}:text='{i}. {esc(label)}':fontcolor=0xffe58a:fontsize=52:x=(w-tw)/2:y=(h-th)/2",
             *ENC, card])
        parts.append(card)
        clip = os.path.join(tmp, f"{i:02d}-stack.mp4")
        lab = ("drawtext=fontfile=%s:text='%%s':fontcolor=white:fontsize=40:box=1:"
               "boxcolor=0x2b2346@0.85:boxborderw=12:x=24:y=20") % FONT
        run(["ffmpeg", "-y", "-ss", f"{a}", "-t", f"{b - a}", "-i", old, "-ss", f"{a}", "-t", f"{b - a}", "-i", new,
             "-filter_complex",
             f"[0:v]{view},{lab % 'BEFORE'}[top];[1:v]{view},{lab % 'AFTER'}[bot];"
             "[top][bot]vstack=inputs=2,pad=1080:1920:0:(oh-ih)/2:color=0x2b2346[v]",
             "-map", "[v]", "-map", "1:a", *ENC, clip])
        parts.append(clip)
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart", out])
    print(out)

if __name__ == "__main__":
    if "--spread" in sys.argv:
        sys.argv.remove("--spread"); PIC = SPREAD
    main(*sys.argv[1:5])
