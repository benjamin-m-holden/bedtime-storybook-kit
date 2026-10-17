#!/usr/bin/env python3
"""Transcribe a recording with faster-whisper: word timings for the whole story.

usage: transcribe.py RECORDING [--model large-v3] [--hint "Pip, Moon"] [--out-dir stories/<name>]

Writes words.json ([{"w", "s", "e"}], seconds) and transcript.txt into --out-dir (default: the
current directory). The hint is an initial prompt: put the names and odd words of the story in it
so Whisper spells them right. Install first:  pip install faster-whisper   (models are fetched from
Hugging Face on first use; ffmpeg must be on PATH).

large-v3 int8 on a CPU peaks around 6 GB of RAM; use --model large-v3-turbo (or medium.en) on
a smaller machine. Running two models and diffing them with tools/compare_transcripts.py is the
cheap way to find the places Whisper is unsure. If you prefer a container, run this same script
in any image that has faster-whisper and give it a memory cap such as docker run --memory=6500m.
"""
import argparse, json, os

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("recording")
    ap.add_argument("--model", default="large-v3")
    ap.add_argument("--hint", default="")
    ap.add_argument("--out-dir", default=".")
    ap.add_argument("--words-name", default="words.json")
    a = ap.parse_args()
    from faster_whisper import WhisperModel
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    segs, _ = model.transcribe(a.recording, word_timestamps=True, vad_filter=False, beam_size=5,
                               initial_prompt=a.hint or None, language="en")
    words, lines = [], []
    for seg in segs:
        lines.append(seg.text.strip())
        for w in seg.words or []:
            words.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})
    os.makedirs(a.out_dir, exist_ok=True)
    json.dump(words, open(os.path.join(a.out_dir, a.words_name), "w"), indent=1)
    open(os.path.join(a.out_dir, "transcript.txt"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"{len(words)} words -> {a.out_dir}/{a.words_name}, transcript.txt")

if __name__ == "__main__":
    main()
