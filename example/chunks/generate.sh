#!/bin/bash
input="input.mp4"
duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$input")
duration=${duration%.*} # round down to integer seconds

i=0
start=0
chunk=10

while [ $start -lt $duration ]
do
  ffmpeg -i "$input" -ss $start -t $chunk \
    -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k \
    "$(printf "%03d" $i).mp4"
  start=$((start+chunk))
  i=$((i+1))
done

for f in *.mp4; do ffmpeg -i "$f" -vcodec copy -an -bsf:v h264_mp4toannexb "${f:0:3}.h264"; done

for f in *.mp4; do ffmpeg -i "$f" -acodec copy -vn "${f:0:3}.aac"; done

rm [0-9][0-9][0-9].mp4
