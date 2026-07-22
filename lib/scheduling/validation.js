const VALID_STATUSES = ['draft', 'published', 'cancelled']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value)
}

function isValidDate(value) {
  if (!value) return false
  const d = new Date(value)
  return !Number.isNaN(d.getTime())
}

function validationError(errors) {
  const error = new Error(errors.join('; '))
  error.status = 400
  return error
}

// Mirrors the constraints defined on the `schedules` table:
// schedules_time_chk, schedules_site_required, schedules_status_chk.
export function validateSchedule(schedule = {}) {
  const errors = []

  if (!isUuid(schedule.user_id)) errors.push('user_id must be a valid uuid')
  if (!isUuid(schedule.created_by)) errors.push('created_by must be a valid uuid')

  if (!schedule.account_id && !schedule.project_id) {
    errors.push('either account_id or project_id is required')
  }
  if (schedule.account_id && !isUuid(schedule.account_id)) {
    errors.push('account_id must be a valid uuid')
  }
  if (schedule.project_id && !isUuid(schedule.project_id)) {
    errors.push('project_id must be a valid uuid')
  }

  if (!isValidDate(schedule.start_time)) errors.push('start_time must be a valid date')
  if (!isValidDate(schedule.end_time)) errors.push('end_time must be a valid date')

  if (isValidDate(schedule.start_time) && isValidDate(schedule.end_time)) {
    if (new Date(schedule.end_time) <= new Date(schedule.start_time)) {
      errors.push('end_time must be after start_time')
    }
  }

  if (schedule.status && !VALID_STATUSES.includes(schedule.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`)
  }

  if (errors.length > 0) {
    throw validationError(errors)
  }
}
