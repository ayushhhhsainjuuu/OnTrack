import express from "express";
import cors from "cors";
import { supabase } from "./db.js";
import { requireAuth, requireSchedulePermission } from "./auth.js";
import { listAssignableEmployees } from "./authUsers.js";
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

// GET /schedules/assignable-employees?roles=Cleaner,Foreman,Lead
// Used by the frontend's Create Schedule employee picker.
app.get("/schedules/assignable-employees", async (req, res) => {
  const roles = String(req.query.roles || "")
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  if (roles.length === 0) {
    return res.json([]);
  }

  try {
    const employees = await listAssignableEmployees(roles);
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Checks whether a user already has an overlapping (non-cancelled)
// schedule, or an approved leave request
async function findSchedulingConflicts({ user_id, start_time, end_time }) {
  const startDate = start_time.slice(0, 10);
  const endDate = end_time.slice(0, 10);

  const [
    { data: overlappingSchedules, error: scheduleError },
    { data: overlappingLeave, error: leaveError },
  ] = await Promise.all([
    supabase
      .from("schedules")
      .select("id, start_time, end_time")
      .eq("user_id", user_id)
      .not("status", "ilike", "cancelled")
      .lt("start_time", end_time)
      .gt("end_time", start_time),
    supabase
      .from("leave_requests")
      .select("id, start_date, end_date")
      .eq("user_id", user_id)
      .ilike("status", "approved")
      .lte("start_date", endDate)
      .gte("end_date", startDate),
  ]);

  if (scheduleError) throw new Error(scheduleError.message);
  if (leaveError) throw new Error(leaveError.message);

  return {
    overlappingSchedules: overlappingSchedules || [],
    overlappingLeave: overlappingLeave || [],
  };
}

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

    if (!user_id || !start_time || !end_time) {
      return res.status(400).json({
        error: "user_id, start_time, and end_time are required.",
      });
    }

    try {
      const { overlappingSchedules, overlappingLeave } =
        await findSchedulingConflicts({ user_id, start_time, end_time });

      if (overlappingSchedules.length > 0) {
        return res.status(409).json({
          error:
            "This employee already has a schedule that overlaps with the selected time.",
        });
      }

      if (overlappingLeave.length > 0) {
        return res.status(409).json({
          error:
            "This employee has approved leave that overlaps with the selected dates.",
        });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }

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
