-- OC-98: RLS policies for leave_requests
-- leave_requests already has RLS enabled with two policies:
--   cleaner_own_leave_requests        (INSERT, user_id = auth.uid())
--   cleaner_read_own_leave_requests   (SELECT, user_id = auth.uid())
-- This migration only ADDS the policies that are missing:
--   - managers (Owner, General Manager (GM), Foreman) can read every request
--   - managers can update any request (approve/reject)
--   - an employee can update (cancel) their own request while it is pending
-- Run this once in the Supabase SQL editor (or via `supabase db push`).

create policy "manager_read_all_leave_requests"
  on public.leave_requests
  for select
  to public
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.system_role in ('Owner', 'General Manager (GM)', 'Foreman')
    )
  );

create policy "manager_update_leave_requests"
  on public.leave_requests
  for update
  to public
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.system_role in ('Owner', 'General Manager (GM)', 'Foreman')
    )
  );

create policy "cleaner_cancel_own_pending_leave_requests"
  on public.leave_requests
  for update
  to public
  using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid());
