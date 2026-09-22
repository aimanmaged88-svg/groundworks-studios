# Sonics tryouts promo

20 seconds, 1080x1920 (9:16), for Reels, TikTok and Stories. Pure
graphic — no photography. Every scene punches in from oversize or pulls
out from undersize with a back-out overshoot, and the field flips
between black and Sonics blue on the three hardest lines.

The day count is computed at render time from the next 3 October, so
re-running it tomorrow gives tomorrow's number. No editing.

## Re-render

    NODE_PATH=/opt/node22/lib/node_modules node render.js
    ffmpeg -y -framerate 30 -i frames/f_%04d.png \
      -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
      -movflags +faststart sonics-tryouts.mp4

About four minutes. Needs Chromium via Playwright and a network path to
Google Fonts for Archivo and Hanken Grotesk.

## The beats

    0.0s  badge punches in
    1.6s  the number spins down and locks
    3.7s  WHY TURN UP?                        (blue)
    5.0s  Never played before? Good.
    6.7s  Nobody gets cut.                    (blue)
    8.3s  Every skill level.
    9.9s  Walk in knowing nobody. Leave with a team.
   11.8s  Our juniors have played in Japan.   (blue)
   13.6s  SAT 3 OCT, 2:00PM, Bankstown Basketball Stadium
   15.8s  Ages 10-17, all skill levels
   17.2s  Come down and have a run / Text 0414 145 332

Silent on purpose — trending audio added in the app reaches further
than a baked-in track.

## Changing it

One block per scene in `promo.html`. Timings and zoom direction live in
the `SC` array at the bottom: `[scene, start, end, dir]`, where dir is
`1` to punch in and `-1` to pull out. Blue scenes are listed in
`isBlue()`.
