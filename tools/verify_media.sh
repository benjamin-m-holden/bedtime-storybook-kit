#!/usr/bin/env bash
# usage: verify_media.sh FILE [ORIGINAL]
# 1. Decode every stream of FILE end to end. `ffmpeg -v error` prints NOTHING when the file is
#    sound, so any output at all is a failure.
# 2. With ORIGINAL: the first audio stream must have the same packet count and (within 50 ms)
#    the same duration as the untouched original. Tags are cheap to add and expensive to get
#    wrong: a file whose tags read back fine can still have a broken sample table.
set -u
f=${1:?usage: verify_media.sh FILE [ORIGINAL]}
orig=${2:-}
fail=0
err=$(ffmpeg -v error -i "$f" -f null - 2>&1)
if [ -n "$err" ]; then
  echo "FAIL decode errors in $f:"; echo "$err" | head -20; fail=1
else
  echo "ok   $f decodes with 0 errors"
fi
probe() { ffprobe -v error -select_streams a:0 -count_packets -show_entries stream=nb_read_packets:format=duration -of default=nw=1 "$1" | tr '\n' ' '; }
if [ -n "$orig" ]; then
  pn() { ffprobe -v error -select_streams a:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0 "$1"; }
  dur() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }
  a=$(pn "$orig"); b=$(pn "$f"); da=$(dur "$orig"); db=$(dur "$f")
  if [ "$a" != "$b" ]; then echo "FAIL audio packets: original $a, now $b"; fail=1
  else echo "ok   audio packets match ($a)"; fi
  if awk -v a="$da" -v b="$db" 'BEGIN{d=a-b; if(d<0)d=-d; exit !(d<=0.05)}'; then echo "ok   duration matches ($da s vs $db s)"
  else echo "FAIL duration: original $da s, now $db s"; fail=1; fi
fi
exit $fail
