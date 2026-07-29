import { NextResponse } from 'next/server'

// Base URL for the leave microservice (backend/leave-service).
// Defaults to the service's local/dev port (see backend/leave-service/index.js, PORT=4003).
const LEAVE_SERVICE_URL =
  process.env.LEAVE_SERVICE_URL || 'http://localhost:4003'

function buildForwardHeaders(request) {
  const headers = { 'Content-Type': 'application/json' }
  const authorization = request.headers.get('authorization')

  if (authorization) {
    headers.Authorization = authorization
  }

  return headers
}

async function forwardToLeaveService(path, options) {
  let response

  try {
    response = await fetch(`${LEAVE_SERVICE_URL}${path}`, options)
  } catch {
    return NextResponse.json(
      { error: 'Unable to reach the leave service.' },
      { status: 502 }
    )
  }

  const data = await response.json().catch(() => null)

  return NextResponse.json(data, { status: response.status })
}

// GET /api/leave
export async function GET(request) {
  return forwardToLeaveService('/leave', {
    method: 'GET',
    headers: buildForwardHeaders(request),
  })
}

// POST /api/leave
// Body: { user_id, leave_type, start_date, end_date, reason }
export async function POST(request) {
  let payload

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  return forwardToLeaveService('/leave', {
    method: 'POST',
    headers: buildForwardHeaders(request),
    body: JSON.stringify(payload),
  })
}

// PATCH /api/leave?id=<leaveRequestId>&action=cancel
// - action=cancel proxies to PATCH {LEAVE_SERVICE_URL}/leave/:id/cancel (body: { user_id })
// - no action proxies to PATCH {LEAVE_SERVICE_URL}/leave/:id (body: { status }) for approve/reject
export async function PATCH(request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const action = searchParams.get('action')

  if (!id) {
    return NextResponse.json(
      { error: 'A leave request "id" query param is required.' },
      { status: 400 }
    )
  }

  let payload = {}

  try {
    payload = await request.json()
  } catch {
    payload = {}
  }

  const suffix = action === 'cancel' ? '/cancel' : ''

  return forwardToLeaveService(`/leave/${id}${suffix}`, {
    method: 'PATCH',
    headers: buildForwardHeaders(request),
    body: JSON.stringify(payload),
  })
}
