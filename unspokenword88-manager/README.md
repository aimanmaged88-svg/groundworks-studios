# Unspoken Word — Instagram Studio

A phone-first, cloud-based "control room" for the Instagram page
**[@unspokenword88](https://www.instagram.com/unspokenword88/)** — a page giving
words to the unspoken parts of neurodivergent family life (burnout, regulation,
sensory needs) with a signature **"Foods that regulate"** talk-to-camera series.

Open `index.html` on your phone (bookmark it / add to home screen) and film.
No build step, no login — a single static file that deploys like every other
site in this repo (Netlify / GitHub Pages).

## What's inside

Six tabs along the bottom:

| Tab | What it's for |
|-----|---------------|
| **Plan** | The weekly rhythm (batch once, drip all week), the 4 content pillars, and a tick-off batch-day checklist (saved in your browser). |
| **Film** | Ready-to-film talk-to-camera scripts for the *Foods that regulate* series — each with a hook, a built-in **auto-scroll teleprompter**, on-screen-text beats, b-roll ideas, a CTA, and copy buttons. |
| **Hooks** | A 25-line hook bank + a "random hook" shuffle. The first 2 seconds are everything. |
| **Captions** | Copy-paste caption templates, four hashtag sets, and a reusable "not medical advice" disclaimer line. |
| **Kit** | Talk-to-camera, lighting, sound, framing, the teleprompter trick, free editing (CapCut), and a 60-second pre-film checklist. |
| **Grow** | The save/share growth loop, how to run it as a numbered series, repurposing 1 reel → 3 posts, and dignity/safety rules (kids' faces, no medical advice in DMs). |

## The teleprompter

In the **Film** tab, tap **▶ Teleprompter** on any script. The text auto-scrolls
past a teal sightline — prop this phone beside your filming camera so your eyes
stay near the lens. Adjust pace with **− / +**, pause anytime. Glance, don't read;
let the words come out as yours.

## Editing the content

Everything is plain data at the top of the `<script>` block in `index.html`:

- `SCRIPTS` — the reel scripts (hook, spoken lines, on-screen text, b-roll, CTA)
- `HOOKS` — the hook bank
- `CAPTIONS` — caption templates
- `TAGSETS` — hashtag sets
- `DISCLAIMER` — the reusable health-content disclaimer

Add a new script by copying one `{...}` object in `SCRIPTS` and editing the text.
No other changes needed — the page re-renders itself.

## A note on the content

The page is health-adjacent (food + neurodivergent regulation). The scripts are
written as **lived experience, not medical advice** — "here's what helped us",
never "this cures/treats". The disclaimer line and the safety rules in the Grow
tab keep the creator honest and protected. Keep that framing when you add more.
