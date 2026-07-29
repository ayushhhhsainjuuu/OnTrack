import { NextResponse } from "next/server";

// Base URL for the clock microservice (backend/clock-services).
// Defaults to the service's local/dev port, matching its Dockerfile (PORT=4002).
const CLOCK_SERVICE_URL =
  process.env.CLOCK_SERVICE_URL || "http://localhost:4002";

function buildForwardHeaders(request) {
  const headers = { "Content-Type": "application/json" };
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;
  return headers;
}

async function forward(path, options) {
  let response;
  try {
    response = await fetch(`${CLOCK_SERVICE_URL}${path}`, options);
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the clock service." },
      { status: 502 },
    );
  }
  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}

// GET /api/clock            -> the caller's clock history
// GET /api/clock?open=true  -> the caller's currently-open record (or null)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("open") === "true" ? "/clock/open" : "/clock";

  return forward(path, {
    method: "GET",
    headers: buildForwardHeaders(request),
  });
}

// POST /api/clock
// Body: { account_id?, project_id?, lat?, lng?, outside_geofence?, notes? }
// Opens a new clock record for the authenticated user.
export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  return forward("/clock/in", {
    method: "POST",
    headers: buildForwardHeaders(request),
    body: JSON.stringify(payload),
  });
}

// PATCH /api/clock
// Body: { lat?, lng?, notes? }
// Closes the authenticated user's currently-open clock record.
export async function PATCH(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  return forward("/clock/out", {
    method: "PATCH",
    headers: buildForwardHeaders(request),
    body: JSON.stringify(payload),
  });
}
