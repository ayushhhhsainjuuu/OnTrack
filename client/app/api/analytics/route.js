import { NextResponse } from "next/server";

// Base URL for the AI microservice (backend/ai-service).
// Defaults to the service's local/dev port, matching its Dockerfile (PORT=4005).
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:4005";

function buildForwardHeaders(request) {
  const headers = { "Content-Type": "application/json" };
  const authorization = request.headers.get("authorization");
  if (authorization) headers.Authorization = authorization;
  return headers;
}

// GET /api/analytics?weeks=6
// Proxies to GET {AI_SERVICE_URL}/ai/analytics. The ai-service validates the
// forwarded Supabase token itself (requireAuth) and gates to manager roles.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const weeks = searchParams.get("weeks") || "6";

  let response;

  try {
    response = await fetch(
      `${AI_SERVICE_URL}/ai/analytics?weeks=${encodeURIComponent(weeks)}`,
      { method: "GET", headers: buildForwardHeaders(request) },
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to reach the AI service." },
      { status: 502 },
    );
  }

  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}
