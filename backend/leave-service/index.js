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

// Approve / reject
app.patch("/leave/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("leave_requests")
    .update({ status: req.body.status })
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => console.log(`leave-service running on ${PORT}`));