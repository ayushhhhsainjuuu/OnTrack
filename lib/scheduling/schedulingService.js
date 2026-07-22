import { validateSchedule } from './validation'
import { verifyRelationships } from './permissions'
import { checkScheduleConflict } from './conflicts'
import { paginate } from '../utils/pagination'

// Constraint names match those defined on the `schedules` table so
// PostgREST can resolve the embeds unambiguously.
const SCHEDULE_SELECT = `
  *,
  users!schedules_user_fk(
    id,
    full_name,
    email
  ),
  creator:users!schedules_created_by_fk(
    id,
    full_name,
    email
  ),
  projects!schedules_project_fk(
    id,
    name,
    account_manager_id
  ),
  accounts!schedules_account_fk(
    id,
    name
  )
`

function notFoundError(message) {
  const error = new Error(message)
  error.status = 404
  return error
}

// GET /api/schedules
// `supabase` must be a per-request client (see lib/supabase/server.js) so
// RLS evaluates as the caller's real, authenticated user.
export async function getSchedules(supabase, filters = {}) {
  const { from, to } = paginate(filters.page, filters.limit)

  let query = supabase
    .from('schedules')
    .select(SCHEDULE_SELECT, { count: 'exact' })
    .range(from, to)
    .order('start_time', { ascending: false })

  if (filters.accountId) query = query.eq('account_id', filters.accountId)
  if (filters.projectId) query = query.eq('project_id', filters.projectId)
  if (filters.userId) query = query.eq('user_id', filters.userId)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.start) query = query.gte('start_time', filters.start)
  if (filters.end) query = query.lte('end_time', filters.end)

  const { data, error, count } = await query

  if (error) throw error

  return { data: data || [], count }
}

export async function getScheduleById(supabase, id) {
  const { data, error } = await supabase
    .from('schedules')
    .select(SCHEDULE_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error

  return data
}

// POST /api/schedules
// Only an active user whose users.system_role is Foreman or Lead -- and who
// is a member of the target account (or project) -- may create a schedule.
// See permissions.js.
export async function createSchedule(supabase, schedule) {
  validateSchedule(schedule)
  await verifyRelationships(supabase, schedule)
  await checkScheduleConflict(supabase, schedule.user_id, schedule.start_time, schedule.end_time)

  const { data, error } = await supabase
    .from('schedules')
    .insert({
      user_id: schedule.user_id,
      created_by: schedule.created_by,
      account_id: schedule.account_id || null,
      project_id: schedule.project_id || null,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      status: schedule.status || 'draft',
      notes: schedule.notes || null,
    })
    .select(SCHEDULE_SELECT)
    .single()

  if (error) throw error

  return data
}

export async function updateSchedule(supabase, id, updates) {
  const existing = await getScheduleById(supabase, id)
  if (!existing) throw notFoundError('Schedule not found')

  const merged = {
    user_id: updates.user_id ?? existing.user_id,
    created_by: updates.created_by ?? existing.created_by,
    account_id: updates.account_id !== undefined ? updates.account_id : existing.account_id,
    project_id: updates.project_id !== undefined ? updates.project_id : existing.project_id,
    start_time: updates.start_time ?? existing.start_time,
    end_time: updates.end_time ?? existing.end_time,
    status: updates.status ?? existing.status,
    notes: updates.notes !== undefined ? updates.notes : existing.notes,
  }

  validateSchedule(merged)
  await verifyRelationships(supabase, merged)
  await checkScheduleConflict(supabase, merged.user_id, merged.start_time, merged.end_time, id)

  const { data, error } = await supabase
    .from('schedules')
    .update(merged)
    .eq('id', id)
    .select(SCHEDULE_SELECT)
    .single()

  if (error) throw error

  return data
}

export async function deleteSchedule(supabase, id) {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id)

  if (error) throw error
}
