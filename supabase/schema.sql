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

-- Migration: cards.language. Japanese printings are their own catalogue
-- cards (TCGdex /v2/ja), stored with a "ja:" id prefix so they never collide
-- with English ids. Because a printing is its own card, collection, wants
-- and matching are language-exact with no extra columns. Idempotent.
alter table public.cards add column if not exists language text not null default 'en';

-- Migration: trades, messages, notifications (Phase 2).
--
-- Writes to every table below go through server actions using the
-- service-role client, after checking who the caller is and what state the
-- row is in (see app/(app)/trades/actions.ts, app/(app)/messages/actions.ts,
-- lib/notify.ts). Clients only ever get SELECT on rows they are part of, so a
-- participant cannot, say, mark a trade completed by writing to it directly.
-- Idempotent.

do $$ begin
  if not exists (select 1 from pg_type where typname = 'trade_state') then
    create type trade_state as enum ('proposed', 'accepted', 'declined', 'cancelled', 'completed');
  end if;
end $$;

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  -- Human-readable Trade ID printed on the receipt.
  code text not null unique default ('TM-' || upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8))),
  match_id uuid references public.matches(id) on delete set null,
  proposer_id uuid not null references public.users(id) on delete cascade,
  recipient_id uuid not null references public.users(id) on delete cascade,
  status trade_state not null default 'proposed',
  -- Meetup only for now: no shipping, no protection.
  meetup_place text not null,
  meetup_at timestamptz,
  note text,
  accepted_at timestamptz,
  responded_at timestamptz,
  cancelled_by uuid references public.users(id) on delete set null,
  -- Both collectors confirm the handover; a photo is encouraged, not required.
  proposer_confirmed_at timestamptz,
  recipient_confirmed_at timestamptz,
  proposer_photo_path text,
  recipient_photo_path text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trades_distinct_users check (proposer_id <> recipient_id)
);

create index if not exists trades_proposer_idx on public.trades (proposer_id);
create index if not exists trades_recipient_idx on public.trades (recipient_id);
create index if not exists trades_match_idx on public.trades (match_id);

create table if not exists public.trade_items (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  giver_id uuid not null references public.users(id) on delete cascade,
  card_id text not null references public.cards(id),
  -- Snapshot of the giver's card condition at proposal time. Language is
  -- part of the card itself (cards.language).
  condition card_condition,
  quantity int not null default 1 check (quantity > 0)
);

create index if not exists trade_items_trade_idx on public.trade_items (trade_id);

alter table public.trades enable row level security;
alter table public.trade_items enable row level security;

drop policy if exists "trades visible to participants" on public.trades;
create policy "trades visible to participants" on public.trades
  for select using (auth.uid() = proposer_id or auth.uid() = recipient_id);

drop policy if exists "trade items visible to participants" on public.trade_items;
create policy "trade items visible to participants" on public.trade_items
  for select using (
    exists (
      select 1 from public.trades t
      where t.id = trade_id and (auth.uid() = t.proposer_id or auth.uid() = t.recipient_id)
    )
  );

-- Handover photos: private bucket, one folder per trade, one sub-folder per
-- collector: trade-photos/<trade_id>/<user_id>/<file>. Participants upload
-- straight from the browser into their own sub-folder and can view both.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('trade-photos', 'trade-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

drop policy if exists "trade photos upload by participant" on storage.objects;
create policy "trade photos upload by participant" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'trade-photos'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.trades t
      where t.id::text = (storage.foldername(name))[1]
        and t.status = 'accepted'
        and auth.uid() in (t.proposer_id, t.recipient_id)
    )
  );

drop policy if exists "trade photos visible to participants" on storage.objects;
create policy "trade photos visible to participants" on storage.objects
  for select to authenticated using (
    bucket_id = 'trade-photos'
    and exists (
      select 1 from public.trades t
      where t.id::text = (storage.foldername(name))[1]
        and auth.uid() in (t.proposer_id, t.recipient_id)
    )
  );

-- Messages: one conversation per pair of collectors (user_a_id < user_b_id,
-- like matches). Unread state is a last-read timestamp per side.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.users(id) on delete cascade,
  user_b_id uuid not null references public.users(id) on delete cascade,
  last_message_at timestamptz,
  last_message_preview text,
  last_sender_id uuid references public.users(id) on delete set null,
  user_a_read_at timestamptz,
  user_b_read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint conversations_sorted_pair check (user_a_id < user_b_id),
  constraint conversations_unique_pair unique (user_a_id, user_b_id)
);

create index if not exists conversations_user_a_idx on public.conversations (user_a_id);
create index if not exists conversations_user_b_idx on public.conversations (user_b_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversations visible to participants" on public.conversations;
create policy "conversations visible to participants" on public.conversations
  for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "messages visible to participants" on public.messages;
create policy "messages visible to participants" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (auth.uid() = c.user_a_id or auth.uid() = c.user_b_id)
    )
  );

-- Live message updates (Supabase Realtime respects the select policy above).
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- Notifications: written server-side on trade events, new matches and new
-- messages; each collector reads only their own.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  href text,
  -- Lets repeated events (several messages in one conversation) refresh a
  -- single unread notification instead of stacking up.
  group_key text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications visible to owner" on public.notifications;
create policy "notifications visible to owner" on public.notifications
  for select using (auth.uid() = user_id);
