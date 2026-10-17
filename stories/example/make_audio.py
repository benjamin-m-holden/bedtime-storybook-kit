#!/usr/bin/env python3
"""Make the placeholder audio for the example story: public/example.m4a and words.json.

usage: python3 -I stories/example/make_audio.py [--voice VOICE.onnx] [--piper PIPER] [--slow 1.1]

Needs only ffmpeg; a real voice is optional. Each sentence of pages.txt becomes a clip, from the
first of these that is available:
  1. Piper (free, offline, natural-sounding): `pip install piper-tts`, then
     `python -m piper.download_voices en_US-ljspeech-high` (a voice trained on the public-domain
     LJ Speech recordings). Point --voice (or $PIPER_VOICE) at the .onnx file; --piper (or
     $PIPER) at the piper program if it is not on PATH. --slow stretches the speech (1.1 = 10%
     slower, a bedtime pace).
  2. espeak-ng, if installed (robotic, but a voice).
  3. A short 440 Hz beep per sentence, so the example still renders with nothing installed.
A clip is placed at its time: the @ pin if it has one, else just after the sentence before.
A sentence that would run into the next pinned one stops the script with a message, rather
than producing overlapping speech. The clips are mixed with ffmpeg adelay/amix into one AAC 48 kHz file of
meta.json "end" seconds. words.json is written by spreading each sentence's words evenly
over its clip (beep fallback: 0.22 s a word, at most 2.7 s), so the timing is deterministic
and tools/time_pages.py reproduces pages.json from it. Finally tools/verify_media.sh decodes
the result. Someone using a real recording skips this: tools/transcribe.py writes words.json.
"""
import json, os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
GAP = 3.0     # beep and espeak: seconds from one sentence's start to the next unpinned one
PAUSE = 0.5   # spoken voice: silence after a sentence before the next unpinned one

def parse(path):
    """[(text, pinned time or None)] in order."""
    sents = []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        m = re.match(r"^(.*?)\s*@(\d+(?:\.\d+)?)$", line)
        sents.append((m.group(1), float(m.group(2))) if m else (line, None))
    return sents

def arg(name, env=None, default=None):
    if name in sys.argv:
        return sys.argv[sys.argv.index(name) + 1]
    return os.environ.get(env, default) if env else default

def speech_span(wav):
    """(start, end) of the speech inside a clip, from ffmpeg's silencedetect, so word times
    are spread over the voice and not over the silence a TTS engine leaves at each end."""
    d = duration(wav)
    log = subprocess.run(["ffmpeg", "-v", "info", "-i", wav, "-af", "silencedetect=n=-40dB:d=0.08", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    a = ends[0] if starts and starts[0] < 0.01 and ends else 0.0
    b = starts[-1] if starts and (not ends or len(starts) > len(ends)) else d
    return a, max(b, a + 0.1)

def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return float(out)

def main():
    meta = json.load(open(os.path.join(HERE, "meta.json")))
    end = float(meta["end"])
    sents = parse(os.path.join(HERE, "pages.txt"))
    tmp = tempfile.mkdtemp(prefix="example-audio-")
    voice = arg("--voice", "PIPER_VOICE")
    piper = arg("--piper", "PIPER") or shutil.which("piper")
    slow = arg("--slow", default="1.0")
    engine = "piper" if voice and piper and os.path.exists(voice) else "espeak-ng" if shutil.which("espeak-ng") else "beep"
    clips, words = [], []
    prev_end = 0.0
    for i, (text, pin) in enumerate(sents):
        wav = os.path.join(tmp, f"s{i}.wav")
        toks = text.split()
        if engine == "piper":
            subprocess.run([piper, "-m", voice, "--length-scale", slow, "-f", wav], input=text, text=True,
                           check=True, capture_output=True)
            a, b = speech_span(wav)
            at = pin if pin is not None else prev_end + PAUSE - a
        elif engine == "espeak-ng":
            subprocess.run(["espeak-ng", "-v", "en", "-s", "150", "-w", wav, text], check=True)
            a, b = 0.0, min(duration(wav), GAP - 0.2)
            at = pin if pin is not None else (clips[-1][1] if clips else 0.0) + GAP
        else:
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=0.3",
                            "-af", "afade=t=out:st=0.2:d=0.1,volume=0.5", wav], check=True)
            a, b = 0.0, min(0.22 * len(toks), 2.7)
            at = pin if pin is not None else (clips[-1][1] if clips else 0.0) + GAP
        if clips and at + a < prev_end:
            sys.exit(f"sentence {i + 1} ({text[:40]!r}) would start at {at + a:.2f} s, before the one "
                     f"before it ends ({prev_end:.2f} s): move its @ pin later, or use a smaller --slow")
        clips.append((wav, at))
        prev_end = at + b
        step = (b - a) / len(toks)
        for j, w in enumerate(toks):
            words.append({"w": w, "s": round(at + a + j * step, 2), "e": round(at + a + (j + 1) * step, 2)})
    if prev_end > end:
        sys.exit(f"the speech ends at {prev_end:.2f} s, after meta.json end ({end} s): raise end")
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-t", str(end), "-i", "anullsrc=r=48000:cl=mono"]
    for wav, _ in clips:
        cmd += ["-i", wav]
    delays = ";".join(f"[{k + 1}:a]aresample=48000,aformat=channel_layouts=mono,adelay={int(at * 1000)}[d{k}]" for k, (_, at) in enumerate(clips))
    mix = "[0:a]" + "".join(f"[d{k}]" for k in range(len(clips))) + f"amix=inputs={len(clips) + 1}:normalize=0:duration=first[a]"
    os.makedirs(os.path.join(ROOT, "public"), exist_ok=True)
    out = os.path.join(ROOT, "public", "example.m4a")
    cmd += ["-filter_complex", delays + ";" + mix, "-map", "[a]", "-c:a", "aac", "-b:a", "96k", "-ar", "48000", out]
    subprocess.run(cmd, check=True)
    json.dump(words, open(os.path.join(HERE, "words.json"), "w"), indent=1)
    open(os.path.join(HERE, "transcript.txt"), "w", encoding="utf-8").write("\n".join(t for t, _ in sents) + "\n")
    print(f"wrote {out} ({duration(out):.1f} s, {engine}) and words.json ({len(words)} words)")
    subprocess.run(["bash", os.path.join(ROOT, "tools", "verify_media.sh"), out], check=True)

if __name__ == "__main__":
    main()
