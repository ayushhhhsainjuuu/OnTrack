"use client";

import { useEffect, useState } from "react";
// Same client-side Supabase instance you used in AIQueryBox — adjust path if needed.
import { supabase } from "@/lib/supabaseClient";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ---------------------------------------------------------------------------
// EDIT THESE to match your schema (same values as AIQueryBox).
// ---------------------------------------------------------------------------
const TABLES = {
  shifts: "shifts",
  leave: "leave_requests",
  tasks: "tasks",
};
const COLUMNS = {
  shiftDate: "start_time",
  shiftStatus: "status",
  leaveDate: "created_at",
  taskDate: "created_at",
  taskStatus: "status",
};
const WEEKS = 6; // how many weeks the trend line covers
// ---------------------------------------------------------------------------

// count rows in [start, end) with optional status filter
function countBetween(table, dateCol, startISO, endISO, statusCol, statusVal) {
  let q = supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte(dateCol, startISO)
    .lt(dateCol, endISO);
  if (statusCol) q = q.eq(statusCol, statusVal);
  return q;
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
        const [completed, missed, leave, tasks] = await Promise.all([
          countBetween(TABLES.shifts, COLUMNS.shiftDate, start, end, COLUMNS.shiftStatus, "completed"),
          countBetween(TABLES.shifts, COLUMNS.shiftDate, start, end, COLUMNS.shiftStatus, "missed"),
          countBetween(TABLES.leave, COLUMNS.leaveDate, start, end),
          countBetween(TABLES.tasks, COLUMNS.taskDate, start, end, COLUMNS.taskStatus, "completed"),
        ]);
        const firstErr = [completed, missed, leave, tasks].find((r) => r.error);
        if (firstErr?.error) throw new Error(firstErr.error.message);

        setBarData([
          { name: "Completed", value: completed.count ?? 0 },
          { name: "Missed", value: missed.count ?? 0 },
          { name: "Leave", value: leave.count ?? 0 },
          { name: "Tasks", value: tasks.count ?? 0 },
        ]);

        // ---- Line: completed vs missed shifts over the last WEEKS weeks ----
        const weekResults = [];
        for (let i = WEEKS - 1; i >= 0; i--) {
          const b = weekBoundaries(i);
          const [c, m] = await Promise.all([
            countBetween(TABLES.shifts, COLUMNS.shiftDate, b.start, b.end, COLUMNS.shiftStatus, "completed"),
            countBetween(TABLES.shifts, COLUMNS.shiftDate, b.start, b.end, COLUMNS.shiftStatus, "missed"),
          ]);
          if (c.error) throw new Error(c.error.message);
          if (m.error) throw new Error(m.error.message);
          weekResults.push({
            week: i === 0 ? "This wk" : `${i}w ago`,
            completed: c.count ?? 0,
            missed: m.count ?? 0,
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