"use client";

import { useEffect, useState } from "react";
// Same client-side Supabase instance you used in AIQueryBox — adjust path if needed.
import { supabase } from "@/lib/supabase";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// EDIT THESE to match your schema (same values as AIQueryBox).
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
const WEEKS = 6; // how many weeks the trend line covers

// How much slack (in hours) around a shift's start/end time still counts as
// "clocking in for that shift" — covers people clocking in a bit early/late.
const MATCH_BUFFER_HOURS = 2;

// simple row count with optional equality filter, for leave/tasks
function countBetween(table, dateCol, startISO, endISO, filterCol, filterVal) {
  let q = supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte(dateCol, startISO)
    .lt(dateCol, endISO);
  if (filterCol) q = q.eq(filterCol, filterVal);
  return q;
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

// For a given [start, end) window, fetch ended shifts + clock_records and
// return { completed, missed } counts by matching them up.
async function completedVsMissed(startISO, endISO) {
  const nowISO = new Date().toISOString();
  const windowEnd = endISO < nowISO ? endISO : nowISO; // don't judge shifts that haven't ended yet

  const pastSchedulesQ = supabase
    .from(TABLES.shifts)
    .select("id,user_id,start_time,end_time")
    .gte(COLUMNS.shiftDate, startISO)
    .lt(COLUMNS.shiftDate, endISO)
    .lt("end_time", windowEnd);

  const clockRecordsQ = supabase
    .from(TABLES.clock)
    .select("user_id,clock_in_at,clock_out_at")
    .gte(COLUMNS.clockInDate, startISO)
    .lt(COLUMNS.clockInDate, endISO);

  const [pastSchedules, clockRecords] = await Promise.all([pastSchedulesQ, clockRecordsQ]);

  const failed = [pastSchedules, clockRecords].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  let completed = 0;
  let missed = 0;
  for (const schedule of pastSchedules.data ?? []) {
    const clockedOut = (clockRecords.data ?? []).some(
      (cr) => isMatch(cr, schedule) && cr.clock_out_at
    );
    if (clockedOut) completed++;
    else missed++;
  }
  return { completed, missed };
}

function weekBoundaries(weeksAgo) {
  const end = new Date();
  end.setDate(end.getDate() - 7 * weeksAgo);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function AnalyticsChart() {
  const [barData, setBarData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // ---- Bar: this week's snapshot ----
        const { start, end } = weekBoundaries(0);
        const [shiftStats, leave, tasks] = await Promise.all([
          completedVsMissed(start, end),
          countBetween(TABLES.leave, COLUMNS.leaveDate, start, end),
          countBetween(TABLES.tasks, COLUMNS.taskDate, start, end, COLUMNS.taskStatus, "done"),
        ]);
        if (leave.error) throw new Error(leave.error.message);
        if (tasks.error) throw new Error(tasks.error.message);

        setBarData([
          { name: "Completed", value: shiftStats.completed },
          { name: "Missed", value: shiftStats.missed },
          { name: "Leave", value: leave.count ?? 0 },
          { name: "Tasks", value: tasks.count ?? 0 },
        ]);

        // ---- Line: completed vs missed shifts over the last WEEKS weeks ----
        const weekResults = [];
        for (let i = WEEKS - 1; i >= 0; i--) {
          const b = weekBoundaries(i);
          const stats = await completedVsMissed(b.start, b.end);
          weekResults.push({
            week: i === 0 ? "This wk" : `${i}w ago`,
            completed: stats.completed,
            missed: stats.missed,
          });
        }
        setLineData(weekResults);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading charts…</p>;
  if (error) return <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>;

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 720 }}>
      <div style={box}>
        <h3 style={heading}>This Week</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#334155" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={box}>
        <h3 style={heading}>Shifts Trend ({WEEKS} weeks)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="completed" stroke="#16a34a" strokeWidth={2} />
            <Line type="monotone" dataKey="missed" stroke="#dc2626" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const box = { border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, background: "#fff" };
const heading = { fontSize: 15, fontWeight: 600, color: "#1e293b", margin: "0 0 12px" };