const ALLOWED_ROLES = ['foreman', 'lead']

function authError(message) {
  const error = new Error(message)
  error.status = 403
  return error
}

function notFoundError(message) {
  const error = new Error(message)
  error.status = 404
  return error
}

// Authorization rules for creating/updating a schedule:
// 1. schedule.created_by must be an active user whose users.system_role is
//    "Foreman" or "Lead" (checked against the `users` table).
// 2. schedule.user_id (the person being scheduled) must be an active user.
// 3. If the schedule is tied to an account (schedule.account_id), created_by
//    must appear in account_members for that account -- i.e. found via their
//    user_id fkey in the members table, which links to the account/project.
//    The assignee must also belong to that account.
// 4. If the schedule is tied to a project (schedule.project_id), created_by
//    must appear in project_members for that project (found via their
//    user_id fkey, which links to the project). The assignee must also
//    belong to that project.
export async function verifyRelationships(supabase, schedule) {
  const { data: creator, error: creatorError } = await supabase
    .from('users')
    .select('id, system_role, is_active')
    .eq('id', schedule.created_by)
    .maybeSingle()

  if (creatorError) throw creatorError
  if (!creator) throw notFoundError('creator does not reference an existing user')
  if (!creator.is_active) throw authError('creator user is not active')
  if (!ALLOWED_ROLES.includes((creator.system_role || '').toLowerCase())) {
    throw authError('Only users with the Foreman or Lead role can create or modify schedules')
  }

  const { data: assignee, error: assigneeError } = await supabase
    .from('users')
    .select('id, is_active')
    .eq('id', schedule.user_id)
    .maybeSingle()

  if (assigneeError) throw assigneeError
  if (!assignee) throw notFoundError('user_id does not reference an existing user')
  if (!assignee.is_active) throw authError('Cannot schedule an inactive user')

  if (schedule.account_id) {
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', schedule.account_id)
      .maybeSingle()

    if (accountError) throw accountError
    if (!account) throw notFoundError('account_id does not reference an existing account')

    const { data: members, error: membersError } = await supabase
      .from('account_members')
      .select('user_id')
      .eq('account_id', schedule.account_id)
      .in('user_id', [schedule.created_by, schedule.user_id])

    if (membersError) throw membersError

    const memberIds = new Set((members || []).map((m) => m.user_id))
    if (!memberIds.has(schedule.created_by)) {
      throw authError('created_by is not a member of this account')
    }
    if (!memberIds.has(schedule.user_id)) {
      throw authError('user_id is not a member of this account')
    }
  }

  if (schedule.project_id) {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', schedule.project_id)
      .maybeSingle()

    if (projectError) throw projectError
    if (!project) throw notFoundError('project_id does not reference an existing project')

    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', schedule.project_id)
      .in('user_id', [schedule.created_by, schedule.user_id])

    if (membersError) throw membersError

    const memberIds = new Set((members || []).map((m) => m.user_id))
    if (!memberIds.has(schedule.created_by)) {
      throw authError('created_by is not a member of this project')
    }
    if (!memberIds.has(schedule.user_id)) {
      throw authError('user_id is not a member of this project')
    }
  }
}
