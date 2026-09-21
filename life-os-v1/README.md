# Life OS — Version 1

A calm, simple, mobile-first dashboard to run your day in one place: **money, work, health, kids, shopping, tasks and routines.**

Built to feel like a support worker for your own life — clean, low-clutter, and easy to use when you're tired, stressed, or have ADHD.

## What's inside (8 sections)

1. **Today** — the date, your top 3 priorities, must-do tasks, reminders, a mood/energy check (Low / Medium / Good), and a **Survival mode** plan for hard days.
2. **Money** — money you have, money coming in, rent, bills, food, fuel, medicine, debts, leftover (safe-to-spend), an overspending warning, and a **do-not-spend** list.
3. **Work & Invoices** — add shifts (employer, date, times, hourly rate), auto pay totals, invoice status (Not sent / Sent / Paid), this week's total, and a one-tap **invoice summary** you can copy.
4. **Shopping** — items by category (Groceries, House essentials, Medicine, Kids, Work), tick off what you've bought, a trip budget with an estimated total and over-budget warning.
5. **Kids & Family** — things to prepare, activities, school/health/family reminders for the girls.
6. **Health & Routine** — a simple daily checklist (shower, eat, water, clean room, pray, walk, sleep plan), medication reminders, and notes for sleep, food, exercise/basketball and nervous-system reset.
7. **Tasks** — one list, sorted by priority (Urgent / Important / Later), with status (Not started / In progress / Done) and due dates.
8. **Notes** — a quick place to dump anything on your mind, with search.

## How your data is stored

Everything is saved **locally in your browser** (localStorage). No login, no account, no server — it works fully offline once the page has loaded. Your data stays on the device you use.

There's a **⚙️ Settings** button (top right) to:
- Reload the example data
- Start completely fresh
- **Back up** your data (copy the text somewhere safe)
- **Restore** from a backup

> Because data is stored in the browser, clearing your browser data will erase it. Use **Back up my data** now and then.

## How to run it

It's a single file — no installing anything, no build step.

**Easiest way:** double-click `index.html` to open it in your browser. Done.

**On your phone (recommended):** put it online for free and add it to your home screen so it feels like a real app:
- Drag the `life-os-v1` folder onto [app.netlify.com/drop](https://app.netlify.com/drop) — you'll get a link like `life-os-v1.netlify.app`.
- Open that link on your phone → browser menu → **Add to Home Screen**.

**Run it locally with a mini web server (optional):**
```bash
cd life-os-v1
python3 -m http.server 8080
# then open http://localhost:8080 in your browser
```

## Tech

- **React 18** and **Tailwind CSS**, both loaded from a CDN (no npm, no build tools).
- All the code lives in one `index.html`, organised into simple, clearly-named components (`TodayView`, `BudgetView`, `WorkView`, `ShoppingView`, `KidsView`, `HealthView`, `TasksView`, `NotesView`).
- Sample data is included so you can see how everything works straight away, and everything is editable.

## Next 5 upgrades (Version 2 ideas)

1. **Calendar view** — see shifts, bills and kids' activities on a monthly calendar.
2. **Export invoices to PDF** — turn the invoice summary into a proper PDF to send clients.
3. **Cloud sync** — save to the cloud so your data follows you across phone and laptop.
4. **Login** — a simple passcode/account to protect your data.
5. **AI assistant inside the app** — a gentle helper that plans your day, spots overspending, and writes your invoices for you.
