# The Reset 🌿

**A calm place to reset when it's all too much.** A premium, dark, mobile-first app for people recovering from burnout — one gentle place for their day, money, work, shopping, people, health, tasks and notes.

Made to be shared: put the link in your Instagram bio. People can **try it free with no account** (saved privately on their own device), or **create an account to sync** their progress across phone and laptop.

- **App:** https://the-reset-app.netlify.app
- **Admin (owner only):** https://the-reset-app.netlify.app/admin.html

## How accounts work

- **Free / no account** — everything saves in the browser (localStorage) on that device. Perfect for trying it.
- **Account** — sign up with an email + password. Data syncs to the cloud so it follows the person across devices. Any trial data they'd already added is carried into the new account.
- **Instant sign-up** — no confirmation email required to start (kept simple on purpose).
- **Password reset** — a "Forgot password?" link, plus the owner can reset any member's password from the admin page.

## Admin page

`/admin.html` is a separate, login-gated page for the owner. Only accounts on the server-side admin allowlist can use it (right now: the owner's email). From there you can:

- See everyone who has made an account (email, joined date, last active).
- **Set a temporary password** for a member (the reliable way to get someone back in — tell them privately, they change it in Settings).
- **Generate a password reset link** to send them.
- **Delete** a member's account and data.

> To use the admin page, the owner first signs up in the app with the admin email, then logs in at `/admin.html`.

## Architecture (v2)

- **Frontend** — a single `index.html` (plus `admin.html`), React + Tailwind via CDN, no build step. Dark premium theme, inline SVG icons.
- **Backend** — Supabase (in the shared "Get The Kids Fit" project, namespaced `reset_*`):
  - `reset_users` — one row per person: `{ id, email, data (jsonb), timestamps }`. **Row-Level Security** means each person can only ever read/write their own row.
  - `reset_admins` — server-only admin allowlist (RLS on, no policies → not readable by any client).
  - Edge function `reset-api` — handles public sign-up (creates a confirmed account) and admin actions. The **service-role key lives only in this function**, never in the app. Every admin action verifies the caller is a signed-in admin.
- The app degrades gracefully to **local-only** if the backend can't be reached.

## Two manual steps to finish (owner)

Some Supabase project settings can't be changed from here — do these once in the Supabase dashboard for the smoothest experience:

1. **Self-service password reset redirect** — Auth → URL Configuration → add `https://the-reset-app.netlify.app/**` to *Redirect URLs*. (Owner-set temporary passwords already work without this.)
2. **Reliable email at scale** — Auth → set up a custom SMTP provider (e.g. Resend, free tier) before a big Instagram push. The built-in email is heavily rate-limited.

## How to run locally

Single files, nothing to install: double-click `index.html`. (Accounts/sync need the internet; the app still works offline in local mode.)

## Next upgrades

1. Move to a dedicated Supabase project (clean separation from other apps).
2. Custom email (Resend) + branded reset emails.
3. Calendar view; export to PDF.
4. Gentle streaks and check-ins.
5. A kind in-app AI companion to help plan the day.
