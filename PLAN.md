# Gattai Sudoku — Paywall Implementation Plan

## Overview

Add a subscription paywall that gates the solution walkthrough and PDF downloads
behind a $2.99/month Stripe subscription, with Supabase Auth for user accounts.

Current state: fully static client-side HTML/JS. No server, no auth, no database.
Target state: Supabase Auth + Stripe subscriptions + serverless API gating.

---

## Prerequisites — what you need to set up

### Supabase (free tier)
1. Create project at supabase.com
2. From Project Settings → API, copy:
   - Project URL (`https://xxxxx.supabase.co`)
   - anon public key (starts `eyJ...`)
   - service_role key (starts `eyJ...` — keep secret)
3. Run the SQL from "Database schema" section below in Supabase SQL Editor
4. Authentication → Settings → Site URL: set to your domain

### Stripe (test mode)
1. Create account at dashboard.stripe.com
2. From the home page, copy:
   - Publishable key (`pk_test_...`)
   - Secret key (`sk_test_...`)
3. Products → Add product → "Gattai Sudoku Pro" → $2.99/month → save
4. Copy the Price ID (`price_...`)
5. Developers → Webhooks → Add endpoint:
   - URL: `https://gattaisudoku.com/api/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`,
     `customer.subscription.updated`, `invoice.payment_succeeded`,
     `invoice.payment_failed`
   - Copy the Signing secret (`whsec_...`)

### What to send the developer
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID` (the `price_...` string)
- `STRIPE_WEBHOOK_SECRET`

---

## Phase 1 — Supabase database

Create these tables:

```sql
-- Puzzle storage (already exists in supabase_setup.sql)
create table if not exists public.daily_puzzles(
  puzzle_date date primary key,
  puzzle jsonb not null,
  difficulty text,
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);

-- User profiles (created automatically on sign-up)
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- Subscription status
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile + subscription on sign-up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  insert into public.subscriptions (user_id, tier)
  values (new.id, 'free');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

## Phase 2 — Serverless API functions

Files to create in `/api/`:

| File | Purpose |
|------|---------|
| `stripe-checkout.js` | POST: creates Stripe Checkout session, returns URL |
| `stripe-webhook.js` | POST: receives Stripe events, updates subscription tier |
| `derive-steps.js` | POST: accepts puzzle grid + auth token, returns solution steps (or "gated") |
| `subscription-status.js` | GET: returns current user's tier and expiry |

Vercel env variables to set:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

---

## Phase 3 — Client-side auth

Files to create/modify:

| File | Action |
|------|--------|
| `auth.js` | Create: Supabase client init, signIn(), signOut(), getSession() |
| `index.html` | Modify: replace sign-up dialog with Supabase Auth (email + Google) |
| `app.js` | Modify: replace localStorage profile with Supabase session |

---

## Phase 4 — Gate solution walkthrough

- Modify `app.js` so "Read solution" calls `/api/derive-steps.js` instead of local solver
- If response is `gated: true`, show "Subscribe to unlock" modal
- Port the 700-line `deriveSteps()` solver from `app.js` into `/api/derive-steps.js`
- Optional: free tier gets 1 free solution per day

---

## Phase 5 — Gate PDF downloads

| File | Action |
|------|--------|
| `packs.html` | Modify: check subscription on load, disable buttons for free tier |
| `print-puzzle.js` | Modify: add actual PDF download function (canvas → blob → download) |

---

## Phase 6 — Stripe subscription flow

- "Subscribe" button → `/api/stripe-checkout` → Stripe hosted checkout → redirect back
- Webhook updates Supabase → frontend picks up new tier via auth state listener
- "Manage subscription" → Stripe Customer Portal

---

## Phase 7 — Edge cases

- Cache subscription in sessionStorage (5 min TTL)
- Handle network errors gracefully
- Privacy policy + terms of service pages (required by Stripe)
- Ensure free puzzle pages remain crawlable for SEO

---

## Files created or modified (full list)

| File | Action |
|------|--------|
| `auth.js` | Create |
| `api/stripe-checkout.js` | Create |
| `api/stripe-webhook.js` | Create |
| `api/derive-steps.js` | Create |
| `api/subscription-status.js` | Create |
| `app.js` | Modify |
| `index.html` | Modify |
| `packs.html` | Modify |
| `print-puzzle.js` | Modify |
| `supabase_setup.sql` | Modify (extend) |
| `privacy.html` | Create |
| `terms.html` | Create |
| `package.json` | Create |

---

## Estimated effort

Phase 1: 1 hour (Supabase setup)
Phase 2: 4 hours (serverless functions)
Phase 3: 4 hours (client auth)
Phase 4: 6 hours (gate solutions — biggest piece)
Phase 5: 3 hours (gate PDFs)
Phase 6: 3 hours (Stripe flow)
Phase 7: 3 hours (polish)

Total: ~24 hours