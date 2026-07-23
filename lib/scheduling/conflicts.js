function conflictError(conflicts) {
  const error = new Error('This schedule overlaps with an existing schedule for this user')
  error.status = 409
  error.conflicts = conflicts
  return error
}

// Two ranges overlap when existing.start_time < new.end_time AND existing.end_time > new.start_time.
// Cancelled schedules are ignored. `excludeId` skips the row being updated.
export async function checkScheduleConflict(supabase, user_id, start_time, end_time, excludeId = null) {
  let query = supabase
    .from('schedules')
    .select('id, start_time, end_time')
    .eq('user_id', user_id)
    .neq('status', 'cancelled')
    .lt('start_time', end_time)
    .gt('end_time', start_time)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) throw error

  if (data && data.length > 0) {
    throw conflictError(data)
  }
}
