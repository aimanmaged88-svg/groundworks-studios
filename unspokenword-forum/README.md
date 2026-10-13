# Unspoken — Open Forum

A phone-first, cloud-backed site for running a live **open forum** for
**[@unspokenword88](https://www.instagram.com/unspokenword88/)** — register
attendees, reveal the Zoom link privately, run a live upvoted Q&A, and moderate it
from a host console. Format: short teach (~10 min) → open Q&A, on Zoom.

**Live:** https://unspokenword-forum.netlify.app
- `#register` — public registration + Add-to-Calendar + Zoom link after sign-up
- `#live` — attendee companion: Join button, live Q&A (ask + upvote), reflections
- `#host` — your console (studio passphrase): edit the event, set the Zoom link, watch sign-ups, run the Q&A

See **[FORUM-PLAYBOOK.md](FORUM-PLAYBOOK.md)** for the run-of-show, promo pack, and reminder messages.

## How you run it

1. Go to the live URL + `#host`, log in with your **studio passphrase** (same one).
2. **Event details** — set title, date/time (in your own phone's clock; attendees see it converted to both timezones), duration, status (`open` while registering, `live` during, `ended` after).
3. **Zoom link** — paste your meeting URL + passcode. It's stored privately and only revealed to people *after* they register (keeps the room safe from zoom-bombing).
4. Share the register link in your bio/Stories. Watch sign-ups roll in; export CSV for reminders.
5. During the forum, use **Run the Q&A** to spotlight (`Answering`) and tick off (`Answered`) questions; attendees upvote so the best rise.

## Backend (cloud)

Supabase project `egffberfhnnkhtiscaol`, isolated `uw_*` objects:

- **`uw_event`** (singleton) — public-readable event details, owner-writable.
- **`uw_secret`** (singleton) — Zoom URL + passcode, **owner-only** (never exposed to the public API).
- **`uw_registrations`** — sign-ups; inserted only via the `uw_register()` function, readable only by the owner (emails are never public).
- **`uw_questions`** — live Q&A; anyone can post + read (hidden ones excluded), owner moderates. `[reflection] …` rows are the private post-event feedback, filtered out of the public board.
- **RPCs** (`security definer`): `uw_register(name,email)` inserts a sign-up and returns the Zoom link; `uw_vote(qid)` adds an upvote. These are intentionally callable without login — that's how public registration and voting work.

RLS is on for every table. The anon/publishable key and owner email are in the client by design; the passphrase is never stored in the repo.

## Deploy

Static, no build. Netlify site `unspokenword-forum` (team `aimanmaged88`).
Redeploy from this folder; `.netlify/` is git-ignored.
