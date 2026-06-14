-- Soft reset for testing: clears votes, couple answers and event phase
-- but KEEPS the questions. Run in Supabase SQL Editor between test rounds.
-- For a full wipe (incl. questions) re-run schema.sql instead.

truncate table public.guest_votes;

update public.couple_answers
  set bride_answer = null, groom_answer = null, answered_at = null;

update public.event_state
  set phase = 'draft', current_question_index = 0, reveal_started_at = null
  where id = 1;
