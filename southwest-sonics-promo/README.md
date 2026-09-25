# Sonics tryouts promo

30 seconds, 1080x1920 (9:16), for Reels, TikTok and Stories. Pure
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
    26.0s  Come down and have a run
           -> Text 0414 145 332
           -> Link in bio

Paced for reading: each line fades in over 0.4s, finishes its zoom by
0.55s, then sits nearly still until the 0.36s fade out. That leaves
1.1-2.2s of settled, readable type per scene, and the date card and the
phone number get the longest holds. The closing scene staggers its
four parts so the badge, the line, the number and the link each land
separately.

The registration link that belongs in the bio:
https://sonics-register.netlify.app

Silent on purpose — trending audio added in the app reaches further
than a baked-in track.

## Changing it

One block per scene in `promo.html`. Timings and zoom direction live in
the `SC` array at the bottom: `[scene, start, end, dir]`, where dir is
`1` to punch in and `-1` to pull out. Blue scenes are listed in
`isBlue()`.

---

# Run It Back — returning players

`return.html` / `render-return.js` → `sonics-run-it-back-Ndays.mp4`

31 seconds, same engine and pacing as the tryouts cut. Written for kids
already in the club: it speaks to them as Sonics, frames the new season
as the next chapter, and closes on an assumption ("See you on the 3rd")
rather than an ask. It never says or implies anyone has left.

    0.0s  badge
    2.3s  the number
    5.3s  To every Sonic. / This one's for you          (blue)
    7.5s  Last season was just the start.
   10.1s  Same crew. Same court. Bigger season.         (blue)
   12.9s  Last year you were the rookie. /
          This year, they're watching you.
   16.1s  We've been to Japan. Next up New Zealand 2027 (blue)
   19.2s  Friday nights. Bankstown. Your team.
   21.8s  RUN IT BACK.                                  (blue)
   24.1s  Returning & new players — Sat 3 Oct, 2:00pm
   27.2s  See you on the 3rd. / Text 0414 145 332 / Link in bio

Lines inside a scene stagger in via `data-in="<seconds>"` on the element.

    NODE_PATH=/opt/node22/lib/node_modules node render-return.js
    ffmpeg -y -framerate 30 -i frames/f_%04d.png -c:v libx264 -preset slow \
      -crf 18 -pix_fmt yuv420p -movflags +faststart sonics-run-it-back.mp4
