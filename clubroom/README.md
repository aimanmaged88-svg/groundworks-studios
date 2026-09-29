# Clubroom

The one place a junior sports club runs from: registrations, a members database, coaches, parents and players, in the club's own colours. See [PLAN.md](PLAN.md) for the architecture, security model, positioning and phases.

## Stack

Next.js 16 (App Router, TypeScript) · Supabase (Postgres 17, Auth, RLS, Storage; Sydney) · Stripe Billing · Resend · Vitest · Playwright · Netlify.

## Run it locally

You need Node 22, pnpm 10 and Docker.

```bash
pnpm install
pnpm db:start          # local Supabase stack (API on :54321, DB on :54322, Mailpit on :54324)
pnpm db:reset          # applies supabase/migrations and seeds the demo club
cp .env.example .env.local   # then paste the local keys printed by `pnpm exec supabase status`
pnpm dev
```

Demo club after `db:reset`: http://localhost:3000/c/demo-hoops · admin login `admin@demo.clubroom.local` / `demo-admin-2026` (local only; the demo club is flagged `is_demo` and every name in it is invented).

## Tests

```bash
pnpm test:rls    # RLS proofs: runs as each role against the local database
pnpm test:unit   # age rules, members filtering, import parsing, billing
pnpm test:e2e    # Playwright: sign-up → wizard → live, public registration, members, import, settings
```

`tests/fixtures/age-cases.json` is shared by the SQL and TypeScript age-group implementations so they can't drift.

## Environment variables

| Name | Where it goes | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Netlify env | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Netlify env | Publishable key (safe in the browser; RLS does the work) |
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify env, secret | Server only: public registration, exports, webhooks |
| `NEXT_PUBLIC_APP_URL` | Netlify env | e.g. `https://clubroom.au` |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Netlify env, secret | Test mode until launch |
| `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_CLUB`, `STRIPE_PRICE_ASSOCIATION` | Netlify env | Price ids from the Stripe dashboard |
| `RESEND_API_KEY`, `EMAIL_FROM` | Netlify env, secret | Without a key, emails are logged instead of sent |
| `SUPABASE_DB_URL` | local / CI only | For the RLS tests |

Never commit real values; `.env.local` is git-ignored.

## Database

Schema lives in `supabase/migrations`. Apply to the hosted project with the Supabase CLI (`supabase db push`) or the Supabase connector. The demo seed (`supabase/seed/demo.sql`) is idempotent and only ever touches a club flagged `is_demo`.

## Deploy

Netlify builds from `clubroom/` (see `netlify.toml`; the Next.js adapter is listed there explicitly). Set the functions region to Sydney in the site settings so compute sits next to the data.

- Linked to GitHub: every push to the production branch deploys.
- Uploading by hand (Netlify connector or CLI): upload the `clubroom/` folder on its own, not the monorepo, with the `base` line dropped from `netlify.toml`. Uploading the repo root zips every project's `node_modules` and is rejected as too large.
- Without the Supabase keys the marketing pages still work; sign-in and sign-up show an "opening soon" notice and app routes redirect to it. Add the keys and the same deploy becomes the full app.
