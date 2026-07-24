const supabase = require("../config/supabaseClient");
const {
  triggerSchedulePublished,
  triggerScheduleCancelled,
  triggerScheduleUpdated,
} = require("./notificationTriggers");

async function createSchedule(scheduleData, createdBy) {
  const {
    user_id,
    account_id,
    project_id,
    start_time,
    end_time,
    notes,
    status,
  } = scheduleData;

  const { data, error } = await supabase
    .from("schedules")
    .insert({
      user_id,
      account_id: account_id || null,
      project_id: project_id || null,
      created_by: createdBy,
      start_time,
      end_time,
      notes: notes || null,
      status: status || "draft",
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create schedule: ${error.message}`);
  }

  if (data.status === "published") {
    await triggerSchedulePublished(data);
  }

  return data;
}

async function publishSchedule(scheduleId) {
  const { data, error } = await supabase
    .from("schedules")
    .update({ status: "published" })
    .eq("id", scheduleId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to publish schedule: ${error.message}`);
  }

  await triggerSchedulePublished(data);

  return data;
}

async function cancelSchedule(scheduleId, reason) {
  const { data, error } = await supabase
    .from("schedules")
    .update({ status: "cancelled", notes: reason || null })
    .eq("id", scheduleId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to cancel schedule: ${error.message}`);
  }

  await triggerScheduleCancelled(data, reason);

  return data;
}

async function updateSchedule(scheduleId, updates) {
  const { data: existingSchedule, error: fetchError } = await supabase
    .from("schedules")
    .select("*")
    .eq("id", scheduleId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to load schedule: ${fetchError.message}`);
  }

  const { data, error } = await supabase
    .from("schedules")
    .update(updates)
    .eq("id", scheduleId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update schedule: ${error.message}`);
  }

  const timeChanged =
    updates.start_time !== undefined || updates.end_time !== undefined;

  if (existingSchedule.status === "published" && timeChanged) {
    await triggerScheduleUpdated(data);
  }

  return data;
}

async function getScheduleById(scheduleId) {
  const { data, error } = await supabase
    .from("schedules")
    .select("id, user_id, account_id, project_id")
    .eq("id", scheduleId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

module.exports = {
  createSchedule,
  publishSchedule,
  cancelSchedule,
  updateSchedule,
  getScheduleById,
};
