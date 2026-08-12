import { NextResponse } from "next/server";

// Base URL for the auth microservice (backend/auth-services). Defaults to the
// service's local/dev port (see backend/auth-services/index.js, PORT=4004).
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:4004";

// Forwards the caller's Supabase access token through to the auth service,
// which validates it itself via requireOwnerOrGM in backend/auth-services/index.js.
function buildForwardHeaders(request) {
  const headers = { "Content-Type": "application/json" };
  const authorization = request.headers.get("authorization");

  if (authorization) {
    headers.Authorization = authorization;
  }

  return headers;
}

// POST /api/employees
// Body: { email, password, full_name, system_role }
// Proxies to POST {AUTH_SERVICE_URL}/admin/create-user.
export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let response;

  try {
    response = await fetch(`${AUTH_SERVICE_URL}/admin/create-user`, {
      method: "POST",
      headers: buildForwardHeaders(request),
      body: JSON.stringify(payload),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the auth service." },
      { status: 502 }
    );
  }

  const data = await response.json().catch(() => null);

  return NextResponse.json(data, { status: response.status });
}
