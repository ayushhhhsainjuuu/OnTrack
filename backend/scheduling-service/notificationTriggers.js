const supabase = require("../config/supabaseClient");

function formatScheduleTime(schedule) {
  const start = new Date(schedule.start_time);
  const end = new Date(schedule.end_time);

  const dateLabel = start.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });

  const startLabel = start.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  });

  const endLabel = end.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${dateLabel}, ${startLabel} to ${endLabel}`;
}

async function insertNotification({ userId, type, message }) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    message,
    is_read: false,
  });

  if (error) {
    console.error(`Failed to create notification: ${error.message}`);
  }
}

async function getScheduleManagers(schedule) {
  const managerIds = new Set();

  if (schedule.account_id) {
    const { data } = await supabase
      .from("accounts")
      .select("supervisor_id")
      .eq("id", schedule.account_id)
      .single();

    if (data?.supervisor_id) {
      managerIds.add(data.supervisor_id);
    }
  }

  if (schedule.project_id) {
    const { data } = await supabase
      .from("projects")
      .select("account_manager_id")
      .eq("id", schedule.project_id)
      .single();

    if (data?.account_manager_id) {
      managerIds.add(data.account_manager_id);
    }
  }

  return Array.from(managerIds);
}

async function triggerSchedulePublished(schedule) {
  await insertNotification({
    userId: schedule.user_id,
    type: "schedule_published",
    message: `A new shift has been scheduled for you on ${formatScheduleTime(
      schedule,
    )}.`,
  });
}

async function triggerScheduleCancelled(schedule, reason) {
  const reasonText = reason ? ` Reason: ${reason}` : "";

  await insertNotification({
    userId: schedule.user_id,
    type: "schedule_cancelled",
    message: `Your shift on ${formatScheduleTime(
      schedule,
    )} has been cancelled.${reasonText}`,
  });

  const managerIds = await getScheduleManagers(schedule);

  await Promise.all(
    managerIds.map((managerId) =>
      insertNotification({
        userId: managerId,
        type: "schedule_cancelled",
        message: `A shift on ${formatScheduleTime(
          schedule,
        )} has been cancelled.${reasonText}`,
      }),
    ),
  );
}

async function triggerScheduleUpdated(schedule) {
  await insertNotification({
    userId: schedule.user_id,
    type: "schedule_updated",
    message: `Your shift has been updated. It is now scheduled for ${formatScheduleTime(
      schedule,
    )}.`,
  });
}

module.exports = {
  triggerSchedulePublished,
  triggerScheduleCancelled,
  triggerScheduleUpdated,
};
