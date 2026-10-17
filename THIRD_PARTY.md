# Third-party software

This repository's own code is MIT (see `LICENSE`). Everything below keeps its own license.

## Remotion 4.0.535 (a dependency, not vendored) -- READ THIS

The kit renders its videos with [Remotion](https://www.remotion.dev). It is installed from npm
(`npm ci`), never copied into this repository, and **the kit's MIT license does not cover it**.
Remotion's license (`node_modules/remotion/LICENSE.md`, once installed) is free for:

- individuals,
- for-profit organizations with up to 3 employees,
- non-profit and not-for-profit organizations,
- evaluating Remotion without using it commercially yet.

Larger for-profit companies need a Company License from <https://www.remotion.pro>. Check the
current terms yourself before using the kit commercially: they can change between versions.

## StPageFlip 2.0.7 (vendored in `web/vendor/`)

`web/vendor/page-flip.browser.js`, MIT, Copyright (c) 2020 Nodlik. The license text is kept in
`web/vendor/LICENSE-page-flip.txt`; the two local changes are described in
`web/vendor/PATCHES.md`.

## Fredoka (font)

Loaded at render time through `@remotion/google-fonts` (SIL Open Font License 1.1). The
flip book's HTML links the same family from Google Fonts. Nothing is committed.

## faster-whisper and Whisper models

`tools/transcribe.py` uses [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (MIT) and
OpenAI's Whisper model weights (MIT). You install the package and the model downloads on first
use; neither is part of this repository.

## Piper text-to-speech (optional, example audio only)

`stories/example/make_audio.py` can read the example aloud with
[Piper](https://github.com/OHF-Voice/piper1-gpl) (`piper-tts`, GPL-3.0-or-later). It is run as a
separate program that you install yourself; no Piper code is part of this repository, so the
kit's MIT license is unaffected. The suggested voice, `en_US-ljspeech-high`, was trained on the
LJ Speech dataset, which is in the public domain. Generated audio is not committed.

## ffmpeg

Used for all tagging, encoding and verification. Install it from your package manager; it is
not bundled. Its license depends on how your copy was built (LGPL or GPL).

## Pillow

`web/build_book.py` uses Pillow (HPND license) to convert stills to WebP.
