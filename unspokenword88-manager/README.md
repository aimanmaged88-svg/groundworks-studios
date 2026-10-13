# Unspoken Word — Instagram Studio

A phone-first, **cloud-based** control room for the Instagram page
**[@unspokenword88](https://www.instagram.com/unspokenword88/)** — neurodivergent
family life, burnout, regulation, and a signature **"Foods that regulate"**
talk-to-camera series.

**Live:** https://unspokenword88-manager.netlify.app
(log in with your passphrase — sent to you privately, never stored in this repo)

Single static `index.html` + a Supabase backend. Deploys on the Groundworks
Studio Netlify team like every other site in this repo.

## What's inside

Seven tabs along the bottom:

| Tab | What it's for |
|-----|---------------|
| **Photos** | Your **cloud roll**. Upload photos/clips of Asiya from anywhere; they're stored privately in the cloud and sync across devices. Flag **★ Best**, mark a shot's **Face visible** (dignity), write the caption, set a **status** (Idea / Picked / Posted) and a **post date**, filter, and delete. |
| **Plan** | Live **picks & schedule** pulled from your Photos, plus the weekly batch-and-drip rhythm and the 4 content pillars. |
| **Film** | Ready-to-film talk-to-camera scripts with a built-in **auto-scroll teleprompter**, on-screen text, b-roll, CTA, copy buttons. |
| **Hooks** | 25-line hook bank + random-hook shuffle. |
| **Captions** | Caption templates, 4 hashtag sets, reusable "not medical advice" line. |
| **Kit** | Talk-to-camera, lighting, sound, editing (CapCut), pre-film checklist. |
| **Grow** | Save/share growth loop, series strategy, repurposing, dignity & safety rules. |

## Backend (cloud)

Hosted on the **Life OS** Supabase org, project `egffberfhnnkhtiscaol`
(`https://egffberfhnnkhtiscaol.supabase.co`). Fully isolated from the other apps
on that project:

- **Table `public.uw_media`** — one row per photo/clip (path, caption, note,
  `best`, `face_visible`, `status`, `scheduled_for`, `script_key`, timestamps).
  Row-Level Security is **on**, with a single owner-only policy
  (`public.uw_is_owner()` — the signed-in email must match the owner).
- **Private storage bucket `unspokenword-media`** — the actual image/video files,
  not public. Owner-only RLS on `storage.objects`; the app reads them through
  short-lived **signed URLs**, so nothing is exposed on a public URL.
- **Auth** — one owner user (passphrase login via Supabase Auth
  `signInWithPassword`). The session persists on the device.

### Config (safe to commit)

In `index.html`:
```js
var SB_URL="https://egffberfhnnkhtiscaol.supabase.co";
var SB_KEY="sb_publishable_...";   // publishable key — public by design
var OWNER_EMAIL="aimanmaged88@gmail.com";
var BUCKET="unspokenword-media";
```
The **passphrase is not in the repo.** To rotate it, update the owner user's
password in Supabase (Auth → Users, or SQL with `extensions.crypt`).

## Deploy

Static — no build. Deployed to Netlify site `unspokenword88-manager`
(team `aimanmaged88`). Redeploy by running the Netlify deploy from this folder,
or wire up Git CD. `.netlify/` is git-ignored.

## Editing the content

The studio content is plain data at the top of the `<script>` in `index.html`:
`SCRIPTS`, `HOOKS`, `CAPTIONS`, `TAGSETS`, `DISCLAIMER`. Add a script by copying
one `{...}` in `SCRIPTS`. The cloud/photo logic is in the `CLOUD (Supabase)`
block lower down.

## A note on the content

Health-adjacent (food + regulation). Scripts are written as **lived experience,
not medical advice** — "here's what helped us", never "this cures/treats". Keep
that framing, and keep Asiya's dignity first (the **Face visible** flag + the
Grow-tab rules) when adding more.
