#!/usr/bin/env python3
"""Turn the page text as told into pages.json: every sentence with the time it is spoken.

usage: time_pages.py STORY_DIR

Reads STORY_DIR/pages.txt and STORY_DIR/words.json (from tools/transcribe.py), writes
STORY_DIR/pages.json ([{"page", "s": [{"text", "at"}]}]) and STORY_DIR/page-text.md.

pages.txt: one sentence per line, a blank line starts a new page, "#" lines are comments.
A trailing "@12.3" PINS the sentence to that time (seconds). Every other sentence is found in
words.json: its first three words are matched in order (then its first two) within the next 400
words after the previous sentence. A sentence that cannot be found and is not pinned is an error
listing the sentence: fix the text (it must follow what was said) or pin it.
"""
import json, os, re, sys

def norm(w): return re.sub(r"[^a-z0-9']", "", w.lower())

def parse(path):
    pages, cur = [], []
    for line in open(path, encoding="utf-8"):
        line = line.strip()
        if line.startswith("#"):
            continue
        if not line:
            if cur: pages.append(cur); cur = []
            continue
        m = re.match(r"^(.*?)\s*@(\d+(?:\.\d+)?)$", line)
        cur.append((m.group(1), float(m.group(2))) if m else (line, None))
    if cur: pages.append(cur)
    return pages

def main(story):
    pages = parse(os.path.join(story, "pages.txt"))
    d = json.load(open(os.path.join(story, "words.json")))
    flat = [w for s in d for w in s["words"]] if d and "words" in d[0] else d
    toks = [(norm(w["w"]), w["s"]) for w in flat if norm(w["w"])]
    pos, out, problems = 0, [], []
    for n, sents in enumerate(pages, 1):
        row = []
        for text, pin in sents:
            want = [norm(w) for w in text.split() if norm(w)]
            at = None
            for k in (3, 2, 1):
                head = want[:k]
                if len(head) < k and k > 1: continue
                for i in range(pos, min(len(toks), pos + 400)):
                    if [t[0] for t in toks[i:i + k]] == head:
                        at, pos = toks[i][1], i + k
                        break
                if at is not None: break
            if pin is not None:
                at = pin
                # keep the cursor roughly in step with a pinned sentence
                nxt = [i for i in range(pos, len(toks)) if toks[i][1] >= pin]
                if nxt: pos = max(pos, nxt[0])
            if at is None:
                problems.append(f"page {n}: could not time: {text}")
                continue
            row.append({"text": text, "at": round(at, 2)})
        out.append({"page": n, "s": row})
    if problems: sys.exit("\n".join(problems))
    json.dump(out, open(os.path.join(story, "pages.json"), "w"), indent=1, ensure_ascii=False)
    with open(os.path.join(story, "page-text.md"), "w", encoding="utf-8") as f:
        for p in out:
            f.write(f"## Page {p['page']}\n\n" + "\n".join(f"- [{s['at']:.1f}s] {s['text']}" for s in p["s"]) + "\n\n")
    print(f"{story}/pages.json: {len(out)} pages, {sum(len(p['s']) for p in out)} sentences")

if __name__ == "__main__":
    main(sys.argv[1])
