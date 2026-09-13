-- Enable Google provider first. Public reads; only gohpihan@gmail.com writes.
create table if not exists public.daily_puzzles(puzzle_date date primary key,puzzle jsonb not null,difficulty text,created_at timestamptz default now(),created_by uuid default auth.uid());
alter table public.daily_puzzles enable row level security;
create policy "public reads" on public.daily_puzzles for select using(true);
create policy "owner inserts" on public.daily_puzzles for insert to authenticated with check((auth.jwt()->>'email')='gohpihan@gmail.com');
create policy "owner updates" on public.daily_puzzles for update to authenticated using((auth.jwt()->>'email')='gohpihan@gmail.com') with check((auth.jwt()->>'email')='gohpihan@gmail.com');
