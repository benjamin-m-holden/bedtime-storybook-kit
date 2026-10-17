#!/usr/bin/env python3
"""List every place two Whisper transcripts disagree, with times.
usage: compare_transcripts.py A_words.json B_words.json [labelA labelB]"""
import json, re, sys, difflib
def words(p):
    d = json.load(open(p))
    flat = [w for s in d for w in s["words"]] if d and "words" in d[0] else d
    return [(re.sub(r"[^a-z']", "", w["w"].lower()), w["s"], w["w"].strip()) for w in flat if re.sub(r"[^a-z']", "", w["w"].lower())]
a, b = words(sys.argv[1]), words(sys.argv[2])
la, lb = (sys.argv[3:5] + ["A", "B"])[:2] if len(sys.argv) > 3 else ("A", "B")
sm = difflib.SequenceMatcher(None, [x[0] for x in a], [x[0] for x in b], autojunk=False)
for op, i1, i2, j1, j2 in sm.get_opcodes():
    if op == "equal": continue
    t = a[i1][1] if i1 < len(a) else b[j1][1]
    ctx = " ".join(x[2] for x in a[max(0, i1 - 4):i1])
    print(f"{int(t // 60)}:{t % 60:05.2f}  ...{ctx}  | {la}: {' '.join(x[2] for x in a[i1:i2]) or '-'}  | {lb}: {' '.join(x[2] for x in b[j1:j2]) or '-'}")
