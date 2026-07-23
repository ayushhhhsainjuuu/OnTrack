import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSchedules, createSchedule } from '@/lib/scheduling/schedulingService'

function errorResponse(error) {
  const status = error?.status || 500
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status })
}

// GET /api/schedules?account_id=&project_id=&user_id=&status=&start=&end=&page=&limit=
// Returns schedules, optionally filtered by account, project, assignee, status, or date range.
export async function GET(request) {
  const { searchParams } = new URL(request.url)

  const filters = {
    page: Number(searchParams.get('page')) || 1,
    limit: Number(searchParams.get('limit')) || undefined,
    accountId: searchParams.get('account_id') || undefined,
    projectId: searchParams.get('project_id') || undefined,
    userId: searchParams.get('user_id') || undefined,
    status: searchParams.get('status') || undefined,
    start: searchParams.get('start') || undefined,
    end: searchParams.get('end') || undefined,
  }

  try {
    const supabase = await createClient()
    const { data, count } = await getSchedules(supabase, filters)
    return NextResponse.json({ schedules: data, count }, { status: 200 })
  } catch (error) {
    return errorResponse(error)
  }
}

// POST /api/schedules
// Body: { user_id, created_by, account_id?, project_id?, start_time, end_time, status?, notes? }
// created_by must be an active user with system_role "Foreman" or "Lead",
// and must be a member of the target account (via account_members) or manage the target project.
export async function POST(request) {
  let payload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const schedule = await createSchedule(supabase, payload)
    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
