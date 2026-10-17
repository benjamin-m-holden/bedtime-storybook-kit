# Local changes to the vendored StPageFlip 2.0.7 (MIT, see LICENSE-page-flip.txt)

1. **Release rule** (in `page-flip.browser.js`). In `stopMove()`, a dragged page used to finish
   turning only when its corner was pulled past the spine (`t.x<=0`); on a phone that means
   dragging to the far left edge of the screen. It now turns when dragged past the middle of the
   page (`t.x<=e.pageWidth/2`): drag more than halfway and let go, it turns; less, it falls back.
   One expression; search for `pageWidth/2`. On a phone (portrait, one page at a time) the library
   measures a *backward* turn from the other side: the release value runs negative and grows with
   the drag (-75 at a 15% drag, -318 at 80%, page width 374). So a backward portrait turn uses
   `t.x<=-e.pageWidth/2`; every other turn uses `t.x<=e.pageWidth/2`.

2. **`mobileScrollSupport:false`** (an option, set in `web/build_book.py`, not a change to this
   file). With it on, the library's phone drag detection missed longer drags and then treated
   lifting the finger as a tap, turning the page toward whichever side the finger lifted on. Off,
   a finger on the book always drives the page; a page that embeds the book still scrolls from
   anywhere outside it.
