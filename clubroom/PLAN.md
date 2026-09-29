# Clubroom — plan

*Working codename: **Clubroom**. Product name undecided; see §2. Everything named "clubroom" in the code is one rename away.*

**Owner:** Aiman (Groundworks Studio). **Written:** 29 September 2026. **Status:** Phase 1 in progress.

---

## 1. What we're building

A monthly-subscription platform that gives a sports club a complete, ready-to-run system the moment it signs up: registrations, a members database, coaches, parents and players, all in one place, with the club's own logo and colours. Any sport can use it; basketball is the first configuration and the pilot club (South West Sonics, junior basketball, Bankstown) is client number one.

The one-sentence pitch to a club: *sign up, run a five-minute wizard, share your registration link, and every registration, every player and every Friday's attendance is in one place that every admin, coach and parent can see from their phone.*

The reference is the South West Sonics prototype (public site, registration form, private inbox, club app with Admin/Coach/Parent/Player views, countdown promo videos). I studied it on the `claude/southwest-sonics-app-plan-m4xvgr` branch and I'm reusing the ideas and the UX, not the code. No Sonics branding, names or data carry over.

### What the prototype taught us (now requirements)

| Lesson | What Clubroom does about it |
|---|---|
| Netlify Forms was one-way; edits lived on one device | Real multi-tenant Postgres with auth from day one. Every admin sees the same data everywhere. |
| Connecting the inbox took an hour of Netlify screens | A club admin never sees a token, env var, DNS record or hosting dashboard. Sign up → wizard → live. |
| It holds children's data | Row-level security keyed on `club_id`, proven by automated tests; least privilege by role; Sydney hosting; private repo; synthetic seed data only; audit log of sensitive reads and exports; legal review list (§8.6). |
| A made-up $120 fee and invented coaches reached real parents | No invented defaults, ever. Demo data lives only in a club flagged `is_demo`, is labelled everywhere, and can't be promoted. |
| Parents use it courtside on a phone | Mobile-first layouts, big tap targets, one-thumb navigation. |
| Generic, machine-made feel was rejected | Display typography, restrained colour, real motion, a proper SVG icon set (Lucide), no emoji-as-icon. Dark by default, light available, remembered per user. Club logo and colours everywhere. |
| Basketball words were hard-coded | Every sport-specific word is configuration: division names, "game" vs "match", level names, skill names. |
| Age group came from current age | Age group comes from date of birth and a rule that's configurable per club and per season (birth year, or age at a cutoff date). |
| Levels motivate without ranking | Levels earned by attendance, skills unlock for coach rating at session thresholds, badges. Nothing compares one child to another. Level names are configurable. |

---

## 2. Three names

I checked DNS on 29 Sep 2026. "Resolves" means someone already uses it. "No record" means it may be available; only a registrar search confirms that. I haven't checked trademarks: search IP Australia before committing (https://search.ipaustralia.gov.au/trademarks/search/quick).

| Name | Why | Domains |
|---|---|---|
| **Clubroom** (recommended) | The room where a club runs itself. Sport-agnostic, Australian ("the clubrooms"), and it matches the parent welcome line: *this is the one place for everything.* Reads as a place, not a tool. | clubroom.app and clubroom.com.au resolve (taken). clubroom.au no record. getclubroom.com no record. |
| **Homeground** | Warm and very Australian. Works for any sport, and pairs with Groundworks. Slight mismatch for indoor sports (court, not ground). | homeground.app resolves. homeground.com.au and homeground.au no record. |
| **Rollcall** | The ritual at every training; attendance is the engine of the whole product. Memorable. A little administrative in tone. | rollcall.app no record. rollcall.com.au and rollcall.au resolve. |

Recommendation: **Clubroom** on **clubroom.au** (short, modern, Australian) with getclubroom.com as a redirect for people who type .com. If you prefer Homeground, homeground.com.au is the natural pick.

---

## 3. Positioning note (with sources)

*Everything below about a competitor was checked against the source cited, on 29 September 2026. Where a number isn't published, it says so.*

**The premise to correct first.** Basketball NSW's official competition and membership platform is **Basketball Connect** by World Sport Action, under a three-year partnership announced in March 2024 [1]; players pay the BNSW state membership through it, and without it "you cannot play basketball at any of our affiliated associations" [2]. Some Sydney associations run their competitions on **PlayHQ** (Northern Suburbs Basketball Association links its fixtures to PlayHQ [3]); Hornsby Ku-ring-gai clubs register through Basketball Connect [4]. So the association, not the club, picks the system of record, and it varies by association. Clubroom should never try to be that system. It should sit beside it.

**What the incumbents cover and charge.**

| Platform | Covers | Price model |
|---|---|---|
| **PlayHQ** (Basketball Australia and three other national bodies; acquired by Alpine Software Group, Dec 2025 [11]) | Registrations with custom questions and fees [7], instalments [9], competitions and fixtures [42], player stats and "Best Players" [17][18], posts by email/push [8], club websites [10] | Charged to the organisation per registration: $10 / $8 / $6 AUD by size for registration + competition management; $7 / $5 / $4 for registration + dashboard only [12]. Participants also pay a non-refundable platform fee at checkout, amount not published [9][14][43]. Websites are an annual subscription, price not published [10]. |
| **Basketball Connect** (World Sport Action) | Registration, match-day app, notifications, chat, electronic sign-on, training and team events, availability, online store, stats, draws and ladders, incident tracking [1] | Pricing to clubs not published [21]. BNSW 2026 state membership: $71.50 (12+), $55.00 (8–11), $27.50 (under 8) for 12 months, GST inc. [2]. |
| **Stack Team App** | Free branded club app: news, events, RSVP and attendance, in-app payments, access groups, store, chat, documents, results [22]. Merged with GameDay under Stack Sports, Dec 2022 [23]. | Free, funded by in-app ads [25]; a member can remove ads for A$4.49 a year [22]; store transaction fee not published on official pages [25]. |
| **Spond / Spond Club** | Events, availability, messaging, payments, guardians, files [29]; Spond Club adds registration forms and member profiles with custom fields including allergies, medical needs, guardian details and image consent [30] | Free. Transaction fee in Australia 2.5% + A$0.30, absorbed by the club by default [31][32]. Club website A$22 a month [33]. Ads ("brand partnerships") introduced in the UK in 2025 to keep it free [29]. |
| **GameDay** (Stack Sports) | Member database ("Passport"), registrations, products, reports, NSW Active Kids vouchers [35]; club websites with premium features [36] | Subscription not published. Processing fees: a July 2025 FAQ says 2.7% (PoliPay) / 3.9% (card, PayPal) [38]; an October 2025 GameDay post says a flat 3.5% + tax [39]. |
| **revolutioniseSPORT** | Club management | A$112 / A$396 / A$989 a year for up to 100 / 500 / 1,500 members; payment fees 2% + A$1.60 (Pin) or 2.6% + A$1.63 (PayPal) [40]. |

**Where the gap is (verified parts).**
- **WWCC tracking in NSW.** PlayHQ's automated WWCC checking (PlaySafe) is listed only for Netball Australia and Basketball Victoria [16][41]. No other platform above publishes WWCC tracking.
- **Communication limits.** PlayHQ posts "may not be turned on for your sport" and are limited to logistics [8]. Team App parents can't choose which notifications they receive (App Store reviews) [28].
- **Player development on the incumbents means performance stats and "Best Players" nominations [17][18]** — ranking, which is the opposite of the attendance-based, never-compared progression the prototype proved parents like.
- **Ads.** Team App shows ads by default [25]; Spond has moved to brand partnerships [29]. A paid, ad-free club app is a clean position.
- **Zero setup** is not something any of them claim; it's ours to prove.

**Where the gap is smaller than we assumed.** Spond Club already stores medical needs, guardian details and image consent [30], and Team App already does RSVP and attendance [22]. The members database on its own is not a differentiator against them. The parent forms (incident, complaint, absence, medical update), the progression system, WWCC tracking and the branded, ad-free experience are. These are still hypotheses until five clubs say so.

**Integration stance.** Neither PlayHQ nor Basketball Connect publishes a way to import participants. PlayHQ exports a Competition Participants Report as CSV with selectable fields [5]; its private APIs are limited to approved partners [6]. So Clubroom's practical integration is: send families the association's "register here" link as a step in the club's registration, and reconcile against the association's CSV export (an import mapping for PlayHQ's report shape in Phase 3). We don't run competitions.

**Sources.**
[1] https://www.bnsw.com.au/news/world-sport-action-to-provide-competition-management-system-for-basketball-in-nsw/ · [2] https://www.bnsw.com.au/faq-participant-membership-fees/ · [3] https://www.nsba.com.au/ · [4] https://www.kkbc.com.au/member-information/hkba-basketball-nsw-registration-basketball-connect · [5] https://support.playhq.com/hc/en-us/articles/23945395417372-Generate-a-Competition-Participants-Report · [6] https://support.playhq.com/hc/en-us/articles/23949453276572-How-To-Use-PlayHQ-API-s · [7] https://support.playhq.com/hc/en-us/articles/23966630346396-Clubs-Be-Registration-Ready · [8] https://support.playhq.com/hc/en-us/articles/23945032036764-Communicating-with-participants-via-Email-and-Posts · [9] https://support.playhq.com/hc/en-us/articles/26639154056988-Paying-your-registration-in-instalments · [10] https://support.playhq.com/hc/en-us/articles/23892350911388-PlayHQ-Websites · [11] https://get.playhq.com/newsroom/playhq-to-join-asg · [12] https://get.playhq.com/pricing · [14] https://support.playhq.com/hc/en-us/articles/29663866636700-How-to-request-a-refund · [16] https://support.playhq.com/hc/en-us/articles/23897921218844-Understanding-PlaySafe-Automated-WWCC-Verification · [17] https://support.playhq.com/hc/en-us/articles/23976720914716-Best-Players · [18] https://support.playhq.com/hc/en-us/articles/23973202303260-Participant-Statistics · [21] https://worldsportaction.com/ · [22] https://apps.apple.com/au/app/stack-team-app/id625607532 · [23] https://www.aap.com.au/aapreleases/cision20221207ae59646/ · [25] https://support.teamapp.com/en/knowledgebase/5-general-faqs/docs/97-cost-of-team-app · [28] https://apps.apple.com/us/app/stack-team-app/id625607532 · [29] https://www.spond.com/news-and-blog/spond-brand-partnerships/ · [30] https://help.spond.com/club/en/articles/182663-managing-member-information · [31] https://help.spond.com/club/en/articles/58192-what-is-the-transaction-fee-in-spond-club · [32] https://help.spond.com/app/en/articles/118091-payments-costs-in-the-spond-app · [33] https://help.spond.com/club/en/articles/179796-website-pricing-by-country · [35] https://support.mygameday.app/help/registrations-setup · [36] https://helpdesk.mygameday.app/help/classic-membership-data-import-0a9017d · [38] https://support.mygameday.app/help/registrations-minimum-1-fee-information · [39] https://community.mygameday.app/2025/10/understanding-online-payment-processing-fees-a-comprehensive-guide/ · [40] https://www.revolutionise.com.au/pricing · [41] https://get.playhq.com/newsroom/playhq-launches-playsafe-powered-by-oho · [42] https://support.playhq.com/hc/en-us/articles/23892641449756-Managing-a-player-s-Played-status-for-a-game · [43] https://support.playhq.com/hc/en-us/articles/23970713218716-Flexible-Payments-in-PlayHQ

Not verifiable today: corporate.playhq.com/pricing (503), mygameday.app main pages (429), Spond's blog (bot check). Nothing from those is used.

---

## 4. Pricing hypotheses (to test, not decided)

Context that shapes these: PlayHQ, TeamApp and Spond are free or freemium for clubs (see §3), so we are charging where the incumbents are free. The price has to be justified by the operations layer, the parent experience and zero setup, not by registration itself. A junior club with 150 players at roughly $150–$250 a season turns over $20–40k a year; $99 a month is 3–6% of that.

| Tier | Monthly (AUD, inc. GST) | Annual | Limits | Who it's for |
|---|---|---|---|---|
| **Starter** | $49 | $490 (2 months free) | Up to 100 active members, 1 admin, registration + members database + public page | A single-program club or a new club |
| **Club** | $99 | $990 | Up to 400 members, unlimited admins and coaches, parent portal, progression, notices, exports | The typical junior club (Sonics-sized) |
| **Association** | $199 | $1,990 | Unlimited members, multiple programs, custom domain, priority support, data export to association systems | Multi-program clubs and small associations |

All tiers: 30-day free trial, no card needed to start, cancel any time. Per-registration fees are deliberately *not* charged (that's how the incumbents earn; being the flat-fee alternative is part of the pitch).

Things to test in the first five club conversations: (a) whether $99 is under the "committee needs a vote" threshold; (b) whether clubs prefer a per-season price to a monthly one (many run one or two seasons a year); (c) whether the parent portal is the reason they'd pay or the members database is.

---

## 5. Architecture

### 5.1 Stack (default kept; changes justified)

| Layer | Choice | Notes |
|---|---|---|
| App | **Next.js 16 (App Router) + TypeScript**, Tailwind v4 for utilities on top of our own design tokens | Netlify's OpenNext adapter supports every Next.js release from 13.5 and is tested per release. |
| Database, auth, storage | **Supabase** in **Sydney (ap-southeast-2)**: Postgres 17, Auth, RLS, Storage | Data at rest in Australia. A **new Supabase organisation on the Pro plan** for the product (§10): the existing free org already has its two active projects, and a product holding children's data needs daily backups and no auto-pausing. |
| Billing | **Stripe Billing** (Checkout + customer portal + webhooks), test mode until launch | Stripe Connect for parent fee collection is Phase 3. |
| Email | **Resend**, and also as the custom SMTP for Supabase Auth | Supabase's built-in auth mailer is rate-limited to a handful of emails an hour and sends from a Supabase address; Resend fixes both. |
| Tests | **Vitest** for unit + RLS tests against a local Supabase Postgres; **Playwright** for end-to-end against the full local Supabase stack | Screenshots come from Playwright. |
| Hosting | **Netlify** (site + functions), functions region set to Sydney | Data never leaves Sydney at rest. Compute in Sydney too keeps latency low; whether transient processing outside Australia matters is on the legal list. |
| Icons / type | **Lucide** SVG icons. Display face: Archivo Black (as in the prototype, it works); text: Inter. Self-hosted via `next/font`. | No emoji as icons. |

One change from the brief: **Vitest** is added for the RLS and unit tests. Playwright is the wrong tool for asserting on Postgres policies; the RLS suite runs SQL as `anon`/`authenticated` with a chosen JWT, which is exactly how Supabase evaluates policies.

### 5.2 Shape of the app

```
clubroom/
  src/app/
    (marketing)/           product site, pricing, "see it in your colours" preview builder
    (public)/c/[slug]/     club landing page, registration form, thanks page (OG tags)
    (auth)/                sign in, invite acceptance, magic link
    (onboarding)/start     signup + wizard
    (app)/[slug]/          the club app: admin, coach, parent, player views by role
    (platform)/platform    platform owner: all clubs, billing, support, impersonation
    api/                   webhooks (Stripe), public registration endpoint, exports
  src/lib/                 supabase clients, auth helpers, age-group rule, sport config, audit
  src/components/          design system
  supabase/migrations/     schema + RLS, applied by the Supabase CLI
  supabase/seed/           synthetic demo data only
  tests/rls/               RLS proofs (Vitest + pg)
  tests/e2e/               Playwright
```

Privileged work (public registration insert, exports, Stripe webhooks, invites) runs in Next.js route handlers / server actions using the service-role key on the server only. Everything a signed-in user does in the browser goes through the anon key and is bounded by RLS. There is no path where a browser holds anything but the publishable key.

### 5.3 Tenancy and roles at runtime

- Each club has a `slug`; the app lives at `/[slug]/…`. Middleware resolves the user's memberships; a user with several roles (a parent who also coaches) switches view inside one login.
- Role checks in the UI are for layout only. **The database is the authority**: every table carries `club_id` and an RLS policy, and helper functions (`app.is_member_of(club_id)`, `app.has_role(club_id, 'admin')`, `app.is_platform_owner()`, `app.coaches_person(person_id)`, `app.guardian_of(person_id)`) are `security definer`, `stable`, and wrapped in `(select …)` so Postgres evaluates them once per query.
- Platform owner: a row in `platform_users`. Policies grant read on all clubs. "View as club" sets an audited acting-club cookie; every write while acting is logged with `impersonated_by`.

---

## 6. Data model

All club-owned tables carry `club_id uuid not null references clubs`, `created_at`, `updated_at`, and are covered by RLS. Soft-delete via `archived_at` where history matters.

| Table | Purpose / key columns |
|---|---|
| `clubs` | `slug`, `name`, `sport_key`, `logo_path`, `colours jsonb` (primary, accent, on-primary), `theme_default`, `timezone` (default Australia/Sydney), `is_demo`, `settings jsonb` (sport vocabulary overrides, level names), `public_page jsonb` |
| `club_users` | `user_id`, `club_id`, `role` in (`admin`,`coach`,`parent`,`player`), `status` (`invited`,`active`,`removed`), `invited_by` |
| `platform_users` | platform owner accounts |
| `seasons` | `name`, `starts_on`, `ends_on`, `age_rule jsonb` (§8.3), `fee_cents`, `fee_label`, `is_current` |
| `divisions` | per season: `name` (e.g. U12), `sort`, `age_min/max` or birth-year bounds derived from the rule |
| `teams` | `division_id`, `name`, `colour`, `home_venue_id` |
| `team_members` | `team_id`, `person_id`, `role` (`player`,`coach`,`manager`), `jersey_number` |
| `venues` | `name`, `address`, `map_url` |
| `people` | every human the club knows: `kind` (`player`,`guardian`,`staff`), `first_name`, `last_name`, `dob`, `gender`, `school`, `email`, `mobile`, `user_id` (nullable link to auth), `archived_at` |
| `guardianships` | `guardian_person_id`, `child_person_id`, `relationship`, `is_primary` |
| `person_sensitive` | **separate table for medical, emergency contact, ambulance cover** keyed by `person_id`; its own tight RLS (§8.2); every read goes through an audited RPC |
| `form_templates` | per club: `version`, `fields jsonb` (ordered field definitions: key, label, type, options, required, section, `maps_to` a core column or `custom`), `consents jsonb` (key, label, text, required), `published_at`, `collection_notice` |
| `registrations` | `season_id`, `form_template_id`, `form_version`, `player_person_id`, `guardian_person_id`, typed core columns (uniform size, experience, heard_via), `custom jsonb`, `source` (`public_form`,`admin`,`import`), `status` (`new`,`reviewed`,`placed`,`withdrawn`), `submitted_at`, `ip_hash`, `user_agent` |
| `consents` | `registration_id`, `person_id`, `consent_key`, `granted`, `text_shown`, `form_version`, `granted_at`, `granted_by_person_id` |
| `events` | `season_id`, `team_id` (nullable for club-wide), `kind` (`game`,`training`,`other`), `starts_at`, `ends_at`, `venue_id`, `opponent`, `result jsonb` |
| `availability` | `event_id`, `person_id`, `status` (`in`,`out`,`unknown`), `set_by` |
| `attendance` | `event_id`, `person_id`, `present bool`, `marked_by`, `marked_at` (the roll call) |
| `skill_ratings` | `person_id`, `skill_key`, `rating 1–5`, `rated_by`, `rated_at`, `note_private` |
| `level_config` | per club (optionally per sport default): ordered `levels jsonb` (key, name, at_sessions, tagline, unlocks), `skills jsonb` (key, name, unlock_at), `badges jsonb` |
| `coach_notes` | `person_id`, `author_user_id`, `body`, private to coaches/admins |
| `fees` | `season_id`, `person_id`, `amount_cents`, `status` (`owing`,`paid`,`waived`,`partial`), `due_on` |
| `payments` | `fee_id`, `amount_cents`, `method` (`cash`,`bank`,`stripe`), `reference`, `recorded_by` |
| `tasks` | follow-ups: `title`, `owner_user_id`, `due_on`, `status`, `linked_person_id` |
| `notices` | `title`, `body`, `audience jsonb` (all / team ids / roles), `published_at` |
| `submissions` | parent → admin forms: `kind` (`incident`,`complaint`,`suggestion`,`absence`,`medical_update`), `person_id`, `body jsonb`, `status` |
| `coach_clearances` | `person_id`, `kind` (`wwcc`), `number_last4`, `expires_on`, `verified_by`, `verified_at` |
| `audit_log` | `club_id`, `actor_user_id`, `impersonated_by`, `action` (`view_sensitive`,`export`,`login_as`,`update`,`archive`,…), `target_table`, `target_id`, `detail jsonb`, `ip_hash`, `at`. Append-only; no update/delete policy for anyone. |
| `subscriptions` | `club_id`, `stripe_customer_id`, `stripe_subscription_id`, `plan`, `status`, `trial_ends_at`, `current_period_end`, `member_limit` |
| `invites` | `club_id`, `email`, `role`, `token_hash`, `expires_at`, `accepted_at` |
| `imports` | `club_id`, `file_name`, `row_count`, `mapping jsonb`, `result jsonb`, `imported_by` (the Sonics migration path) |
| `rate_limits` | `key`, `window_start`, `count` (spam protection for public endpoints without another vendor) |
| `sports` | reference data: `key`, `name`, default vocabulary (`event_word`: game/match, division names, position names), default skills and levels |

Storage buckets: `club-logos` (public read, admin write), `club-media` (public page images), `documents` (private, per club). Bucket policies mirror the table policies.

---

## 7. Sport configuration

`sports` holds a default vocabulary per sport; `clubs.settings.vocabulary` overrides it. The UI never writes "game", "U12", "Hooper" or "Ball handling" as a literal; it reads `t('event')`, the season's divisions, and the club's `level_config`. Basketball ships first with: event word "game", divisions U10–U18 by default, skills Ball handling / Shooting / Teamwork / Defence / Court IQ, levels Rookie → Starter → Hooper → Bucket → OG → UNK. Adding a sport is a row in `sports`, not a code change.

---

## 8. Security and privacy model

### 8.1 Isolation
- RLS on every club-owned table. No table is readable without a policy; the `anon` role can only *insert* into `registrations`/`consents` through the server endpoint (and even then the server does it with the service role after validation), and *read* the public columns of a published club page via a view.
- Automated proofs (`tests/rls/`): for each table, a matrix of (actor role × own club / other club) asserting reads, writes and updates are allowed or denied. Plus family-level proofs: parent A cannot read parent B's child in the same club; a coach can read their own team's players and not another team's; a coach can read `person_sensitive` only for their own players; a player can read only themselves. The suite runs in CI and locally against the Supabase Postgres image.

### 8.2 Least privilege
| Data | Admin | Coach | Parent | Player |
|---|---|---|---|---|
| People basics (name, DOB, team) | all in club | own teams | own children | self |
| Contact details | all | own teams' guardians (phone only) | self + own children | self |
| Medical, emergency, ambulance cover (`person_sensitive`) | all, audited | own players only, audited | own children | no |
| Coach notes, skill ratings | all | own players | ratings only (not private notes) | ratings only |
| Fees | all | none | own children | read-only own |
| Exports | admins only, audited | none | none | none |
| Audit log | read | none | none | none |

Sensitive reads happen through `app.get_sensitive(person_id)`, a `security definer` function that checks the policy, writes an `audit_log` row, then returns. Exports are server routes that write an audit row with the filter used and the row count, then stream the file.

### 8.3 Age group rules
`seasons.age_rule` is one of:
- `{ "mode": "birth_year", "groups": [{ "name": "U12", "born_from": 2015, "born_to": 2016 }, …] }`
- `{ "mode": "age_at_date", "cutoff": "2026-12-31", "groups": [{ "name": "U12", "max_age": 11 }, …] }`

`app.age_group(dob, season_id)` in SQL and `ageGroup(dob, rule)` in TypeScript share a fixture file of test cases so they can't drift. The wizard offers Basketball NSW-style presets but the club can edit every number.

### 8.4 Demo data
- One club with `is_demo = true`, seeded by `supabase/seed/demo.sql` from generated synthetic names. Every demo screen shows a "Demo club — sample data" ribbon. Seeds only ever target `is_demo` clubs; the app refuses to run the seed against a club that isn't.
- Real clubs start empty: no fee, no coaches, no players. The wizard's fee field has no default and the club page doesn't publish until they set it.

### 8.5 Repository and secrets
- The repo must be private (decision in §10). No real member data is ever committed; the Sonics import is done through the UI from a file on your machine.
- Secrets live in Netlify environment variables and Supabase config only. `.env.local` is git-ignored; `.env.example` lists names, never values.

### 8.6 For legal review (not decided by me)
1. Privacy Act 1988 and the Australian Privacy Principles: whether the club, the platform, or both are the "APP entity"; the privacy policy and the data-processing terms between Clubroom and each club.
2. Notifiable Data Breaches scheme: breach response plan and who notifies whom.
3. Collection notices on the registration form (the wording shown above the consents, versioned in `form_templates.collection_notice`).
4. Parental consent for under-18s, and what a 13+ player login may see and do.
5. Data retention and deletion: how long registrations, medical details and audit logs are kept after a family leaves; a family's right to request deletion.
6. Working With Children Check: what we may store (I store expiry, verification date and last four characters only, never the full number), and verification obligations by state.
7. Cross-border processing: data at rest is in Sydney; whether transient processing by Netlify, Stripe or Resend outside Australia needs disclosure.
8. Photo/video consent wording and revocation.

---

## 9. Modules and phases

### Phase 1 — pilot-ready MVP (building now)
1. **Signup and onboarding wizard**: club name, sport, logo upload, colours (picked from the logo with manual override), venues, seasons with age rule, divisions, fee, admins to invite. Live at the end: the club page and registration link work immediately.
2. **Auth with roles**: email + password and magic link; invites for admins; role-aware app shell; dark/light per user.
3. **Configurable registration form**: default fields from the prototype (player name, DOB, gender, school, experience, uniform size, guardian name/relationship/mobile/email, emergency contact, medical, ambulance cover, consents for medical/conduct/photos, how they heard). Every consent stored with timestamp, the text shown and the form version. Honeypot + rate limit + optional Turnstile.
4. **Members database**: stat tiles (total, by gender, unique players, medical notes, no photo consent), age group × gender matrix, filters on any answer, search, sortable columns, duplicates on name + DOB, medical flags, add/edit/archive with shared history, Excel and CSV exports that respect the filters and are logged.
5. **Import**: Excel/CSV upload with column mapping and duplicate preview (this is how the Sonics data comes in).
6. **Stripe subscription** in test mode with a 30-day trial and plan limits.
7. **Demo club** with synthetic data; **RLS proofs**; **Playwright** end-to-end; deployed to Netlify.

**Phase 1 is done when** a club with no technical person can sign up, set itself up, share its registration link and see every registration from any admin's device, and the tests show a coach or parent account cannot read another club's or another family's data.

### Phase 1b — the sales engine (right after 1, same design system)
- **Product marketing site** on Netlify: what it is, how it works, pricing, sign-up.
- **"See it in your colours" preview builder**: a prospect enters club name + Instagram handle, uploads a logo (with a best-effort fetch by handle), and gets a personalised set of screens (public page, registration form, admin dashboard, parent app) rendered with their logo and colours, plus a link you can send them by DM. This doubles as your demo tool: you can pre-build a preview for a club before you message them.
- **Instagram launch kit**: handle options, bio, highlight covers and the first nine posts as branded images (Canva is connected in this session, so I can draft them there).

### Phase 2 — the club runs on it
Coach tools (roster, weekly availability, roll call → attendance, skill ratings, private notes); parent portal (first-run welcome, child profile, fixtures and results, this week's game with directions and add-to-calendar, fees, forms that route to admins); player profile and progression (levels, skills, badges, attendance); admin dashboard (paid/owing, follow-up tasks with owners, pipeline, WWCC expiry, notices by team or role).

### Phase 3 — outward
Public club page builder, notices and email (Resend), SMS, parent fee collection with Stripe Connect, association reconciliation (import the PlayHQ Competition Participants CSV and match it to members; a "register with the association" step that deep-links to PlayHQ or Basketball Connect, whichever the club's association uses).

### Phase 4 — scale
Promo media (countdown and hype videos rendered from the club's branding, day count computed at render time), platform analytics, more sports presets.

---

## 10. Decisions and accounts I need from you (one batch)

1. **Product name** — Clubroom / Homeground / Rollcall / something else. See §2.
2. **Pricing** — are the three hypotheses in §4 fine as the placeholders for the pricing page and Stripe test products?
3. **Domain** — which one to buy. I'll then give you the exact DNS records for Netlify and Resend, one step at a time.
4. **Repository privacy** — `groundworks-studios` is public today. Either (a) make it private now: https://github.com/aimanmaged88-svg/groundworks-studios/settings → "Danger Zone" → "Change repository visibility" → Private, or (b) I create a new private repo for the product and move it there once named. I recommend (a) now and (b) once the name is settled.
5. **Supabase** — create a new organisation for the business on the Pro plan (US$25/month) at https://supabase.com/dashboard/new (top-left org switcher → "New organization"). Once it exists, I create the Sydney project through the connector and apply the schema. Nothing to copy.
6. **Stripe** — create the account at https://dashboard.stripe.com/register (Australian business details). Stay in test mode. I'll need the test *secret* key and, later, a webhook signing secret: paste each one to me here once and I put it into Netlify's environment through the connector. You never paste it anywhere else.
7. **Resend** — create at https://resend.com/signup. Once the domain exists I give you the DNS records; then one API key, pasted to me once.
8. **Netlify** — nothing to do; I'll create the site on your existing team through the connector and set the functions region to Sydney.
9. **Instagram** — you create the account when we've picked the handle; I supply everything else.
10. **South West Sonics** — when you're ready, download the Excel from the existing inbox and import it through the app. I'll walk you through it.

---

## 11. South West Sonics migration
1. In the existing inbox (behind its password), export Excel. Keep the file on your machine.
2. In Clubroom, create the Sonics club through the wizard (real logo, real colours, real fee, real venues; no demo data).
3. Members → Import → upload the file. The importer maps the prototype's column names automatically (they're the same field keys), shows duplicates by name + DOB, and asks for confirmation before writing.
4. Consents in the file are imported as `consents` rows with `granted_at = submitted time`, `form_version = 'sonics-2026-tryouts'` and the original consent wording, so the record is honest about what parents actually saw.
5. After a successful import: delete `data.json` from the notes site, and export-then-delete the Netlify Forms submissions (retention policy: legal list item 5).
6. Nothing from steps 1–5 touches the repository.

---

## 12. Design system (short)
- **Tokens**: `--club-primary`, `--club-accent`, `--club-on-primary` set per club from `clubs.colours`; neutral scale for surfaces; dark default, light theme, stored in `user_preferences.theme` and mirrored to a cookie so the first paint is right.
- **Type**: Archivo Black for display (uppercase, tight), Inter for text.
- **Motion**: 200–350 ms spring-ish easing for sheets and cards; reduced-motion respected.
- **Components**: app shell (bottom tabs on mobile, side rail on desktop), stat tile, matrix table, data table with sticky header, filter bar, bottom sheet, form fields with clear required marks, banners, empty states written like a person.
- **Never**: emoji as icons, default browser blue, pure black text on pure white, lorem ipsum, invented names.

---

## 13. Testing
- `pnpm test:rls` — Vitest + pg against the local Supabase Postgres (Docker). Applies migrations, seeds two clubs and several families, runs the isolation matrix.
- `pnpm test:unit` — age-group rule, sport vocabulary, form validation, export shaping.
- `pnpm test:e2e` — Playwright against `supabase start` + `next dev`: signup → wizard → public form → registration appears in members → export logged; role tests sign in as coach and parent and assert what they can and can't see; screenshots saved to `tests/e2e/screenshots/`.
- CI: GitHub Actions runs all three on every push.

---

## 14. How we work
- Small, clear commits on `claude/affectionate-gates-5prjdn`.
- I test with Playwright before saying something works, and I attach screenshots.
- When you need to click something, I give the direct link and one step at a time.
- Plain Australian English throughout, including in the product.
