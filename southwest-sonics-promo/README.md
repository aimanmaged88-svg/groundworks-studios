# Sonics tryouts promo

29 seconds, 1080x1920 (9:16), for Reels, TikTok and Stories. Pure
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
     2.3s  the number spins down and locks
     5.3s  WHY TURN UP?                        (blue)
     7.3s  Never played before? Good.
     9.9s  Nobody gets cut.                    (blue)
    12.5s  Every skill level.
    15.0s  Walk in knowing nobody. Leave with a team.
    17.9s  Our juniors have played in Japan.   (blue)
    20.6s  SAT 3 OCT, 2:00PM, Bankstown Basketball Stadium
    23.7s  Ages 10-17, all skill levels
    26.0s  Come down and have a run / Text 0414 145 332

Paced for reading: each line fades in over 0.4s, finishes its zoom by
0.55s, then sits nearly still until the 0.36s fade out. That leaves
1.1-2.2s of settled, readable type per scene, and the date card and the
phone number get the longest holds.

Silent on purpose — trending audio added in the app reaches further
than a baked-in track.

## Changing it

One block per scene in `promo.html`. Timings and zoom direction live in
the `SC` array at the bottom: `[scene, start, end, dir]`, where dir is
`1` to punch in and `-1` to pull out. Blue scenes are listed in
`isBlue()`.
