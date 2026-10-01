-- TCG Trade Matcher — Phase 1 schema
-- Run in the Supabase SQL editor (or `supabase db push` once linked).
-- Keep this simple for Phase 1 — expect to adjust once real users' edge
-- cases show up (partial sets, bundle trades, etc).

create extension if not exists "pgcrypto";

-- users: profile row per Supabase Auth user (id matches auth.users.id)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  location text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- cards: reference table, seeded from TCGdex (api.tcgdex.net)
create table if not exists public.cards (
  id text primary key, -- TCGdex card id, reused as our PK
  name text not null,
  set_name text not null,
  card_number text not null,
  image_url text
);

create index if not exists cards_name_idx on public.cards using gin (to_tsvector('simple', name));

-- collection: a user's HAVEs
create type trade_status as enum ('keep', 'maybe', 'available', 'for_sale');

-- Ordered worst-to-best-agnostic (best first) so the matching engine (see
-- lib/matching.ts) can rank conditions, not just compare them for equality.
create type card_condition as enum (
  'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged'
);

create table if not exists public.collection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_id text not null references public.cards(id) on delete cascade,
  -- The actual condition of the physical card this user has.
  condition card_condition not null default 'near_mint',
  grade text,
  language text,
  quantity int not null default 1,
  trade_status trade_status not null default 'available',
  created_at timestamptz not null default now()
);

create index if not exists collection_user_idx on public.collection (user_id);
create index if not exists collection_card_idx on public.collection (card_id);

-- wants: a user's WANTs
create type want_priority as enum ('low', 'medium', 'high');

create table if not exists public.wants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_id text not null references public.cards(id) on delete cascade,
  -- The worst condition this user is willing to accept, not the condition of
  -- anything they own.
  condition card_condition not null default 'near_mint',
  grade text,
  priority want_priority not null default 'medium',
  created_at timestamptz not null default now()
);

create index if not exists wants_user_idx on public.wants (user_id);
create index if not exists wants_card_idx on public.wants (card_id);

-- matches: computed, refreshed on write from the matching engine
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.users(id) on delete cascade,
  user_b_id uuid not null references public.users(id) on delete cascade,
  match_score numeric not null,
  matched_cards jsonb not null default '[]',
  created_at timestamptz not null default now(),
  constraint matches_distinct_users check (user_a_id <> user_b_id),
  -- The matching engine always stores user_a_id < user_b_id (sorted), so
  -- this also enforces uniqueness of the unordered pair and backs upserts.
  constraint matches_unique_pair unique (user_a_id, user_b_id)
);

create index if not exists matches_user_a_idx on public.matches (user_a_id);
create index if not exists matches_user_b_idx on public.matches (user_b_id);

-- Row Level Security
alter table public.users enable row level security;
alter table public.cards enable row level security;
alter table public.collection enable row level security;
alter table public.wants enable row level security;
alter table public.matches enable row level security;

-- users: anyone signed in can read profiles (needed to show match counterparts);
-- only the owner can edit their own row.
create policy "users are readable by any signed-in user" on public.users
  for select using (auth.role() = 'authenticated');
create policy "users can update own profile" on public.users
  for update using (auth.uid() = id);

-- The users row is created by the handle_new_user trigger below (running as
-- the table owner, bypassing RLS), not by a client-side insert: signUp()
-- does not grant a session until the email is confirmed, so an
-- authenticated-only insert policy would fail for unconfirmed signups.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- cards: public reference data, readable by anyone signed in, written only
-- by the service role (seeding script), never by end users.
create policy "cards are readable by any signed-in user" on public.cards
  for select using (auth.role() = 'authenticated');

-- collection: owner has full control; other signed-in users can read rows
-- flagged available/for_sale (needed for matching + browsing).
create policy "collection visible if own or available" on public.collection
  for select using (
    auth.uid() = user_id or trade_status in ('available', 'for_sale')
  );
create policy "collection owner can insert" on public.collection
  for insert with check (auth.uid() = user_id);
create policy "collection owner can update" on public.collection
  for update using (auth.uid() = user_id);
create policy "collection owner can delete" on public.collection
  for delete using (auth.uid() = user_id);

-- wants: owner has full control; other signed-in users can read (needed for
-- matching against your own collection).
create policy "wants readable by any signed-in user" on public.wants
  for select using (auth.role() = 'authenticated');
create policy "wants owner can insert" on public.wants
  for insert with check (auth.uid() = user_id);
create policy "wants owner can update" on public.wants
  for update using (auth.uid() = user_id);
create policy "wants owner can delete" on public.wants
  for delete using (auth.uid() = user_id);

-- matches: only the two matched users can see a match row.
create policy "matches visible to matched users" on public.matches
  for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- login_attempts: brute-force lockout tracking, keyed by email (not user id —
-- attempts on a nonexistent or wrong email still need tracking to avoid
-- leaking which emails have accounts). RLS enabled with no policies at all:
-- only the service-role client (never the anon/authenticated client) should
-- ever touch this table.
create table if not exists public.login_attempts (
  email text primary key,
  failed_count int not null default 0,
  locked_until timestamptz
);

alter table public.login_attempts enable row level security;

-- Migration: card_condition. collection.condition/wants.condition already
-- existed as free-text and were never set anywhere in the app (the
-- matching-engine condition bonus in lib/matching.ts was dead code as a
-- result). This turns them into a constrained, ranked enum and backfills
-- existing rows to the safest default. Run this once against a database
-- created before this migration was added — a fresh database already gets
-- the enum column from the create table statements above.
do $$ begin
  if not exists (select 1 from pg_type where typname = 'card_condition') then
    create type card_condition as enum (
      'near_mint', 'lightly_played', 'moderately_played', 'heavily_played', 'damaged'
    );
  end if;
end $$;

update public.collection set condition = 'near_mint' where condition is null;
alter table public.collection
  alter column condition type card_condition using condition::card_condition,
  alter column condition set default 'near_mint',
  alter column condition set not null;

update public.wants set condition = 'near_mint' where condition is null;
alter table public.wants
  alter column condition type card_condition using condition::card_condition,
  alter column condition set default 'near_mint',
  alter column condition set not null;

-- Migration: lock down handle_new_user's direct RPC exposure. Any function
-- in the public schema is auto-exposed by PostgREST as an RPC endpoint
-- (/rest/v1/rpc/<name>) unless EXECUTE is explicitly revoked. Supabase's
-- security advisor flagged handle_new_user() — a security definer function —
-- as callable directly by both anon and authenticated
-- ("Public Can Execute SECURITY DEFINER Function" /
-- "Signed-In Users Can Execute SECURITY DEFINER Function"). It's only meant
-- to run as the on_auth_user_created trigger above; revoking direct EXECUTE
-- closes that RPC path without affecting the trigger, since a trigger always
-- runs with the function owner's privileges regardless of who has EXECUTE on
-- it directly.
--
-- Revoking from anon/authenticated alone doesn't work: Postgres grants
-- EXECUTE on every new function to the PUBLIC pseudo-role by default, and
-- anon/authenticated inherit through that grant rather than holding EXECUTE
-- directly (confirmed against information_schema.routine_privileges — no
-- explicit anon/authenticated grant existed, only PUBLIC). So the grant to
-- revoke is PUBLIC's, which also covers anon and authenticated. Idempotent:
-- revoking a privilege that isn't held is a no-op.
revoke execute on function public.handle_new_user() from public;
