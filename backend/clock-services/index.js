import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const PORT = process.env.PORT || 4002;

// Verifies the caller's Supabase Auth token and attaches req.user.
// Every /clock route below is authenticated so a user can only ever read or
// write their OWN clock records - the user_id is taken from the verified
// token, never from the request body.
async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Missing authorization token." });
  }

  const { data: authData, error: authError } =
    await supabase.auth.getUser(token);

  if (authError || !authData?.user) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id, system_role, is_active")
    .eq("id", authData.user.id)
    .single();

  if (userError || !userRow) {
    return res
      .status(403)
      .json({ error: "No user record found for this account." });
  }

  if (!userRow.is_active) {
    return res
      .status(403)
      .json({ error: "This account has been deactivated." });
  }

  req.user = { id: userRow.id, role: userRow.system_role };
  next();
}

app.get("/health", (req, res) => res.json({ status: "ok", service: "clock" }));

app.use("/clock", requireAuth);

// GET /clock/open
// Returns the caller's currently-open clock record (clocked in, not yet
// clocked out), or null. The dashboard calls this on load so the clock
// state survives a page refresh instead of resetting to "Clocked Out".
app.get("/clock/open", async (req, res) => {
  const { data, error } = await supabase
    .from("clock_records")
    .select("*")
    .eq("user_id", req.user.id)
    .is("clock_out_at", null)
    .order("clock_in_at", { ascending: false })
    .limit(1);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ record: data?.[0] || null });
});

// GET /clock
// Returns the caller's own clock history, newest first.
app.get("/clock", async (req, res) => {
  const { data, error } = await supabase
    .from("clock_records")
    .select("*")
    .eq("user_id", req.user.id)
    .order("clock_in_at", { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ records: data || [] });
});

// POST /clock/in
// Body: { account_id?, project_id?, lat?, lng?, outside_geofence?, notes?, photo_url? }
//
// photo_url is the path returned by the client after it uploads a clock-in
// selfie to the "clock-photos" storage bucket (client uploads it directly to
// Supabase Storage under its own auth session, then sends us the resulting
// path/URL - this service never touches image bytes).
//
// NOTE: the real clock_records columns are clock_in_at / clock_out_at (the
// previous version of this file wrote clock_in / clock_out, which don't
// exist on the table - those inserts were being rejected by Postgres).
app.post("/clock/in", async (req, res) => {
  const {
    account_id,
    project_id,
    lat,
    lng,
    outside_geofence,
    notes,
    photo_url,
  } = req.body || {};

  // Refuse to open a second record if one is already open.
  const { data: existing } = await supabase
    .from("clock_records")
    .select("id")
    .eq("user_id", req.user.id)
    .is("clock_out_at", null)
    .limit(1);

  if (existing?.length) {
    return res.status(409).json({
      error: "You are already clocked in.",
      record_id: existing[0].id,
    });
  }

  const { data, error } = await supabase
    .from("clock_records")
    .insert({
      user_id: req.user.id,
      account_id: account_id ?? null,
      project_id: project_id ?? null,
      clock_in_at: new Date().toISOString(),
      clock_in_lat: lat ?? null,
      clock_in_lng: lng ?? null,
      outside_geofence: Boolean(outside_geofence),
      notification_sent: false,
      notes: notes ?? null,
      photo_url: photo_url ?? null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ record: data });
});

// PATCH /clock/out
// Body: { lat?, lng?, notes? }
// Closes the caller's currently-open record. No :id needed - the service
// finds the open record for the authenticated user, so a user can't close
// someone else's shift by guessing an id.
app.patch("/clock/out", async (req, res) => {
  const { lat, lng, notes } = req.body || {};

  const { data: open, error: openError } = await supabase
    .from("clock_records")
    .select("id")
    .eq("user_id", req.user.id)
    .is("clock_out_at", null)
    .order("clock_in_at", { ascending: false })
    .limit(1);

  if (openError) return res.status(500).json({ error: openError.message });

  if (!open?.length) {
    return res.status(404).json({ error: "You are not currently clocked in." });
  }

  const updates = {
    clock_out_at: new Date().toISOString(),
    clock_out_lat: lat ?? null,
    clock_out_lng: lng ?? null,
  };

  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from("clock_records")
    .update(updates)
    .eq("id", open[0].id)
    .eq("user_id", req.user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  res.json({ record: data });
});

app.listen(PORT, () => console.log(`clock-service running on ${PORT}`));
