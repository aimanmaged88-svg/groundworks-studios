# Word — a voice that learns them

A personalised, **offline-first** AAC (communication) app for the
**[@unspokenword88](https://www.instagram.com/unspokenword88/)** community —
a sibling to Asiya's Voice, built so **any** child or participant gets a board
that becomes *theirs* over time.

**Live:** https://unspokenword-voice.netlify.app
(installable — "Add to Home Screen" and it runs like a native app, no signal needed)

## What it does

- **Talking tile board** — tap words to speak them aloud (device text-to-speech), build sentences in the bar, hit **Speak**.
- **Personalised** — the whole board is editable: their words, their photos (a real face often beats a symbol), their phrases, their categories and colours. Multiple **profiles**, each with its own board.
- **Learns them over time** — a `✦ Likely now` row predicts what they're reaching for, tuned per child by:
  - **recency-weighted frequency** (what they use, with recent use weighted higher),
  - **time of day** (what they want *at this hour*),
  - **what-comes-next** (bigram: the word that usually follows the last one).
  It starts with sensible core words and sharpens as they use it.
- **Insights for you** — `What [name]'s words` shows their most-wanted words (this week / all time), when they talk most, and recent sentences — a window into what they're trying to say, so you can help them pinpoint what they want.

## Private by design

Everything — board, photos, usage history, learning — is stored **only on the
device**, in the browser. **Nothing is uploaded anywhere.** That keeps a child's
communication private, and means it works with no internet (essential for AAC).
Use **Settings → Export backup** to save a JSON you can restore on another device.

> This is not mind-reading, and it isn't a medical device. It's a communication
> aid that gets better at predicting a specific child's language the more they use
> it. Pair it with the guidance of their speech pathologist / AAC specialist.

## For the parent / carer

- **Child-locked editing** — press-and-hold the 🔓 lock (~1s) to enter edit mode, so kids can't wander into settings mid-use. Hold again to finish.
- **Settings** (⚙️) — pick the voice, speed & pitch; tiles-across (3–6); "speak each word as tapped"; bigger text; reset learning; export/restore backup; manage profiles.
- **Add a word** — in edit mode tap **＋ Add word**, or any tile to change it.

## Tech

Single `index.html` (no framework), `manifest.webmanifest`, `sw.js` (offline
service worker), and two PNG icons. Deployed static on Netlify like the rest of
the studio. Speech uses the browser's built-in `speechSynthesis`; photos are
downscaled to ~160px on import so storage stays small.
