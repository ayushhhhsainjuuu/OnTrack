import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors()); // allow requests from other origins (e.g. your frontend)
app.use(express.json()); // parse incoming JSON request bodies

// Connect to Supabase using the service role key (full backend access, bypasses RLS)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PORT = process.env.PORT || 4003;

// List of words to block from leave request reasons
const bannedWords = ["kill", "bitch", "fuck", "shit", "asshole", "bastard"];

// Checks if a given text contains any banned/inappropriate words
function containsProfanity(text) {
  if (!text) return false; // nothing to check if text is empty/undefined
  const lowerText = text.toLowerCase(); // case-insensitive match
  return bannedWords.some((word) => lowerText.includes(word));
}

// Simple health check endpoint — used by Kubernetes to confirm the pod is alive
app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "leave" })
);

// Get all leave requests, along with the requesting employee's name and role
app.get("/leave", async (req, res) => {
  const { data, error } = await supabase
    .from("leave_requests")
    .select(
      "*, employee_user:users!leave_requests_user_fk(full_name, system_role)"
    )
    .order("created_at", { ascending: false }); // newest requests first
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Submit a leave request
app.post("/leave", async (req, res) => {
  const { user_id, leave_type, start_date, end_date, reason } = req.body;

  // All fields are required to submit a request
  if (!user_id || !leave_type || !start_date || !end_date || !reason) {
    return res.status(400).json({
      error: "user_id, leave_type, start_date, end_date, and reason are required.",
    });
  }

  // Block leave requests with inappropriate language in the reason
  if (containsProfanity(reason)) {
    return res.status(400).json({
      error: "Your reason contains inappropriate language. Please revise it.",
    });
  }

  // Basic sanity check: end date can't be before the start date
  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({
      error: "end_date cannot be before start_date.",
    });
  }

  // Insert the new leave request, starting as "pending" until a manager reviews it
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
    .select(
      "*, employee_user:users!leave_requests_user_fk(full_name, system_role)"
    );
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Cancel a pending leave request (only the requester can cancel their own)
app.patch("/leave/:id/cancel", async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required." });
  }

  // Look up the existing request first, so we can validate ownership + status
  const { data: existing, error: fetchError } = await supabase
    .from("leave_requests")
    .select("id, status, user_id")
    .eq("id", req.params.id)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: fetchError.message });
  if (!existing) return res.status(404).json({ error: "Leave request not found." });

  // Prevent cancelling someone else's leave request
  if (existing.user_id !== user_id) {
    return res.status(403).json({
      error: "You can only cancel your own leave requests.",
    });
  }

  // Only pending requests can be cancelled (not already approved/rejected)
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

// Approve or reject a leave request (used by managers)
app.patch("/leave/:id", async (req, res) => {
  const { status, reviewed_by, reviewer_notes } = req.body;

  // Only update if the request is still pending — prevents re-deciding an already-decided request
  const { data, error } = await supabase
    .from("leave_requests")
    .update({
      status,
      reviewed_by: reviewed_by ?? null,
      reviewer_notes: reviewer_notes ?? null,
    })
    .eq("id", req.params.id)
    .eq("status", "pending")
    .select();
  if (error) return res.status(500).json({ error: error.message });

  const decidedRequest = data?.[0];
  let conflictWarning = null;

  // If approved, check whether the employee already has shifts scheduled during that leave period
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

  // Notify the employee of the decision (approved or rejected)
  if (decidedRequest && ["approved", "rejected"].includes(req.body.status)) {
    await supabase.from("notifications").insert({
      user_id: decidedRequest.user_id,
      type: req.body.status === "approved" ? "leave_approved" : "leave_rejected",
      message:
        req.body.status === "approved"
          ? `Your ${decidedRequest.leave_type} request for ${decidedRequest.start_date} to ${decidedRequest.end_date} was approved.`
          : `Your ${decidedRequest.leave_type} request for ${decidedRequest.start_date} to ${decidedRequest.end_date} was rejected.`,
    });
  }

  res.json({ data, conflictWarning });
});

app.listen(PORT, () => console.log(`leave-service running on ${PORT}`));