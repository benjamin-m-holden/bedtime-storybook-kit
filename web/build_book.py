#!/usr/bin/env python3
"""Build the flippable web version of a picture book: OUT_DIR/index.html and its images.

usage: python3 -I web/build_book.py STORY_DIR STILLS_DIR OUT_DIR [--names names.json]

STORY_DIR holds meta.json (title, told_by) and pages.json; STILLS_DIR is the output of
web/render_stills.py. Text pages are real text (the narrator's words), pictures are the stills
converted to WebP, and page turning is StPageFlip 2.0.7 (MIT, web/vendor/). There is no audio,
only a page-turn sound made in the browser. Needs Pillow (pip install pillow).

--names names.json: an OPTIONAL swap applied to every text page, the title and the alt text,
for a book you publish. It maps a real name to a neutral one, e.g. {"Pip": "Pippin"}, and a
key starting with "_" is a comment. The build stops if a swapped name is still in the output.
View it with:  python3 -m http.server -d OUT_DIR 8123
"""
import json, re, shutil, sys
from html import escape
from pathlib import Path

here = Path(__file__).resolve().parent
args = [a for a in sys.argv[1:]]
names_file = None
if "--names" in args:
    k = args.index("--names"); names_file = Path(args[k + 1]); del args[k:k + 2]
story, frames, out = (Path(a) for a in args[:3])
META = json.loads((story / "meta.json").read_text())
PAGES = json.loads((story / "pages.json").read_text())
NAMES = {k: v for k, v in json.loads(names_file.read_text()).items() if not k.startswith("_")} if names_file else {}
TITLE = META["title"]
TOLD = META.get("told_by") or "the storyteller"
N = len(PAGES)

def swap(s):
    for a, b in NAMES.items():
        s = re.sub(rf"\b{re.escape(a)}\b", b, s)
    return s

def images():
    """Stills -> web images in OUT/img (pictures 960x1080; cover and closing spread split in halves)."""
    from PIL import Image
    files = sorted(frames.glob("element-*.png"), key=lambda p: int(re.search(r"(\d+)", p.stem).group(1)))
    assert len(files) == N + 2, f"expected {N + 2} stills in {frames}, found {len(files)}"
    f = lambda k: Image.open(files[k]).convert("RGB")
    img = out / "img"; img.mkdir(parents=True, exist_ok=True)
    for k in range(N):
        f(k).crop((0, 0, 960, 1080)).save(img / f"p{k + 1:02d}.webp", "WEBP", quality=80, method=6)
    cv = f(N)
    cv.crop((0, 0, 960, 1080)).save(img / "cover-l.webp", "WEBP", quality=82, method=6)
    cv.crop((960, 0, 1920, 1080)).save(img / "cover-r.webp", "WEBP", quality=82, method=6)
    e = f(N + 1)
    e.crop((0, 0, 960, 1080)).save(img / "end-l.webp", "WEBP", quality=82, method=6)
    e.crop((960, 0, 1920, 1080)).save(img / "end-r.webp", "WEBP", quality=80, method=6)

out.mkdir(parents=True, exist_ok=True)
images()
shutil.copytree(here / "vendor", out / "vendor", dirs_exist_ok=True)

def text_page(p):
    lines = "".join(f"<p>{escape(swap(s['text']))}</p>" for s in p["s"])
    return f'<div class="page text"><div class="in"><div class="stars">&#10022; &#10022; &#10022;</div><div class="words">{lines}</div><div class="num">{p["page"]}</div></div></div>'

def pic(src, alt):
    return f'<div class="page pic"><img src="{src}" alt="{escape(alt)}" loading="lazy" draggable="false"></div>'

pages = [pic("img/cover-l.webp", ""), pic("img/cover-r.webp", swap(f"Cover: {TITLE}, a bedtime story told by {TOLD}"))]
for p in PAGES:
    pages += [text_page(p), pic(f"img/p{p['page']:02d}.webp", f"Picture for page {p['page']}")]
pages += [pic("img/end-l.webp", swap(f"The End. Told by {TOLD}, at bedtime.")), pic("img/end-r.webp", "Everyone asleep")]
leftover = [n for n in NAMES if re.search(rf"\b{re.escape(n)}\b", "".join(pages))]
assert not leftover, f"unswapped names: {leftover}"

TEMPLATE = r'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>@@TITLE@@</title>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&display=swap" rel="stylesheet">
<style>
html,body{margin:0;background:transparent;font-family:Fredoka,system-ui,sans-serif}
.wrap{max-width:1200px;margin:0 auto;padding:8px}
#book{margin:0 auto}
.page{background:#fbf5e6;overflow:hidden;container-type:inline-size}
.pic img{width:100%;height:100%;object-fit:cover;display:block;user-select:none}
.text .in{height:100%;display:flex;flex-direction:column;box-sizing:border-box;padding:9cqw 9cqw 6cqw;color:#2b2346}
.stars{color:#d6b25a;text-align:center;letter-spacing:2cqw;font-size:3.6cqw;margin-bottom:5cqw}
.words{flex:1;display:flex;flex-direction:column;justify-content:center;font-weight:500;line-height:1.35;font-size:var(--fs,6.4cqw)}
.words p{margin:0 0 .55em}
.num{text-align:center;color:#a08e70;font-size:3.1cqw}
.bar{display:flex;justify-content:center;align-items:center;gap:14px;margin:12px 0 4px;font:600 15px Fredoka,system-ui}
.bar button{font:inherit;border:0;border-radius:999px;background:#2b2346;color:#fff;padding:8px 16px;cursor:pointer;white-space:nowrap}
.bar button:disabled{opacity:.35;cursor:default}.bar span{color:#6b6280;min-width:96px;text-align:center;white-space:nowrap}
button.snd{background:#ece4f6;color:#2b2346}button.snd[aria-pressed=false]{opacity:.6}
@media (max-width:420px){.bar .snd{padding:7px 9px}.bar{gap:8px;font-size:14px}.bar button{padding:7px 12px}}
html,body{overflow:hidden}
</style></head><body><div class="wrap">
<div id="book">@@PAGES@@</div>
<div class="bar"><button id="prev" aria-label="Previous page">&larr; Back</button><span id="where"></span><button id="snd" class="snd" aria-pressed="true" title="Page-turn sound">&#128264; Sound on</button><button id="next" aria-label="Next page">Next &rarr;</button></div>
</div>
<script src="vendor/page-flip.browser.js"></script>
<script>
// Everything on a text page is sized in cqw, so a page's best font size is the same at any
// width: measure each one once, off-screen at 480x540 (the page's 8:9 shape), before the book
// hides pages it is not showing.
function fit(){var m=document.createElement('div');m.style.cssText='position:absolute;left:-9999px;top:0;width:480px;height:540px';document.body.appendChild(m);
  document.querySelectorAll('#book .text').forEach(function(pg){var c=pg.cloneNode(true);c.style.cssText='width:480px;height:540px';m.appendChild(c);
    var w=c.querySelector('.words'),fs=6.4;w.style.setProperty('--fs',fs+'cqw');
    var inn=c.querySelector('.in');while(fs>3.6&&inn.scrollHeight>inn.clientHeight+1){fs-=0.2;w.style.setProperty('--fs',fs.toFixed(1)+'cqw')}
    pg.querySelector('.words').style.setProperty('--fs',fs.toFixed(1)+'cqw');m.removeChild(c)});document.body.removeChild(m)}
var book;
function start(){if(book)return;fit();
book=new St.PageFlip(document.getElementById('book'),{width:960,height:1080,size:'stretch',minWidth:240,maxWidth:960,minHeight:270,maxHeight:1080,
  maxShadowOpacity:0.35,showCover:false,usePortrait:true,mobileScrollSupport:false,flippingTime:900});
book.loadFromHTML(document.querySelectorAll('#book .page'));
var total=@@TOTAL@@, N=@@N@@;
// Page-turn sound, made in the browser (no sound file): low-passed noise that slides down in
// pitch over ~0.1 s, like a heavy page. Each turn varies a little so it does not sound
// mechanical. It only ever starts from the reader's own click, drag or key, which is what
// browsers require for sound. The on/off choice is remembered.
var ac=null,soundOn=localStorage.getItem('bookSound')!=='off';
function noise(c,len){var b=c.createBuffer(1,Math.floor(c.sampleRate*len),c.sampleRate),d=b.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b}
function turnSound(ctx,at){var c=ctx||ac,t=(at===undefined?c.currentTime:at)+0.01,len=0.22+Math.random()*0.04;
  var src=c.createBufferSource();src.buffer=noise(c,len+0.05);
  var lp=c.createBiquadFilter();lp.type='lowpass';lp.Q.value=0.7;lp.frequency.setValueAtTime(2600,t);lp.frequency.exponentialRampToValueAtTime(700,t+len);
  var g=c.createGain();g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.38,t+0.07);g.gain.exponentialRampToValueAtTime(0.0005,t+len);
  src.connect(lp).connect(g).connect(c.destination);src.start(t);src.stop(t+len+0.05)}
function playTurn(){if(!soundOn)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();turnSound();window.turns=(window.turns||0)+1}catch(e){}}
window.turnSound=turnSound;  // exposed so a test can record the exact sound offline
function sndLabel(){var b=document.getElementById('snd');b.setAttribute('aria-pressed',soundOn);b.innerHTML=soundOn?'&#128264; Sound on':'&#128263; Sound off'}
function upd(){var i=book.getCurrentPageIndex(),n=Math.max(0,Math.floor((i-2)/2)+1);
  document.getElementById('where').textContent=i<2?'Cover':i>=total-2?'The End':'Page '+Math.min(N,n)+' of '+N;
  document.getElementById('prev').disabled=i===0;document.getElementById('next').disabled=i>=total-(book.getOrientation()==='portrait'?1:2)}
book.on('flip',upd);book.on('changeOrientation',upd);book.on('init',upd);
book.on('changeState',function(e){if(e.data==='flipping')playTurn()});
document.getElementById('snd').onclick=function(){soundOn=!soundOn;localStorage.setItem('bookSound',soundOn?'on':'off');sndLabel()};sndLabel();
document.getElementById('prev').onclick=function(){book.flipPrev()};document.getElementById('next').onclick=function(){book.flipNext()};
document.addEventListener('keydown',function(e){if(e.key==='ArrowRight')book.flipNext();if(e.key==='ArrowLeft')book.flipPrev()});
setTimeout(upd,300)}
(document.fonts?document.fonts.ready:Promise.resolve()).then(start);setTimeout(start,2500);
</script></body></html>'''
html = (TEMPLATE.replace("@@TITLE@@", escape(swap(TITLE))).replace("@@PAGES@@", "".join(pages))
        .replace("@@TOTAL@@", str(len(pages))).replace("@@N@@", str(N)))
(out / "index.html").write_text(html)
print("ok", len(pages), "pages ->", out / "index.html")
