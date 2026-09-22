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

-- cards: reference table, seeded from pokemontcg.io
create table if not exists public.cards (
  id text primary key, -- pokemontcg.io card id, reused as our PK
  name text not null,
  set_name text not null,
  card_number text not null,
  image_url text
);

create index if not exists cards_name_idx on public.cards using gin (to_tsvector('simple', name));

-- collection: a user's HAVEs
create type trade_status as enum ('keep', 'maybe', 'available', 'for_sale');

create table if not exists public.collection (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_id text not null references public.cards(id) on delete cascade,
  condition text,
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
  condition text,
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
  constraint matches_distinct_users check (user_a_id <> user_b_id)
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
