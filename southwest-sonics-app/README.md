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
A working, tap-through demo with **four access tiers** — switch roles from the strip at the top:
- **Admin** (Nour, Abdulla) — control centre: registered vs not, playing this Friday, fees collected vs outstanding, a money view with per-player **Follow up**, registrations with consent/medical flags, a dedicated **Coaches** section (staff, WWCC clearances, team assignments), the Friday schedule grid, a roles board and a shared task list (the "who does what" fix).
- **Coach** — their team roster, Friday availability (in / out / no reply), nudge + message.
- **Parent** — register a child, pay fees, confirm the child's availability, see schedule + roster. Can link multiple children.
- **Player** — the athlete's own view: *Am I playing this Friday? Who's on my team?* with fees shown read-only (a parent handles them).

Branding uses the club's real identity — the actual South West Sonics badge (`logo.png`, taken from the @swsonics profile and cleaned to a transparent circle) is the app mark, login logo and favicon. Data is seeded and stored in the browser (`localStorage`); a **Reset demo data** button restores it.

**Status:** Phase 1 prototype built. Next: real logins + shared database (Supabase), then installable PWA. See `PLAN.md`.
