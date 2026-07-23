-- OC-91: leave_requests table constraints
-- The leave_requests table already exists in production with these columns:
--   id, user_id, reviewed_by, leave_type, start_date, end_date,
--   status, reason, reviewer_notes, created_at, updated_at
-- This migration only adds the missing safety constraint (it does not
-- touch existing rows or columns). Safe to run more than once.
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leave_requests_end_after_start'
  ) then
    alter table public.leave_requests
      add constraint leave_requests_end_after_start check (end_date >= start_date);
  end if;
end $$;
