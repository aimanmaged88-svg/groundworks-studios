# Sonics countdown promo

A 15-second 1080x1920 (9:16) promo for Reels, TikTok and Stories. The
day count is computed at render time, so re-running it tomorrow gives
tomorrow's number — no editing.

## Re-render

    NODE_PATH=/opt/node22/lib/node_modules node render.js
    ffmpeg -y -framerate 30 -i frames/f_%04d.png \
      -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p \
      -movflags +faststart sonics-countdown.mp4

Takes about four minutes. Needs Chromium via Playwright, and a network
path to Google Fonts for Archivo and Hanken Grotesk.

## The beats

    0.0s  logo ignites on black
    1.3s  number spins down and locks, blue flash
    3.7s  Friday nights at Bankstown / ages 10-17
    6.3s  every skill level / nobody gets cut for turning up new
    8.9s  SAT 3 OCT, 2:00PM, Bankstown Basketball Stadium
   11.5s  come down and have a run / text 0414 145 332

Silent on purpose — add trending audio in the app, it reaches further
than a baked-in track.

## Changing it

Copy lives in `promo.html`, one block per scene. Timings are the `SC`
array in the script at the bottom. Photos are `lineup.jpg` (Friday
night) and `huddle.jpg` (the final buzzer); swap the files to swap the
shots.
