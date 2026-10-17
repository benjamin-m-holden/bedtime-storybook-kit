#!/usr/bin/env python3
"""Finish a rendered storybook video: captions, chapters, cover art and tags.

usage: finish_video.py STORY_DIR RENDERED.mp4 OUT.mp4 [--no-encode]

Reads STORY_DIR/meta.json (title, told_by, told_to, recorded, summary, words, pages, intro,
optional credits, appended to the comment tag; recorded_at (UTC ISO time the recording was made),
written as the video's creation_time so photo libraries and players date it to the recording; optional caption_fixes, regex fixes applied to
the captions and transcript, e.g. names Whisper misspells).
First re-encodes the picture to H.264 (x264 preset slow, CRF 22, yuv420p, +faststart): about a
third smaller than Remotion's output and visually identical (SSIM 0.996 on a test minute), and it
plays everywhere. Sound is copied untouched. --no-encode skips this. Keep the
full-quality render (or re-render from the bible) as the source; never re-encode a finished file.
Then writes:
  - a soft English closed-caption track (off by default) of everything said in the room,
    the listener included, from the Whisper word timings, shifted by the cover (`intro`)
  - chapters: Cover, one per page (its first words), The End
  - tags: title, artist (told_by, left empty when unknown), album "Home Recordings",
    genre "Bedtime Story", date, description (summary), comment, lyrics (full transcript)
  - the book cover as embedded cover art
  - sidecars next to OUT: OUT.en.srt and OUT-poster.jpg (media servers and most players pick
    both up)
Then decodes the whole result and fails on any error (never copy an unverified file anywhere). Paths in meta.json are relative to the repo root (STORY_DIR/../..).
"""
import json, os, re, subprocess, sys, tempfile

FIX = {}  # exact-word fixes, e.g. {"Pipp": "Pip"}; regex fixes go in meta.json "caption_fixes"
MAXC, MAXDUR, GAP = 84, 6.0, 0.7

def load_words(path):
    d = json.load(open(path))
    flat = [w for s in d for w in s["words"]] if d and "words" in d[0] else d
    return [{"w": FIX.get(w["w"].strip(), w["w"].strip()), "s": w["s"], "e": w["e"]} for w in flat]

def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def wrap(text):
    if len(text) <= MAXC // 2: return text
    cut = text.rfind(" ", 0, len(text) // 2 + 6)
    return text[:cut] + "\n" + text[cut + 1:] if cut > 0 else text

def group(ws):
    out, cur = [], []
    for w in ws:
        if cur and (w["s"] - cur[-1]["e"] > GAP or len(" ".join(x["w"] for x in cur + [w])) > MAXC
                    or w["e"] - cur[0]["s"] > MAXDUR):
            out.append(cur); cur = []
        cur.append(w)
        if re.search(r"[.?!]$", w["w"]) and len(" ".join(x["w"] for x in cur)) > 30:
            out.append(cur); cur = []
    return out + ([cur] if cur else [])

FIXES: list = []   # per-story regex fixes from meta.json "caption_fixes": [[pattern, replacement], ...]

def fix(text):
    for pat, rep in FIXES: text = re.sub(pat, rep, text, flags=re.I)
    return text

def write_srt(cues, off, path):
    with open(path, "w") as f:
        for i, c in enumerate(cues, 1):
            a = c[0]["s"] + off
            b = max(c[-1]["e"] + off + 0.3, a + 1.0)
            if i < len(cues): b = min(b, cues[i][0]["s"] + off - 0.05)
            f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{wrap(fix(' '.join(x['w'] for x in c)))}\n\n")

def lyrics(cues):
    return "\n".join(f"[{int(c[0]['s'] // 60):02d}:{int(c[0]['s'] % 60):02d}] " + fix(" ".join(x["w"] for x in c)) for c in cues)

def ffmeta_escape(s): return re.sub(r"([=;#\\\n])", r"\\\1", s)

def probe_duration(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True, check=True).stdout)

def main(story_dir, rendered, out):
    root = os.path.abspath(os.path.join(story_dir, "..", ".."))
    m = json.load(open(os.path.join(story_dir, "meta.json")))
    FIXES[:] = m.get("caption_fixes", [])
    off, pages = float(m["intro"]), json.load(open(os.path.join(root, m["pages"])))
    cues = group(load_words(os.path.join(root, m["words"])))
    base = re.sub(r"\.mp4$", "", out)
    srt, poster = base + ".en.srt", base + "-poster.jpg"
    write_srt(cues, off, srt)

    # cover art: a frame of the closed front cover, before it swings open
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(max(0.5, off - 2.5)), "-i", rendered, "-frames:v", "1",
                    "-q:v", "3", poster], check=True)

    # chapters and global tags, as an ffmetadata file
    total = probe_duration(rendered)
    starts = [0.0] + [p["s"][0]["at"] - 0.8 for p in pages[1:]]
    marks = [(0.0, "Cover")] + [(off + s, f"Page {p['page']}: " + " ".join(p["s"][0]["text"].split()[:7]))
                                for s, p in zip(starts, pages)]
    last_line = pages[-1]["s"][-1]["at"]
    end_at = off + last_line + 6
    if end_at < total - 2: marks.append((end_at, "The End"))
    told = m.get("told_by")
    comment = (f"Told by {told} to {m['told_to']}" if told else f"Told to {m['told_to']}") + f", recorded {m['recorded']}." + (f" {m['credits']}" if m.get("credits") else "")
    tags = {"title": m["title"], "album": "Home Recordings", "genre": "Bedtime Story", "date": m["recorded"],
            "description": m["summary"], "synopsis": m["summary"], "comment": comment, "lyrics": lyrics(cues)}
    if told: tags["artist"] = tags["album_artist"] = told
    tmp = tempfile.mkdtemp(prefix="finish-")
    meta = os.path.join(tmp, "meta.txt")
    with open(meta, "w") as f:
        f.write(";FFMETADATA1\n")
        for k, v in tags.items(): f.write(f"{k}={ffmeta_escape(v)}\n")
        for i, (a, title) in enumerate(marks):
            b = marks[i + 1][0] if i + 1 < len(marks) else total
            f.write(f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={int(a * 1000)}\nEND={int(b * 1000)}\ntitle={ffmeta_escape(title)}\n")

    if ENCODE:
        enc = os.path.join(tmp, "encoded.mp4")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", rendered, "-map", "0:v:0", "-map", "0:a:0",
                        "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-pix_fmt", "yuv420p",
                        "-c:a", "copy", enc], check=True)
        rendered = enc
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", rendered, "-i", srt, "-i", poster, "-f", "ffmetadata", "-i", meta,
                    "-map", "0:v:0", "-map", "0:a:0", "-map", "1:0", "-map", "2:0",
                    "-map_metadata", "3", "-map_chapters", "3",
                    "-c", "copy", "-c:s", "mov_text", "-c:v:1", "mjpeg",
                    *(["-metadata", f"creation_time={m['recorded_at']}"] if m.get("recorded_at") else []),
                    "-metadata:s:a:0", "language=eng", "-metadata:s:a:0", "title=Story",
                    "-metadata:s:s:0", "language=eng", "-metadata:s:s:0", "title=Closed captions",
                    "-disposition:a:0", "default", "-disposition:s:0", "0", "-disposition:v:1", "attached_pic",
                    "-movflags", "+faststart", out], check=True)

    err = subprocess.run(["ffmpeg", "-v", "error", "-i", out, "-map", "0:v:0", "-map", "0:a:0", "-f", "null", "-"],
                         capture_output=True, text=True).stderr.strip()
    if err: sys.exit(f"decode errors in {out}:\n{err[:2000]}")
    print(f"{out}: ok, 0 decode errors; {len(cues)} captions, {len(marks)} chapters; sidecars {srt}, {poster}")

ENCODE = True

if __name__ == "__main__":
    if "--no-encode" in sys.argv:
        sys.argv.remove("--no-encode"); ENCODE = False
    main(*sys.argv[1:4])
