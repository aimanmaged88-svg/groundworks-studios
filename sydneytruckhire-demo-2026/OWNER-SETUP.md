# Sydney Truck Hire — how the automated business works

Live site: https://sydneytruckhire-demo-2026.netlify.app
Owner dashboard: https://sydneytruckhire-demo-2026.netlify.app/admin.html

## What runs by itself already

- **Booking requests.** The "Book a truck" form on the site saves every request
  (name, phone, dates, auto/manual, what they're moving) into the booking system.
  If the booking system is ever unreachable, the form falls back to Netlify Forms
  so no request is lost.
- **Owner dashboard** (`/admin.html`). Log in to see new requests, confirm or
  decline them with one tap, call the customer straight from the card, add notes
  (truck assigned, deposit paid), and run the fleet board — tap a truck to mark it
  In the yard / Out on hire / In the shop; press-and-hold to rename a truck.
- **Daily ops check (6:49am Sydney).** Claude checks overnight booking requests,
  flags anything waiting more than 24 hours, and keeps the Google review count on
  the site in sync with the live Google listing, redeploying automatically when
  it changes.

## Dashboard access

Only approved emails can see bookings, even if someone else creates a login.
Currently approved: `aimanmaged88@gmail.com`.
To add the owner's email, ask Claude: "add <email> as a dashboard admin" —
then they tap "First time? Create login" on the dashboard page.

## 10-minute setup tasks (owner accounts needed)

1. **Email alerts for fallback enquiries** — Netlify dashboard →
   https://app.netlify.com/projects/sydneytruckhire-demo-2026 → Forms →
   Form notifications → add the owner's email.
2. **Deposits / card payments (Stripe)** — create a free Stripe account
   (stripe.com), then make a Payment Link for the deposit amount (e.g. $50).
   Send Claude the link and it goes on the site and in the dashboard's
   confirm flow.
3. **SMS auto-replies (Twilio or similar)** — create a Twilio account with an
   Australian number (~AU$6/month + ~5c/SMS). Send Claude the Account SID,
   Auth Token (as Netlify environment variables, never in chat) and the number,
   and Claude wires instant "Thanks, we got your booking request — we'll call
   you shortly" texts to every enquirer.

## Where things live (for future changes)

- Site + dashboard code: `sydneytruckhire-demo-2026/` in the
  `groundworks-studios` repo; deployed on Netlify (site id
  `6d2026ac-5679-44e9-b2a0-66704afd791b`).
- Bookings database: Supabase project `ymuwuhvqqftgpxwhzoub`
  (tables `sth_bookings`, `sth_trucks`, `sth_admins`; row-level security —
  the public can only submit, only admin emails can read).
