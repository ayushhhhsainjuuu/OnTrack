"use client";

import { useState } from "react";
// Reuse your existing client-side Supabase instance (the one used for auth).
// Adjust this path if yours lives somewhere else (e.g. "@/utils/supabase").
import { supabase } from "@/lib/supabase";

// EDIT THESE to match your real Supabase schema. These are the ONLY lines
// that depend on your table/column names.
const TABLES = {
  shifts: "schedules",     // scheduled shifts — status is draft/published/cancelled, no completed/missed
  clock: "clock_records",  // actual clock in/out events, matched against schedules below
  leave: "leave_requests",
  tasks: "tasks",
};

const COLUMNS = {
  shiftDate: "start_time",     // schedules
  leaveDate: "created_at",     // leave_requests
  taskDate: "created_at",      // tasks
  taskStatus: "status",        // tasks.status is pending | in_progress | done
  clockInDate: "clock_in_at",  // clock_records
  clockOutCol: "clock_out_at", // null = never clocked out
};

const WINDOW_DAYS = 7;

// How much slack (in hours) around a shift's start/end time still counts as
// "clocking in for that shift" — covers people clocking in a bit early/late.
const MATCH_BUFFER_HOURS = 2;

function startOfWindow() {
  const d = new Date();
  d.setDate(d.getDate() - WINDOW_DAYS);
  return d.toISOString();
}

// Does this clock_records row belong to this schedule?
// Same user, and clocked in within [start_time - buffer, end_time + buffer].
function isMatch(clockRecord, schedule) {
  if (clockRecord.user_id !== schedule.user_id) return false;
  const bufferMs = MATCH_BUFFER_HOURS * 60 * 60 * 1000;
  const clockIn = new Date(clockRecord.clock_in_at).getTime();
  const shiftStart = new Date(schedule.start_time).getTime() - bufferMs;
  const shiftEnd = new Date(schedule.end_time).getTime() + bufferMs;
  return clockIn >= shiftStart && clockIn <= shiftEnd;
}

export default function AIQueryBox() {
  const [numbers, setNumbers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: pull the aggregate numbers straight from Supabase.
  async function fetchNumbers() {
    const since = startOfWindow();
    const nowISO = new Date().toISOString();

    const totalQ = supabase
      .from(TABLES.shifts)
      .select("*", { count: "exact", head: true })
      .gte(COLUMNS.shiftDate, since);

    // Only shifts that have already ended can be judged completed vs missed.
    const pastSchedulesQ = supabase
      .from(TABLES.shifts)
      .select("id,user_id,start_time,end_time")
      .gte(COLUMNS.shiftDate, since)
      .lt("end_time", nowISO);

    const clockRecordsQ = supabase
      .from(TABLES.clock)
      .select("user_id,clock_in_at,clock_out_at")
      .gte(COLUMNS.clockInDate, since);

    const leaveQ = supabase
      .from(TABLES.leave)
      .select("*", { count: "exact", head: true })
      .gte(COLUMNS.leaveDate, since);

    const tasksQ = supabase
      .from(TABLES.tasks)
      .select("*", { count: "exact", head: true })
      .gte(COLUMNS.taskDate, since)
      .eq(COLUMNS.taskStatus, "done");

    const [total, pastSchedules, clockRecords, leave, tasksDone] = await Promise.all([
      totalQ,
      pastSchedulesQ,
      clockRecordsQ,
      leaveQ,
      tasksQ,
    ]);

    const failed = [total, pastSchedules, clockRecords, leave, tasksDone].find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);

    // Match each ended shift against clock_records to decide completed vs missed.
    let completedShifts = 0;
    let missedShifts = 0;
    for (const schedule of pastSchedules.data ?? []) {
      const clockedOut = (clockRecords.data ?? []).some(
        (cr) => isMatch(cr, schedule) && cr.clock_out_at
      );
      if (clockedOut) completedShifts++;
      else missedShifts++;
    }

    return {
      windowDays: WINDOW_DAYS,
      totalShifts: total.count ?? 0,
      completedShifts,
      missedShifts,
      leaveRequests: leave.count ?? 0,
      tasksCompleted: tasksDone.count ?? 0,
    };
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const nums = await fetchNumbers();
      setNumbers(nums);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h2 style={styles.title}>Weekly Stats</h2>
        <button style={styles.button} onClick={handleGenerate} disabled={loading}>
          {loading ? "Loading…" : "Generate"}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {numbers && (
        <div style={styles.grid}>
          <Stat label="Total shifts" value={numbers.totalShifts} />
          <Stat label="Completed" value={numbers.completedShifts} />
          <Stat label="Missed" value={numbers.missedShifts} />
          <Stat label="Leave requests" value={numbers.leaveRequests} />
          <Stat label="Tasks completed" value={numbers.tasksCompleted} />
        </div>
      )}

      {!numbers && !loading && !error && (
        <p style={styles.hint}>
          Click Generate to load the last {WINDOW_DAYS} days of stats.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardValue}>{value}</div>
      <div style={styles.cardLabel}>{label}</div>
    </div>
  );
}

const styles = {
  wrap: { border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, background: "#fff", maxWidth: 720 },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 600, color: "#1e293b", margin: 0 },
  button: { background: "#334155", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginBottom: 16 },
  card: { border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, textAlign: "center", background: "#f8fafc" },
  cardValue: { fontSize: 26, fontWeight: 700, color: "#0f172a" },
  cardLabel: { fontSize: 12, color: "#64748b", marginTop: 4 },
  error: { color: "#dc2626", fontSize: 14 },
  hint: { color: "#94a3b8", fontSize: 14 },
};