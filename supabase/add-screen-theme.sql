-- Migration: add projector theme toggle to event_state.
-- Run once against the live Supabase project (SQL editor). Idempotent.
--
-- `screen_theme` lets the master control flip the /screen view between the dark
-- plum "stage" (default) and the light cream "paper" surface for bright rooms.
-- No RLS / grant changes needed: event_state is already anon-readable and
-- authenticated-updatable at the table level, which covers the new column.

alter table public.event_state
  add column if not exists screen_theme text not null default 'stage';

-- Constrain to the two valid values (guard against re-adding the check).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'event_state_screen_theme_check'
  ) then
    alter table public.event_state
      add constraint event_state_screen_theme_check
      check (screen_theme in ('stage', 'paper'));
  end if;
end $$;
