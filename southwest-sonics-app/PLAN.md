# Sydney Southwest Sonics — App & Operations Plan

**Project:** The Sonics App — a member portal + admin control centre for the Sydney Southwest Sonics basketball association
**Status:** Planning (v1)
**Owner / Tech lead:** Aiman (Groundworks Studios)
**Date:** 2026-09-18

---

## 0. The one-line version

We're building **one place** where the club runs itself: the directors see who's paid, who's registered, and who's playing; coaches manage their rosters and Friday sessions; and every player/parent opens the Sonics app to see *"Am I registered? Am I playing this Friday? Who's on my team?"* — no more group-chat chaos.

The whole plan is built around the single biggest problem the club has had: **organisation, scheduling, and understanding who does what.** Every feature below traces back to fixing that.

---

## 1. Background & why now

Five years ago three of us started the Sydney Southwest Sonics. Life got busy, the club drifted, and last night all three founders agreed to take it back over and run it properly this time.

The reason it stalled before wasn't passion or talent — it was **organisation**:
- No single source of truth for who's registered, who's paid, and who's actually turning up.
- Scheduling lived in people's heads and scattered group chats.
- No clarity on *who does what* — decisions and follow-ups fell through the cracks.

This plan treats the club like a **well-oiled machine from day one**. The app is the engine; clear roles are the operating manual.

---

## 2. The club at a glance

| Program | Age groups | When | Notes |
|---|---|---|---|
| **Juniors** ⭐ *(our focus)* | U12, U14, U16, U18 | **Fridays** | Training + games, coaching, rosters, weekly schedule |
| Youth / U21 | U21 | TBC | Included in the platform, secondary priority |
| **UBL** | Seniors | **Saturdays** | Separate competition league — tracked, but out of scope for v1 focus |

**v1 focus = the Friday Juniors program.** We build the machine around Fridays first, then extend the same system to U21 and UBL once it's proven.

---

## 3. Who runs it — people & roles

> ⚠️ **Please confirm spellings.** I've written the names as best I could from your message — correct me before we create real accounts.

| Person | Title | Login access |
|---|---|---|
| **Nour Kabbara** *(N-O-U-R)* | CEO & Founder | Full admin — everything |
| **Abdulla Chamtia** *(spelling to confirm — Chamtia / Chamtieh?)* | Co-Director | Full admin — everything |
| Aiman | Tech Lead / Admin | Full admin + system owner |

Both directors get a login. On **first sign-in** they're invited by email, set their own password, and land straight on the **full director dashboard** (paid / unpaid, follow-ups, registrations, rosters, schedule). No feature is hidden from them.

### 3.1 Proposed "who does what" (a starting point to react to)

You said you don't know Nour's and Abdulla's exact responsibilities yet. Here's a **proposed split** so there's clarity from the start — treat it as a draft to adjust together, not a decision. Solving "who does what" is half the point of this whole exercise, so we make it explicit in the app itself.

| Area | Suggested lead | Backup |
|---|---|---|
| Vision, partnerships, sponsors, public face | Nour (CEO) | Abdulla |
| Operations: schedule, venues, coaches, rosters | Abdulla (Co-Director) | Aiman |
| Registrations & payments (paid/unpaid, follow-ups) | Abdulla | Nour |
| Tech, app, data, comms systems | Aiman (Tech Lead) | — |
| Coaching quality & player development | (assign a Head Coach) | Nour |

We encode this in the app as a **Roles & Responsibilities board** so anyone can see who owns what — and every follow-up task has a named owner and a due date. Nothing falls through the cracks again.

---

## 4. What the app does (features mapped to the problem)

Every feature answers "organisation, scheduling, or who does what."

### 4.1 For players & parents (the "download the Sonics app" experience)
Opens to a simple, personal home screen:
- ✅ **Am I registered?** — Registered / Pending / Lapsed, with a "finish registration" button.
- 🏀 **Am I playing this Friday?** — clear Yes/No, plus **tap to confirm availability** ("I'm in" / "Can't make it").
- 📅 **My schedule** — this week and upcoming Fridays: time, court/venue, opponent.
- 👥 **My team & roster** — teammates, coach, team manager, jersey number.
- 💳 **My status** — fees paid / owing, and how to pay.
- 🔔 **Notifications** — schedule changes, reminders, announcements.

### 4.2 For coaches
- Their team roster and player contacts.
- See who's confirmed available for Friday (in / out / no-response).
- Mark attendance.
- Message their team.

### 4.3 For directors (Nour & Abdulla) — the control centre
- **Money view:** who's paid, who's partially paid, who's unpaid — with one-tap **follow-up** (send a reminder, log a call, set a chase date).
- **Registrations:** new sign-ups, incomplete registrations, consent/medical flags, Working With Children clearances for coaches.
- **Schedule builder:** set the Friday grid — divisions, teams, times, courts — in minutes.
- **Rosters:** create teams, assign players and coaches, move players between teams.
- **People & roles:** the who-does-what board and a shared task list with owners + due dates.
- **At-a-glance dashboard:** registered vs unregistered, playing this week vs not, fees collected vs outstanding, attendance trends.

---

## 5. Data model (what the system remembers)

| Entity | Key fields |
|---|---|
| **Player** | Name, DOB → age group, team, jersey #, photo, registration status, payment status, medical/consent flags, guardian link |
| **Guardian/Parent** | Name, contact, linked player(s), login |
| **Team** | Name, division (U12–U18 / U21 / UBL), coach, team manager, home court, season |
| **Coach / Staff** | Name, role, teams, contact, **WWCC clearance** + expiry |
| **Session / Fixture** | Date (Friday), time, venue/court, type (training/game), team(s), opponent, availability responses, attendance |
| **Payment** | Player, amount, term/season, status, due date, method, follow-up state |
| **Announcement** | Title, body, audience (club / division / team), timestamp |
| **Task** | Title, owner, due date, status — the "who does what" backbone |

---

## 6. Technical approach

Built to match the Groundworks Studios style (fast, polished, mobile-first) and to grow into a real multi-user product.

**Phase 1 — Clickable prototype (single-file web app).**
Same pattern as your Apex MMA "Member OS" and Eagles Gym portal: one self-contained, seeded demo (data in `localStorage`), mobile-first, Sonics-branded. Purpose: show Nour & Abdulla something *real* this week, get buy-in, lock the design. Deploys to Netlify like the rest of the portfolio.

**Phase 2 — Real backend (shared source of truth).**
Move from demo data to a live database so all three admins see the same numbers on any device.
- **Supabase** (Postgres + Auth + Storage) is the recommended fit — email/password logins, first-login password set, role-based access (director / coach / parent).
- This is when "who's paid / who's playing" becomes genuinely live and trustworthy.

**Phase 3 — "Download the app" + automation.**
- Ship as an **installable PWA** first (add-to-home-screen, like `tiny-champions-app`'s web manifest) — this is the "download the Sonics app" experience without app-store friction. Native App Store / Play wrappers later only if needed.
- **Push/SMS/email** reminders for availability and payment follow-ups.
- **Online payments** (Stripe) for registration fees, if we want to collect in-app rather than just track.

### 6.1 Australia-specific must-dos
- **Working With Children Check (WWCC)** tracking for every coach/volunteer — store number + expiry, flag when lapsing.
- **Minors' data & privacy** — parent-held accounts for juniors, consent captured at registration.
- **Association registration / insurance** (Basketball NSW or relevant body) — track per member if required.

---

## 7. Roadmap

| Phase | What ships | Goal |
|---|---|---|
| **P1 — Prototype** *(this week)* | Branded, clickable single-file app with seeded Friday Juniors data; director dashboard + player view | Show the founders, get buy-in, finalise design |
| **P2 — Live core** | Supabase backend, real logins for Nour & Abdulla, real players/teams/schedule, paid/unpaid tracking + follow-ups | Run one real Friday off the app |
| **P3 — In pockets** | Installable PWA, availability confirmations, reminders/notifications | Players self-serve; admins stop chasing |
| **P4 — Scale** | U21 + UBL, online payments, sponsors/branding polish, reporting | One platform for the whole club |

---

## 8. Open questions (need answers to move fast)

1. **Names/emails:** confirm spelling of Abdulla's surname, and the email addresses for Nour's and Abdulla's admin logins.
2. **Brand assets:** you mentioned a logo and materials — please drop the logo files + colours in here (`southwest-sonics-app/`). I don't have them in this session yet, so P1 will use placeholders until then.
3. **Fees:** registration cost per term/season, and do you want to **collect payments in-app** (Stripe) or just **track** who's paid for now?
4. **Fridays:** how many teams per age group, which venue(s)/courts, and the time slots?
5. **Season:** current term dates / when the next Friday block starts.
6. **App name:** "Sonics App" as the working name — confirm or give me the final name.

---

## 9. Recommended next step

I recommend I build **Phase 1 — the clickable Sonics prototype** next: a single-file, Sonics-branded app you can open on your phone and hand to Nour and Abdulla, showing the director dashboard (paid/unpaid, follow-ups, registrations) and the player view (registered? playing Friday? my roster?), seeded with realistic Friday Juniors data.

That turns this plan into something they can *see and touch* — the fastest way to get all three of you aligned and excited. Say the word and I'll build it.

---

*Prepared for the Sydney Southwest Sonics — built to run like a well-oiled machine from day one.*
