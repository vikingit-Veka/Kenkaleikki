-- Kenkäleikki – Supabase schema, RLS and seed.
-- Run this whole file in the Supabase dashboard → SQL Editor.
-- Safe to run on a fresh project. Tables are dropped and recreated.

-- ---------------------------------------------------------------------------
-- Reset (idempotent for repeated setup during development)
-- ---------------------------------------------------------------------------
drop table if exists public.guest_votes cascade;
drop table if exists public.couple_answers cascade;
drop table if exists public.event_state cascade;
drop table if exists public.questions cascade;

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  order_index integer not null default 0,
  text text not null,
  enabled boolean not null default true
);

create table public.couple_answers (
  question_id uuid primary key references public.questions(id) on delete cascade,
  bride_answer text check (bride_answer in ('bride', 'groom')),
  groom_answer text check (groom_answer in ('bride', 'groom')),
  answered_at timestamptz
);

create table public.guest_votes (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  answer text not null check (answer in ('bride', 'groom')),
  session_id text not null,
  created_at timestamptz not null default now(),
  unique (question_id, session_id)
);

-- Single-row state table (always id = 1).
create table public.event_state (
  id integer primary key default 1 check (id = 1),
  phase text not null default 'draft' check (
    phase in (
      'draft', 'scheduled', 'voting_open', 'voting_closed',
      'live_questions', 'reveal', 'closed'
    )
  ),
  current_question_index integer not null default 0,
  reveal_started_at timestamptz,
  voting_opens_at timestamptz,
  voting_closes_at timestamptz
);

insert into public.event_state (id, phase) values (1, 'draft');

-- Auto-create a couple_answers row whenever a question is added, so the
-- host control views can UPDATE without needing INSERT privileges.
create or replace function public.create_couple_answer()
returns trigger
language plpgsql
as $$
begin
  insert into public.couple_answers (question_id)
  values (new.id)
  on conflict (question_id) do nothing;
  return new;
end;
$$;

create trigger trg_create_couple_answer
  after insert on public.questions
  for each row execute function public.create_couple_answer();

-- ---------------------------------------------------------------------------
-- Grants (RLS still gates every row; these grant the table-level privilege)
-- ---------------------------------------------------------------------------
grant select on public.questions to anon, authenticated;
grant select on public.event_state to anon, authenticated;
grant update on public.event_state to authenticated;
grant select, insert on public.guest_votes to anon, authenticated;
grant select on public.couple_answers to anon, authenticated;
grant update on public.couple_answers to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.questions enable row level security;
alter table public.couple_answers enable row level security;
alter table public.guest_votes enable row level security;
alter table public.event_state enable row level security;

-- questions: world-readable, never writable from the client.
create policy "questions_select" on public.questions
  for select using (true);

-- event_state: world-readable, only hosts may change it.
create policy "event_state_select" on public.event_state
  for select using (true);
create policy "event_state_update" on public.event_state
  for update to authenticated using (true) with check (true);

-- guest_votes: anyone may insert, but only while voting is open.
create policy "guest_votes_insert" on public.guest_votes
  for insert
  with check (
    (select phase from public.event_state where id = 1) = 'voting_open'
  );
-- Votes are anonymous (session_id only); reading aggregates is allowed.
create policy "guest_votes_select" on public.guest_votes
  for select using (true);

-- couple_answers: readable by hosts at any time, and by everyone once the event
-- is in the reveal/closed phase (so the projector /screen needs no login).
-- Stays hidden from guests before reveal, preventing spoilers.
create policy "couple_answers_select" on public.couple_answers
  for select using (
    (select auth.role()) = 'authenticated'
    or (select phase from public.event_state where id = 1) in ('reveal', 'closed')
  );
create policy "couple_answers_update" on public.couple_answers
  for update to authenticated
  using ((select phase from public.event_state where id = 1) = 'live_questions')
  with check ((select phase from public.event_state where id = 1) = 'live_questions');

-- ---------------------------------------------------------------------------
-- Emergency reset (called from master control via RPC). SECURITY DEFINER so it
-- bypasses RLS to wipe votes/answers; only the authenticated host may execute.
-- Returns the event to the pre-voting waiting state.
-- ---------------------------------------------------------------------------
create or replace function public.reset_event()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- "where true" satisfies Supabase's safeupdate guard (blocks WHERE-less DML).
  delete from public.guest_votes where true;
  update public.couple_answers
    set bride_answer = null, groom_answer = null, answered_at = null
    where true;
  update public.event_state
    set phase = 'scheduled', current_question_index = 0, reveal_started_at = null
    where id = 1;
end;
$$;

revoke all on function public.reset_event() from public, anon;
grant execute on function public.reset_event() to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime (used by /screen, /reveal, /control/*)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.event_state;
alter publication supabase_realtime add table public.couple_answers;
alter publication supabase_realtime add table public.guest_votes;

-- ---------------------------------------------------------------------------
-- Seed questions (edit freely). The trigger creates couple_answers rows.
-- ---------------------------------------------------------------------------
insert into public.questions (order_index, text) values
  (1, 'Kumpi sanoi ensimmäisenä "rakastan sinua"?'),
  (2, 'Kumpi on parempi kokki?'),
  (3, 'Kumpi nukahtaa ensimmäisenä illalla?'),
  (4, 'Kumpi käyttää enemmän rahaa?'),
  (5, 'Kumpi on useammin oikeassa?'),
  (6, 'Kumpi teki aloitteen ensitreffeillä?'),
  (7, 'Kumpi on parempi kuljettaja?'),
  (8, 'Kumpi viettää enemmän aikaa puhelimella?');
