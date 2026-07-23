import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getScheduleById, updateSchedule, deleteSchedule } from '@/lib/scheduling/schedulingService'

function errorResponse(error) {
  const status = error?.status || 500
  return NextResponse.json({ error: error?.message || 'Unexpected error' }, { status })
}

// GET /api/schedules/:id
export async function GET(_, { params }) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const schedule = await getScheduleById(supabase, id)
    if (!schedule) return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    return NextResponse.json({ schedule }, { status: 200 })
  } catch (error) {
    return errorResponse(error)
  }
}

// PATCH /api/schedules/:id
// Re-validates and re-checks permissions/conflicts against the merged record.
export async function PATCH(request, { params }) {
  const { id } = await params
  let payload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const schedule = await updateSchedule(supabase, id, payload)
    return NextResponse.json({ schedule }, { status: 200 })
  } catch (error) {
    return errorResponse(error)
  }
}

// DELETE /api/schedules/:id
export async function DELETE(_, { params }) {
  const { id } = await params

  try {
    const supabase = await createClient()
    await deleteSchedule(supabase, id)
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    return errorResponse(error)
  }
}
