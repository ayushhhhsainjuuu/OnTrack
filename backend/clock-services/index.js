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

const PORT = process.env.PORT || 4002;

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "clock" })
);

app.get("/clock", async (req, res) => {
  const { data, error } = await supabase.from("clock_records").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Clock in
app.post("/clock/in", async (req, res) => {
  const { data, error } = await supabase
    .from("clock_records")
    .insert({ ...req.body, clock_in: new Date().toISOString() })
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Clock out
app.patch("/clock/out/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("clock_records")
    .update({ clock_out: new Date().toISOString() })
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.listen(PORT, () => console.log(`clock-service running on ${PORT}`));