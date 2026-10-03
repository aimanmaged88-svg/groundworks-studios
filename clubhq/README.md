# ClubHQ

A white-label club operating system for grassroots sports clubs — the system built
for Clutch Basketball, turned into a template any club can run on a monthly
subscription. One config file + one logo = a fully branded club platform.

Every club gets **two apps** and **one private backend**:

| Piece | Who uses it | What it does |
|---|---|---|
| **Staff app** (`<club>-hq`) | Admins + coaches | Week board with clashes & alerts, teams, rosters, player files, registrations pipeline, fees + numbered receipts + payment plans, coach WWCC-style check tracking, moderated community board, family messaging, seasons archive, spreadsheet import |
| **Family app** (`<club>`) | Parents + players | Schedule with In/Out game availability, results + game film links, fees view, coach chat, club board & gallery, kid mode with its own 6-digit sign-in and share-card |
| **Supabase project** | — | Postgres with row-level security doing the real gatekeeping, storage for photos/clips, 5 edge functions for invites, codes and public registration |

No app stores, no passwords to manage for the club: admins mint one-time codes and
invite links, parents set their own password, kids sign in with a 6-digit code their
parent makes, and forgotten passwords are fixed over WhatsApp with a fresh code.

## Folder map

```
clubhq/
  new-club.mjs            stamps a new club from the template
  INTAKE.md               the form a new club fills in (becomes club.config.json)
  template/
    staff/index.html      staff app, tokenized
    family/               family app + PWA manifest + service worker, tokenized
    supabase/setup.sql    full schema, RLS, functions, triggers, storage, seed
    supabase/functions/   activate · kid-login · join · setup · register
  clubs/
    clutch/               Clutch Basketball — the first ClubHQ instance
      club.config.json    the worked example of a filled-in config
```

## Spinning up a new club

1. **Intake** — have the club fill in `INTAKE.md`, and get their logo
   (square PNG), favicon and a 192px icon.
2. **Config** — copy `clubs/clutch/club.config.json` to
   `clubs/<slug>/club.config.json` and fill in their answers. Drop the logo files
   into `clubs/<slug>/assets/`.
3. **Backend** — create a Supabase project (closest region to the club), run
   `clubs/<slug>/supabase/setup.sql` in the SQL editor, then deploy the five edge
   functions with `supabase functions deploy <name> --no-verify-jwt`.
   Put the project URL + publishable key into the config.
4. **Stamp** — `node new-club.mjs clubs/<slug>/club.config.json`
5. **Deploy** — drag `clubs/<slug>/staff` and `clubs/<slug>/family` onto Netlify
   (or wire them to this repo). Host names should match `staffUrl` / `familyUrl`.
6. **First admin** — in the Supabase SQL editor:
   `select create_activation_code('admin', null, 'their@email.com');`
   They sign in at the staff app → "I have a code". Everything else (venues,
   teams, players, coach invites, family codes) happens inside the app.

## What the config controls

- **Branding** — name, short name, tagline, emoji, colours (dark + light theme
  accents), logo, PWA identity.
- **Sport language** — what players score (`points`/`goals`/`runs`/`tries`), what
  they play on (`court`/`field`/`pitch`), age groups and cutoffs, the scoresheet
  name, the game-film site (GloryLeague, or blank for a plain "video" label).
- **Region** — timezone, locale (drives date & money formatting), currency symbol,
  phone country code, the WhatsApp number behind password resets, and the
  child-safety check (WWCC in NSW — rename it for other states/countries),
  day-first vs month-first spreadsheet imports.
- **Culture** — greetings used in generated WhatsApp messages and receipts
  (e.g. Salaam / Assalamu alaykum / JazakAllahu khayran for Clutch), the prayer-time
  countdown on the schedule (Maghrib marker, lat/lon drives the sunset calc),
  the share-card hashtag.
- **Club defaults** — contact person, email, phone, base suburb, default
  competition name and season fee, minimum roster / game numbers, staff to-do
  owners.

## Notes

- Each club = its own Supabase project, so club data is fully isolated and a club
  can be switched off by pausing its project.
- `supabaseKey` is the *publishable* key — safe in the page; RLS is the security
  boundary. The service-role key lives only in edge-function secrets.
- Re-running `new-club.mjs` is idempotent: fix the config, rerun, redeploy.
- The kid sign-in uses synthetic emails under `playerEmailDomain`; no mail is ever
  sent to them.
