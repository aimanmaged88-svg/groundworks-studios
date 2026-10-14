# Mission Control — unspoken word

A **desktop-first command center** that ties the whole @unspokenword88 toolkit
together and makes running a live session easy to set up and organize.

**Live:** https://unspokenword-hub.netlify.app
🔒 Private — passphrase login (same owner as the Studio / Forum host).

## What's on it

- **Next session hero** — title, date in both timezones, status, live countdown, and one-click into the Host console or the register page.
- **Share the session** — the register link + a **QR code** to drop on a slide or Story sticker, with copy buttons.
- **Live numbers** — registrations and questions pulled straight from the cloud, days-to-go, and current status.
- **🚀 Launch kit** — marketable, call-to-action teasers ready to copy (teaser reel script, countdown caption, a "write your questions" CTA, 3 Story slides, a DM teaser).
- **⚙️ Session setup** — paste the private Zoom link (saved to the owner-only secret) and flip the event status (draft → open → live → ended) without opening the full console.
- **✅ Today's plan** — a tick-off checklist for a launch day (record, cut teaser, post, set Zoom, reply).
- **🧰 Toolkit** — quick links to the Studio, Forum, Playbook, and the Word app.

## Backend

Reads/writes the same Supabase project (`egffberfhnnkhtiscaol`) as the Forum:
`uw_event`, `uw_secret`, `uw_registrations`, `uw_questions`. All owner-gated by
RLS behind passphrase login. The checklist state is stored locally in the
browser. Static `index.html`; QR via qrcodejs (cdnjs), Supabase via jsDelivr.
Brand-themed (warm black + burnt orange + slab serif).
