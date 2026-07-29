import { supabase } from "./db.js";
import { resolveManagerScope } from "./dataFetch.js";

// How much slack (in hours) around a shift's start/end still counts as
// "clocking in for that shift". Matches the value used by the client-side
// analytics code this endpoint replaces.
const MATCH_BUFFER_HOURS = 2;

// Column names confirmed against the actual Supabase schema:
//   clock_records -> clock_in_at / clock_out_at
//   schedules     -> user_id / account_id / project_id / start_time / end_time
//   leave_requests-> user_id / start_date / end_date / leave_type
//   tasks         -> assigned_to / account_id / project_id / status / created_at

function applyScope(query, scope) {
  if (scope.unrestricted) return query;

  const filters = [];
  if (scope.accountIds.length) {
    filters.push(`account_id.in.(${scope.accountIds.join(",")})`);
  }
  if (scope.projectIds.length) {
    filters.push(`project_id.in.(${scope.projectIds.join(",")})`);
  }
  if (!filters.length) {
    return query.eq("id", "00000000-0000-0000-0000-000000000000");
  }
  return query.or(filters.join(","));
}

function isMatch(clockRecord, schedule) {
  if (clockRecord.user_id !== schedule.user_id) return false;
  const bufferMs = MATCH_BUFFER_HOURS * 60 * 60 * 1000;
  const clockIn = new Date(clockRecord.clock_in_at).getTime();
  const shiftStart = new Date(schedule.start_time).getTime() - bufferMs;
  const shiftEnd = new Date(schedule.end_time).getTime() + bufferMs;
  return clockIn >= shiftStart && clockIn <= shiftEnd;
}

// For one [start, end) window, count completed vs missed shifts by matching
// ended schedules against clock_records. A shift counts as completed if a
// matching clock record has a clock_out_at.
async function completedVsMissed({ scope, startISO, endISO }) {
  const nowISO = new Date().toISOString();
  const windowEnd = endISO < nowISO ? endISO : nowISO;

  const schedulesQuery = applyScope(
    supabase
      .from("schedules")
      .select("id, user_id, account_id, project_id, start_time, end_time")
      .gte("start_time", startISO)
      .lt("start_time", endISO)
      .lt("end_time", windowEnd),
    scope,
  );

  const { data: schedules, error: scheduleError } = await schedulesQuery;
  if (scheduleError) {
    throw new Error(`Failed to fetch schedules: ${scheduleError.message}`);
  }

  const userIds = Array.from(
    new Set((schedules || []).map((s) => s.user_id).filter(Boolean)),
  );

  let clockRecords = [];
  if (userIds.length) {
    const { data, error } = await supabase
      .from("clock_records")
      .select("user_id, clock_in_at, clock_out_at")
      .in("user_id", userIds)
      .gte("clock_in_at", startISO)
      .lt("clock_in_at", endISO);
    if (error) {
      throw new Error(`Failed to fetch clock records: ${error.message}`);
    }
    clockRecords = data || [];
  }

  let completed = 0;
  let missed = 0;
  for (const schedule of schedules || []) {
    const clockedOut = clockRecords.some(
      (cr) => isMatch(cr, schedule) && cr.clock_out_at,
    );
    if (clockedOut) completed++;
    else missed++;
  }

  return { completed, missed };
}

async function countTotalShifts({ scope, startISO, endISO }) {
  const q = applyScope(
    supabase
      .from("schedules")
      .select("*", { count: "exact", head: true })
      .gte("start_time", startISO)
      .lt("start_time", endISO),
    scope,
  );
  const { count, error } = await q;
  if (error) throw new Error(`Failed to count shifts: ${error.message}`);
  return count ?? 0;
}

async function countTasksDone({ scope, startISO, endISO }) {
  const q = applyScope(
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startISO)
      .lt("created_at", endISO)
      .eq("status", "done"),
    scope,
  );
  const { count, error } = await q;
  if (error) throw new Error(`Failed to count tasks: ${error.message}`);
  return count ?? 0;
}

async function countLeaveInWindow({ scope, startISO, endISO }) {
  // leave_requests has no account_id/project_id, so it can't be scoped the
  // same way. For unrestricted (Owner/GM) callers count everything in the
  // window; otherwise scope via the users visible through scoped schedules.
  if (scope.unrestricted) {
    const { count, error } = await supabase
      .from("leave_requests")
      .select("*", { count: "exact", head: true })
      .lte("start_date", endISO)
      .gte("end_date", startISO);
    if (error) throw new Error(`Failed to count leave: ${error.message}`);
    return count ?? 0;
  }

  const scopedSchedules = applyScope(
    supabase.from("schedules").select("user_id"),
    scope,
  );
  const { data: sched, error: schedErr } = await scopedSchedules;
  if (schedErr) throw new Error(`Failed to scope leave: ${schedErr.message}`);

  const userIds = Array.from(
    new Set((sched || []).map((s) => s.user_id).filter(Boolean)),
  );
  if (!userIds.length) return 0;

  const { count, error } = await supabase
    .from("leave_requests")
    .select("*", { count: "exact", head: true })
    .in("user_id", userIds)
    .lte("start_date", endISO)
    .gte("end_date", startISO);
  if (error) throw new Error(`Failed to count leave: ${error.message}`);
  return count ?? 0;
}

function weekBoundaries(weeksAgo) {
  const end = new Date();
  end.setDate(end.getDate() - 7 * weeksAgo);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { start: start.toISOString(), end: end.toISOString() };
}

// Returns everything the analytics dashboard needs in one scoped payload.
export async function buildAnalytics({ user, weeks = 6 }) {
  const scope = await resolveManagerScope(user);

  const thisWeek = weekBoundaries(0);
  const [shiftStats, leaveCount, totalShifts, tasksDone] = await Promise.all([
    completedVsMissed({
      scope,
      startISO: thisWeek.start,
      endISO: thisWeek.end,
    }),
    countLeaveInWindow({
      scope,
      startISO: thisWeek.start,
      endISO: thisWeek.end,
    }),
    countTotalShifts({ scope, startISO: thisWeek.start, endISO: thisWeek.end }),
    countTasksDone({ scope, startISO: thisWeek.start, endISO: thisWeek.end }),
  ]);

  const trend = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const b = weekBoundaries(i);
    const stats = await completedVsMissed({
      scope,
      startISO: b.start,
      endISO: b.end,
    });
    trend.push({
      week: i === 0 ? "This wk" : `${i}w ago`,
      completed: stats.completed,
      missed: stats.missed,
    });
  }

  return {
    thisWeek: {
      totalShifts,
      completed: shiftStats.completed,
      missed: shiftStats.missed,
      leave: leaveCount,
      tasksCompleted: tasksDone,
    },
    trend,
    weeks,
  };
}
