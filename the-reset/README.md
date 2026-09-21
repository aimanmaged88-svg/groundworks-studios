# The Reset 🌿

**A calm place to reset when it's all too much.**

The Reset is a simple, gentle app for people recovering from burnout. It gives you one quiet place to keep track of everything — your day, your money, your health, your people, and your rest — without pressure or clutter.

Made to be shared: put the link in your Instagram bio and anyone who opens it gets their **own private copy** on their own phone. No login, no account, nothing to sign up for. Day one starts the moment they open it.

> "You're going to get through this. One small step today."

## What's inside (8 gentle sections)

1. **Today** — the date, a daily affirmation (your kind inner voice), your top 3 priorities, must-do tasks, reminders, a mood/energy check (Low / Medium / Good), and a **Survival mode** plan for the hardest days.
2. **Money** — money in and out, rent, bills, food, fuel, medicine, debts, leftover (safe-to-spend), an overspending warning, and a **do-not-spend** list for stress spending.
3. **Work & Invoices** — track shifts (employer, times, hourly rate), auto pay totals, invoice status (Not sent / Sent / Paid), weekly total, and a one-tap **invoice summary** to copy.
4. **Shopping** — items by category, tick off what you've bought, a trip budget with an estimated total and over-budget warning.
5. **People & Family** — the people who matter: kids, family, checking in on loved ones, asking for help.
6. **Health & Routine** — a simple daily checklist (shower, eat, water, tidy, pray, walk, sleep), medication reminders, and notes for sleep, food, movement and **nervous-system reset**.
7. **Tasks** — one list sorted by what matters (Urgent / Important / Later), with status and due dates.
8. **Notes** — a quiet place to dump anything on your mind, with search.

Everything is editable, and it comes pre-filled with gentle example content so it makes sense the moment you open it.

## How each person's data is stored

Everything is saved **locally in the browser** (localStorage) on the device it's used on. No login, no server — it works offline once loaded, and each person's notes stay private to them.

There's a **⚙️ Settings** button (top right) to reload the example content, start fresh, and **back up / restore** your data (copy the text somewhere safe — clearing your browser would otherwise erase it).

## How to run / share it

It's a single file — nothing to install, no build step.

- **Try it locally:** double-click `index.html`.
- **Put it online (for your Instagram):** drag the `the-reset` folder onto [app.netlify.com/drop](https://app.netlify.com/drop) to get a link, then paste that link in your bio. (This app is already deployed — ask to redeploy after any change.)
- **On a phone:** open the link → browser menu → **Add to Home Screen** so it becomes an app icon.

## Tech

- **React 18** and **Tailwind CSS**, both from a CDN — no npm, no build tools.
- One `index.html`, organised into simple, clearly-named components (`TodayView`, `BudgetView`, `WorkView`, `ShoppingView`, `KidsView`, `HealthView`, `TasksView`, `NotesView`).

## Next 5 upgrades

1. **Calendar view** — see shifts, bills and activities on a monthly calendar.
2. **Export to PDF** — turn invoices (or a weekly plan) into a shareable PDF.
3. **Cloud sync** — optional accounts so data follows people across devices.
4. **Gentle streaks & check-ins** — celebrate showing up, without pressure.
5. **AI companion** — a kind assistant that helps plan the day and reset when it's all too much.
