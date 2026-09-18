# Southwest Sonics App

Member portal + admin control centre for the **Sydney Southwest Sonics** basketball association.

Built around the club's #1 problem: **organisation, scheduling, and who does what.**

- **Directors** (Nour Kabbara — CEO/Founder; Abdulla Chamtia — Co-Director) get a full dashboard: who's paid, who's registered, follow-ups, rosters, and the Friday schedule.
- **Players/parents** open the app to see: *Am I registered? Am I playing this Friday? Who's on my team?*
- **v1 focus:** the Friday Juniors program (U12, U14, U16, U18). U21 and Saturday UBL come later.

## Files
- **[`index.html`](index.html)** — Phase 1 clickable prototype (single-file, Sonics-branded, seeded demo). Open it in a browser or drop the folder on Netlify.
- **[`PLAN.md`](PLAN.md)** — the full app & operations plan.

## Prototype (index.html)
A working, tap-through demo with three views — switch roles from the strip at the top:
- **Director** — control centre: registered vs not, playing this Friday, fees collected vs outstanding, a money view with per-player **Follow up**, registrations with consent/medical flags, coach WWCC tracking, the Friday schedule grid, a roles board and a shared task list (the "who does what" fix).
- **Coach** — my team roster, Friday availability (in / out / no reply), nudge + message.
- **Player/Parent** — *Am I registered? Am I playing this Friday? Who's on my team?* plus fees owing and a one-tap availability confirm.

Data is seeded and stored in the browser (`localStorage`); a **Reset demo data** button restores it. Branding uses a placeholder Sonics mark until the real logo is dropped in.

**Status:** Phase 1 prototype built. Next: real logins + shared database (Supabase), then installable PWA. See `PLAN.md`.
