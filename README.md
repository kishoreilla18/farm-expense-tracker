# Farm Expense Tracker

A mobile-friendly expense tracker for farmers. Track spending on daily
labour, fertilizer, machine rental, tractor diesel, workers' food, land rent,
and anything else — per field/crop, with a running daily total and an
automatic email summary every evening.

Runs entirely on free tiers: **Vercel** (hosting) + **Supabase** (database +
login) + **Resend** (email). No app-store fees, no server bills.

It's a web app, not a native iOS/Android app (Vercel can't host those) — but
it's installable: open it on a phone and choose **"Add to Home Screen"**, and
it behaves just like an app icon, full-screen, no browser bar.

## Features

- Email/password login (each farmer has their own account and only sees their own data)
- Add a field or crop (name, crop, area, start date)
- Log expenses against a field: **Daily Workers/Labour, Fertilizer & Pesticides,
  Machine Rental, Tractor Diesel/Fuel, Workers' Food, Land Rent, or Other** (with a
  free-text description)
- Expenses are shown as a day-by-day ledger with a **daily total** and a
  **running total per field** and **across all fields**
- Delete a wrong entry or an entire field
- Export any field's expenses as a CSV (handy for loan applications / records)
- **Daily email at ~7:00 PM IST** to every farmer (their own summary) and to
  one admin address (a combined digest of everyone) — see the timing note below
- Installable on a phone's home screen (PWA)

## Tech stack (all free)

| Piece | Service | Free tier |
|---|---|---|
| Hosting | [Vercel](https://vercel.com) | Unlimited hobby projects |
| Database + Auth | [Supabase](https://supabase.com) | 500MB DB, 50k monthly active users |
| Email | [Resend](https://resend.com) | 3,000 emails/month, 100/day |
| Framework | Next.js 14 (App Router) + TypeScript + Tailwind | open source |

## 1. Set up Supabase (database + login)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor → New query**, paste the entire contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates
   the `profiles`, `fields`, and `expenses` tables with row-level security
   (each farmer can only ever see their own rows) and a trigger that creates
   a profile automatically when someone signs up.
3. Go to **Authentication → Providers → Email** and make sure Email is
   enabled. For the fastest setup, turn **off** "Confirm email" (Authentication
   → Settings) so farmers can sign up and start immediately — turn it back on
   later if you want email verification.
4. Go to **Settings → API** and copy three values: **Project URL**,
   **anon public key**, and **service_role key** (keep the service role key
   secret — it's only used server-side by the cron job).

## 2. Set up Resend (email)

1. Create a free account at [resend.com](https://resend.com) and grab an
   **API key**.
2. For real production email, verify your own domain under **Domains** (takes
   a few DNS records, ~10 minutes). Until then, you can send from
   `onboarding@resend.dev` for testing — some inboxes may mark it as spam.

## 3. Run it locally (optional, to test first)

```bash
npm install
cp .env.example .env.local   # then fill in the values from steps 1 & 2
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. Deploy to Vercel — free, production, live

1. Push this project to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
   that repo. Framework preset "Next.js" is auto-detected.
3. Before deploying, add these **Environment Variables** (Project Settings →
   Environment Variables), same values as your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`
   - `EMAIL_FROM`
   - `ADMIN_EMAIL` — the admin's inbox for the daily digest
   - `CRON_SECRET` — any long random string (e.g. run `openssl rand -hex 32`)
4. Click **Deploy**. You'll get a live URL like
   `https://your-project.vercel.app` — that's the production app, for free.
5. The cron job in `vercel.json` is picked up automatically on deploy — check
   **Project → Settings → Cron Jobs** to confirm it's listed.

### About the 7 PM IST timing

7:00 PM IST = 13:30 UTC, which is what `vercel.json` schedules. **Vercel's
free (Hobby) plan only guarantees cron jobs run once a day, sometime within
the scheduled hour** — so it may fire anywhere between about 7:00 and 7:59 PM
IST, not the exact minute. If you need it to fire at exactly 7:00:00, that
requires a Vercel Pro plan (paid). For a farmer-facing daily summary, "some
time in the 7 o'clock hour" is normally good enough.

You can test the email job any time by visiting, while logged in as admin
tooling (or via curl):
```
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-project.vercel.app/api/cron/daily-summary
```

## How the data is organized

- **profiles** — one row per farmer (auto-created on signup)
- **fields** — a field/plot/crop the farmer is tracking
- **expenses** — one row per expense, linked to a field, with a category,
  amount, and date

Row-level security in Supabase means the database itself enforces that a
farmer can only ever read or write their own fields and expenses — even if
there's a bug in the app code, other farmers' data stays private. Only the
cron job (using the secret service-role key) can read across everyone, which
it needs to build the admin's daily digest.

## Ideas for what to add next

- Hindi/regional-language toggle for the UI
- Optional budget per field with a warning when you go over it
- Photo attachment for a receipt on each expense
- Monthly/seasonal totals and a simple bar chart per field
- SMS notifications (via Twilio) as an alternative to email for farmers who
  don't check email often
- Real 192×192 / 512×512 PNG app icons in `public/icons/` (a placeholder SVG
  is included so the app is installable today, but add proper icons before
  sharing widely — most icon generators, e.g. realfavicongenerator.net, can
  make these free from a logo)

## Project structure

```
src/
  app/
    login/, signup/          — auth pages
    dashboard/                — list of fields + total spent
    fields/new/                — add a field
    fields/[id]/                — expense ledger for one field
    fields/[id]/add-expense/    — add-expense form
    fields/[id]/export/          — CSV export
    api/cron/daily-summary/      — the 7 PM IST email job
    actions.ts                    — all server actions (login, CRUD)
  lib/
    supabase/                     — Supabase client helpers
    categories.ts, date.ts, email.ts
supabase/schema.sql              — run this once in Supabase's SQL editor
vercel.json                      — the cron schedule
```
