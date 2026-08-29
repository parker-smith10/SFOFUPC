-- The Smith Family Oklahoma State Football Uniform Picking Competition — initial schema, RLS policies, and seed data.
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query → paste → Run).
-- The SQL editor runs as the postgres role and bypasses RLS, so this script
-- can create policies that would otherwise block a normal user.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  week int not null check (week between 1 and 13),
  opponent text not null,
  is_home boolean not null default true,
  kickoff_at timestamptz not null,
  lock_at timestamptz not null,
  actual_helmet text,
  actual_jersey text,
  actual_pants text,
  actual_logo text,
  results_published boolean not null default false,
  unique (week)
);

create index if not exists games_lock_at_idx on public.games (lock_at);

create table if not exists public.options (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('helmet', 'jersey', 'pants', 'logo')),
  value text not null,
  is_active boolean not null default true,
  sort_order int not null default 0
);

create index if not exists options_category_idx on public.options (category, sort_order);

create table if not exists public.picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  helmet text not null,
  jersey text not null,
  pants text not null,
  logo text not null,
  submitted_at timestamptz not null default now(),
  unique (user_id, game_id)
);

create index if not exists picks_game_id_idx on public.picks (game_id);
create index if not exists picks_user_id_idx on public.picks (user_id);

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

-- security definer so it can read profiles.is_admin without recursing
-- through the profiles RLS policies that call it.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Auto-create a profile row whenever the admin creates an account in the
-- Supabase Auth dashboard. Reads display_name from the new user's metadata
-- if present, otherwise falls back to the local part of their email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent non-admins from ever setting is_admin=true on themselves (or
-- anyone else) via the self-service profiles UPDATE policy below.
create or replace function public.protect_is_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    raise exception 'Only an admin can change is_admin';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_is_admin_trigger on public.profiles;
create trigger protect_is_admin_trigger
  before update on public.profiles
  for each row execute function public.protect_is_admin();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.options enable row level security;
alter table public.picks enable row level security;

-- profiles: everyone can read display names; users can update only their
-- own row (is_admin changes are blocked by the trigger above unless the
-- caller is already an admin); only admins can insert/delete directly.
create policy "profiles_select_all" on public.profiles
  for select to authenticated
  using (true);

create policy "profiles_update_self" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- games: everyone can read; only admins can write.
create policy "games_select_all" on public.games
  for select to authenticated
  using (true);

create policy "games_write_admin" on public.games
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- options: everyone can read; only admins can write.
create policy "options_select_all" on public.options
  for select to authenticated
  using (true);

create policy "options_write_admin" on public.options
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- picks: a user can always see their own picks; can see others' picks only
-- once that game's lock_at has passed; can insert/update their own picks
-- only while lock_at is still in the future. Admins can do everything,
-- including viewing all picks before lock.
create policy "picks_select_own_or_locked_or_admin" on public.picks
  for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.games g
      where g.id = picks.game_id and g.lock_at <= now()
    )
  );

create policy "picks_insert_own_before_lock_or_admin" on public.picks
  for insert to authenticated
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.games g
        where g.id = picks.game_id and g.lock_at > now()
      )
    )
  );

create policy "picks_update_own_before_lock_or_admin" on public.picks
  for update to authenticated
  using (
    public.is_admin()
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.games g
        where g.id = picks.game_id and g.lock_at > now()
      )
    )
  )
  with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.games g
        where g.id = picks.game_id and g.lock_at > now()
      )
    )
  );

create policy "picks_delete_admin" on public.picks
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed data — initial uniform options
-- ---------------------------------------------------------------------------

insert into public.options (category, value, is_active, sort_order) values
  ('helmet', 'Black', true, 0),
  ('helmet', 'Orange', true, 1),
  ('helmet', 'White', true, 2),
  ('jersey', 'Black', true, 0),
  ('jersey', 'Orange', true, 1),
  ('jersey', 'White', true, 2),
  ('pants', 'Black', true, 0),
  ('pants', 'Orange', true, 1),
  ('pants', 'White', true, 2),
  ('logo', 'The Brand', true, 0),
  ('logo', 'Cursive Cowboys', true, 1),
  ('logo', 'Pistol Pete', true, 2)
on conflict do nothing;
