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

const PORT = process.env.PORT || 4001;

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "scheduling" })
);

app.get("/schedules", async (req, res) => {
  const { data, error } = await supabase.from("schedules").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post("/schedules", async (req, res) => {
  const { data, error } = await supabase
    .from("schedules")
    .insert(req.body)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.patch("/schedules/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("schedules")
    .update(req.body)
    .eq("id", req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete("/schedules/:id", async (req, res) => {
  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`scheduling-service running on ${PORT}`));