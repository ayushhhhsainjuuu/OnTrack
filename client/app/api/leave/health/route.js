import { NextResponse } from 'next/server'

// Same base URL the main /api/leave proxy uses (backend/leave-service, PORT=4003).
const LEAVE_SERVICE_URL =
  process.env.LEAVE_SERVICE_URL || 'http://localhost:4003'

// Used by the schedule page to check whether the leave microservice's port
// is actually up before rendering the leave-requests section.
export async function GET() {
  try {
    const response = await fetch(`${LEAVE_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    })

    if (!response.ok) {
      return NextResponse.json({ up: false }, { status: 503 })
    }

    return NextResponse.json({ up: true })
  } catch {
    return NextResponse.json({ up: false }, { status: 503 })
  }
}
