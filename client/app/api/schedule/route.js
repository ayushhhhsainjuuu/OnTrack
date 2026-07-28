import { NextResponse } from 'next/server'

// Base URL for the scheduling microservice (backend/scheduling-service).
// Defaults to the service's local/dev port (see backend/scheduling-service/Dockerfile, PORT=4001).
const SCHEDULING_SERVICE_URL =
  process.env.SCHEDULING_SERVICE_URL || 'http://localhost:4001'

// Forwards the caller's Supabase access token (sent by the browser client, which
// keeps its session in localStorage rather than cookies) through to the scheduling
// service, which validates it itself via requireAuth in backend/scheduling-service/auth.js.
function buildForwardHeaders(request) {
  const headers = { 'Content-Type': 'application/json' }
  const authorization = request.headers.get('authorization')

  if (authorization) {
    headers.Authorization = authorization
  }

  return headers
}

async function forwardToSchedulingService(path, options) {
  let response

  try {
    response = await fetch(`${SCHEDULING_SERVICE_URL}${path}`, options)
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach the scheduling service.' },
      { status: 502 }
    )
  }

  const data = await response.json().catch(() => null)

  return NextResponse.json(data, { status: response.status })
}

// GET /api/schedule
export async function GET(request) {
  const { search, searchParams } = new URL(request.url)

  if (searchParams.get('resource') === 'assignable-employees') {
    const roles = searchParams.get('roles') || ''

    return forwardToSchedulingService(
      `/schedules/assignable-employees?roles=${encodeURIComponent(roles)}`,
      {
        method: 'GET',
        headers: buildForwardHeaders(request),
      }
    )
  }

  return forwardToSchedulingService(`/schedules${search}`, {
    method: 'GET',
    headers: buildForwardHeaders(request),
  })
}

// POST /api/schedule
// Body: { user_id, account_id?, project_id?, start_time, end_time, notes?, status? }
// Proxies to POST {SCHEDULING_SERVICE_URL}/schedules.
export async function POST(request) {
  let payload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  return forwardToSchedulingService('/schedules', {
    method: 'POST',
    headers: buildForwardHeaders(request),
    body: JSON.stringify(payload),
  })
}

// PATCH /api/schedule?id=<scheduleId>&action=publish|cancel
// Proxies to PATCH {SCHEDULING_SERVICE_URL}/schedules/:id, /:id/publish, or /:id/cancel
// depending on the "action" query param. Body is forwarded as-is (e.g. { reason } for cancel).
export async function PATCH(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action')

  if (!id) {
    return NextResponse.json(
      { error: 'A schedule "id" query param is required.' },
      { status: 400 }
    )
  }

  let payload = {}

  try {
    payload = await request.json()
  } catch {
    payload = {}
  }

  const suffix =
    action === 'publish' ? '/publish' : action === 'cancel' ? '/cancel' : ''

  return forwardToSchedulingService(`/schedules/${id}${suffix}`, {
    method: 'PATCH',
    headers: buildForwardHeaders(request),
    body: JSON.stringify(payload),
  })
}

// DELETE /api/schedule?id=<scheduleId>
// Proxies to DELETE {SCHEDULING_SERVICE_URL}/schedules/:id.
export async function DELETE(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json(
      { error: 'A schedule "id" query param is required.' },
      { status: 400 }
    )
  }

  return forwardToSchedulingService(`/schedules/${id}`, {
    method: 'DELETE',
    headers: buildForwardHeaders(request),
  })
}
