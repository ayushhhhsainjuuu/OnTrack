import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PORT = process.env.PORT || 4003;

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "leave" })
);

app.get("/leave", async (req, res) => {
  const { data, error } = await supabase.from("leave_requests").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Submit a leave request
app.post("/leave", async (req, res) => {
  const { user_id, leave_type, start_date, end_date, reason } = req.body;

  if (!user_id || !leave_type || !start_date || !end_date || !reason) {
    return res.status(400).json({
      error: "user_id, leave_type, start_date, end_date, and reason are required.",
    });
  }

  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({
      error: "end_date cannot be before start_date.",
    });
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      user_id,
      leave_type,
      start_date,
      end_date,
      reason,
      status: "pending",
    })
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Cancel a pending leave request
app.patch("/leave/:id/cancel", async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required." });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("leave_requests")
    .select("id, status, user_id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: fetchError.message });
  if (!existing) return res.status(404).json({ error: "Leave request not found." });

  if (existing.user_id !== user_id) {
    return res.status(403).json({
      error: "You can only cancel your own leave requests.",
    });
  }

  if (existing.status !== "pending") {
    return res.status(400).json({
      error: "Only pending leave requests can be cancelled.",
    });
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .update({ status: "cancelled" })
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Approve / reject
app.patch("/leave/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("leave_requests")
    .update({ status: req.body.status })
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });

  const decidedRequest = data?.[0];
  let conflictWarning = null;

  if (decidedRequest && req.body.status === "approved") {
    const { data: conflictingSchedules, error: conflictError } = await supabase
      .from("schedules")
      .select("id, start_time, end_time")
      .eq("user_id", decidedRequest.user_id)
      .lte("start_time", `${decidedRequest.end_date}T23:59:59`)
      .gte("end_time", `${decidedRequest.start_date}T00:00:00`);

    if (!conflictError && conflictingSchedules?.length > 0) {
      conflictWarning = `This employee already has ${conflictingSchedules.length} shift(s) scheduled during the approved leave dates.`;
    }
  }

  res.json({ data, conflictWarning });
});

app.listen(PORT, () => console.log(`leave-service running on ${PORT}`));