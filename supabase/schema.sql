-- Trips app database. Paste into the Supabase SQL editor once. Safe to run again.
-- 1) Who may see and change the trip. The emails are added in private/setup.sql (never published).
create table if not exists public.members (email text primary key);

-- 2) All app data: one row per saved thing (outfits, packing list, budget, trip details).
create table if not exists public.kv (
  trip        text not null,
  key         text not null,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  text,
  primary key (trip, key)
);

create or replace function public.touch_kv() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists kv_touch on public.kv;
create trigger kv_touch before insert or update on public.kv for each row execute function public.touch_kv();

-- 3) Only people on the members list can read or write. Everyone else sees nothing.
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where lower(email) = lower(auth.jwt() ->> 'email'))
$$;

alter table public.members enable row level security;
alter table public.kv enable row level security;

drop policy if exists "members can see members" on public.members;
create policy "members can see members" on public.members for select to authenticated using (public.is_member());

drop policy if exists "members read"   on public.kv;
drop policy if exists "members add"    on public.kv;
drop policy if exists "members change" on public.kv;
drop policy if exists "members delete" on public.kv;
create policy "members read"   on public.kv for select to authenticated using (public.is_member());
create policy "members add"    on public.kv for insert to authenticated with check (public.is_member());
create policy "members change" on public.kv for update to authenticated using (public.is_member()) with check (public.is_member());
create policy "members delete" on public.kv for delete to authenticated using (public.is_member());

-- 4) Live updates: when one of you saves, the other phone updates.
do $$ begin
  alter publication supabase_realtime add table public.kv;
exception when duplicate_object then null; end $$;
