import express from "express";
import cors from "cors";
import { supabase } from "./db.js";
import { requireAuth, requireSchedulePermission } from "./auth.js";
import {
  triggerSchedulePublished,
  triggerScheduleCancelled,
  triggerScheduleUpdated,
} from "./notifications.js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;

app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "scheduling" }),
);

app.use("/schedules", requireAuth);

app.get("/schedules", async (req, res) => {
  const { data, error } = await supabase.from("schedules").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post(
  "/schedules",
  requireSchedulePermission((req) => req.body.user_id),
  async (req, res) => {
    const {
      user_id,
      account_id,
      project_id,
      start_time,
      end_time,
      notes,
      status,
    } = req.body;

    const { data, error } = await supabase
      .from("schedules")
      .insert({
        user_id,
        account_id: account_id || null,
        project_id: project_id || null,
        created_by: req.user.id,
        start_time,
        end_time,
        notes: notes || null,
        status: status || "draft",
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    if (data.status === "published") {
      await triggerSchedulePublished(data);
    }

    res.status(201).json(data);
  },
);

app.patch(
  "/schedules/:id",
  requireSchedulePermission(async (req) => {
    const { data } = await supabase
      .from("schedules")
      .select("user_id")
      .eq("id", req.params.id)
      .single();
    return data?.user_id;
  }),
  async (req, res) => {
    const { data: existingSchedule, error: fetchError } = await supabase
      .from("schedules")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: "Schedule not found." });
    }

    const { data, error } = await supabase
      .from("schedules")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const timeChanged =
      req.body.start_time !== undefined || req.body.end_time !== undefined;

    if (existingSchedule.status === "published" && timeChanged) {
      await triggerScheduleUpdated(data);
    }

    res.json(data);
  },
);

app.patch(
  "/schedules/:id/publish",
  requireSchedulePermission(async (req) => {
    const { data } = await supabase
      .from("schedules")
      .select("user_id")
      .eq("id", req.params.id)
      .single();
    return data?.user_id;
  }),
  async (req, res) => {
    const { data, error } = await supabase
      .from("schedules")
      .update({ status: "published" })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await triggerSchedulePublished(data);

    res.json(data);
  },
);

app.patch(
  "/schedules/:id/cancel",
  requireSchedulePermission(async (req) => {
    const { data } = await supabase
      .from("schedules")
      .select("user_id")
      .eq("id", req.params.id)
      .single();
    return data?.user_id;
  }),
  async (req, res) => {
    const { reason } = req.body;

    const { data, error } = await supabase
      .from("schedules")
      .update({ status: "cancelled", notes: reason || null })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    await triggerScheduleCancelled(data, reason);

    res.json(data);
  },
);

app.delete("/schedules/:id", async (req, res) => {
  const { error } = await supabase
    .from("schedules")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`scheduling-service running on ${PORT}`));
