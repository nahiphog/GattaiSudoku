-- Enable Google provider first. Public reads; only gohpihan@gmail.com writes.
create table if not exists public.daily_puzzles(puzzle_date date primary key,puzzle jsonb not null,difficulty text,created_at timestamptz default now(),created_by uuid default auth.uid());
alter table public.daily_puzzles enable row level security;
create policy "public reads" on public.daily_puzzles for select using(true);
create policy "owner inserts" on public.daily_puzzles for insert to authenticated with check((auth.jwt()->>'email')='gohpihan@gmail.com');
create policy "owner updates" on public.daily_puzzles for update to authenticated using((auth.jwt()->>'email')='gohpihan@gmail.com') with check((auth.jwt()->>'email')='gohpihan@gmail.com');

-- Subscription rows are written only by the Stripe webhook through the service
-- role.  Clients can read their own current status through the API endpoint.
create table if not exists public.subscriptions(
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  status text not null default 'inactive',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.subscriptions add column if not exists status text not null default 'inactive';
alter table public.subscriptions add column if not exists current_period_end timestamptz;
alter table public.subscriptions add column if not exists updated_at timestamptz not null default now();
alter table public.subscriptions enable row level security;

-- Premium packs contain only references to the already-published puzzle rows.
-- They are intentionally read through /api/puzzle-pack using the service role.
create table if not exists public.puzzle_packs(
  id text primary key check (id ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.puzzle_pack_items(
  pack_id text not null references public.puzzle_packs(id) on delete cascade,
  puzzle_date date not null references public.daily_puzzles(puzzle_date) on delete restrict,
  position integer not null check (position >= 1),
  primary key (pack_id, position),
  unique (pack_id, puzzle_date)
);
alter table public.puzzle_packs enable row level security;
alter table public.puzzle_pack_items enable row level security;
