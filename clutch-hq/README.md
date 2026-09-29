# Clutch

Two connected apps on one Supabase backend (Sydney region):

- **clutch-hq.netlify.app** — staff. Admins run the whole club; coaches see their own teams. Week board, teams, players (photos, per-game points, payment plans, activation codes), registrations pipeline with archive and message-everyone, money with instalments, coach WWCC + clash view, community moderation queue, messages, season archive, settings.
- **clutch-basketball.netlify.app** — families. Parents activate with an email + one-time code from Clutch; kids sign in with a six-digit code their parent generates. Schedule with In/Out, family/coach/club chat, moderated community board and gallery, fees, player profiles with photos and socials. Installable (PWA).

Who can see what is enforced in the database (row-level security), not in the apps:
parents and players only ever reach their own family; players can't message other
parents; every family post, comment and gallery upload waits for an admin. The rules
are covered by the automated checks in `supabase/tests/`.

`demo.html` is the old offline demo (made-up data, saves in the browser).
`supabase/` holds the schema migrations, the edge functions (activate, kid-login,
register) and the test suites.
