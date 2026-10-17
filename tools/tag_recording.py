#!/usr/bin/env python3
"""Save a bedtime recording properly: its story data written INTO the audio file as tags.

usage: tag_recording.py RECORDING META.json COVER.jpg [--words words.json] -o OUT.m4a

The result is self-describing like a podcast episode: title, artist (told_by), album
"Home Recordings", genre "Bedtime Story", date, description/synopsis, a comment ("Told by X to Y,
recorded D"), the full transcript with timestamps in the lyrics field ("[mm:ss] line"), and the
cover art. Pass COVER as "-" for none. Run it once without --words right away, and again after
tools/transcribe.py has produced words.json.

Uses ffmpeg remux only (-c copy, a fresh output file), never an in-place tag editor: a Python
tag library once rewrote a phone voice memo's header without shifting its 64-bit chunk offsets
and most packets stopped decoding although the tags read back fine. After writing, it runs
tools/verify_media.sh: a full decode with zero errors and the same audio packet count and
duration as the untouched original. The original is never modified; keep it in recordings/.
"""
import argparse, json, os, re, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
MAXC, MAXDUR, GAP = 84, 6.0, 0.7

def load_words(path):
    d = json.load(open(path))
    flat = [w for s in d for w in s["words"]] if d and "words" in d[0] else d
    return [{"w": w["w"].strip(), "s": w["s"], "e": w["e"]} for w in flat]

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

def lyrics(cues, fixes):
    def fix(t):
        for pat, rep in fixes: t = re.sub(pat, rep, t, flags=re.I)
        return t
    return "\n".join(f"[{int(c[0]['s'] // 60):02d}:{int(c[0]['s'] % 60):02d}] " + fix(" ".join(x["w"] for x in c)) for c in cues)

def ffmeta_escape(s): return re.sub(r"([=;#\\\n])", r"\\\1", s)

def creation_time(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format_tags=creation_time", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout.strip()
    return out or None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("recording"); ap.add_argument("meta"); ap.add_argument("cover")
    ap.add_argument("--words"); ap.add_argument("-o", "--out", required=True)
    a = ap.parse_args()
    if os.path.abspath(a.out) == os.path.abspath(a.recording):
        sys.exit("refusing to overwrite the original; write to a new file")
    m = json.load(open(a.meta))
    told, to = m.get("told_by") or "", m.get("told_to") or ""
    comment = (f"Told by {told} to {to}" if told else f"Told to {to}") + f", recorded {m['recorded']}." + (f" {m['credits']}" if m.get("credits") else "")
    tags = {"title": m["title"], "album": "Home Recordings", "genre": "Bedtime Story", "date": m["recorded"],
            "description": m["summary"], "synopsis": m["summary"], "comment": comment}
    if told: tags["artist"] = tags["album_artist"] = told
    if a.words: tags["lyrics"] = lyrics(group(load_words(a.words)), m.get("caption_fixes", []))
    ct = m.get("recorded_at") or creation_time(a.recording)
    if ct: tags["creation_time"] = ct
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", a.recording]
    have_cover = a.cover != "-"
    if have_cover: cmd += ["-i", a.cover]
    cmd += ["-map", "0:a"] + (["-map", "1:v", "-disposition:v:0", "attached_pic"] if have_cover else [])
    cmd += ["-c", "copy", "-map_metadata", "-1", "-movflags", "+faststart"]
    for k, v in tags.items(): cmd += ["-metadata", f"{k}={v}"]
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    cmd.append(a.out)
    subprocess.run(cmd, check=True)
    r = subprocess.run(["bash", os.path.join(HERE, "verify_media.sh"), a.out, a.recording])
    if r.returncode:
        os.remove(a.out); sys.exit("verification failed; the tagged copy was deleted, the original is untouched")
    print(f"{a.out}: tagged ({', '.join(tags)})")

if __name__ == "__main__":
    main()
