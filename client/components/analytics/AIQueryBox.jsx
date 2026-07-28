"use client";

import { useState } from "react";
// Reuse your existing client-side Supabase instance (the one used for auth).
// Adjust this path if yours lives somewhere else (e.g. "@/utils/supabase").
import { supabase } from "@/lib/supabase";

// AI microservice base URL. Set NEXT_PUBLIC_AI_SERVICE_URL in your env.
// Local dev default matches ai-service (PORT 4005).
const AI_SERVICE_URL =
  process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:4005";

// ---------------------------------------------------------------------------
// EDIT THESE to match your real Supabase schema. These are the ONLY lines
// that depend on your table/column names.
// ---------------------------------------------------------------------------
const TABLES = {
  shifts: "shifts",          // your schedule / shifts table
  leave: "leave_requests",   // your leave requests table
  tasks: "tasks",            // your tasks table
};

const COLUMNS = {
  shiftDate: "start_time",   // a date/timestamp column on shifts
  shiftStatus: "status",     // values like "completed" | "missed" | "scheduled"
  leaveDate: "created_at",   // a date/timestamp column on leave
  taskDate: "created_at",    // a date/timestamp column on tasks
  taskStatus: "status",      // values like "done" | "completed"
};

const WINDOW_DAYS = 7;
// ---------------------------------------------------------------------------

function startOfWindow() {
  const d = new Date();
  d.setDate(d.getDate() - WINDOW_DAYS);
  return d.toISOString();
}

export default function AIQueryBox() {
  const [numbers, setNumbers] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: pull the aggregate numbers straight from Supabase.
  // Count-only queries (head: true) so no row data is transferred.
  async function fetchNumbers() {
    const since = startOfWindow();
    const countIn = (table) =>
      supabase.from(table).select("*", { count: "exact", head: true });

    const [total, completed, missed, leave, tasksDone] = await Promise.all([
      countIn(TABLES.shifts).gte(COLUMNS.shiftDate, since),
      countIn(TABLES.shifts).gte(COLUMNS.shiftDate, since).eq(COLUMNS.shiftStatus, "completed"),
      countIn(TABLES.shifts).gte(COLUMNS.shiftDate, since).eq(COLUMNS.shiftStatus, "missed"),
      countIn(TABLES.leave).gte(COLUMNS.leaveDate, since),
      countIn(TABLES.tasks).gte(COLUMNS.taskDate, since).eq(COLUMNS.taskStatus, "completed"),
    ]);

    const failed = [total, completed, missed, leave, tasksDone].find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);

    return {
      windowDays: WINDOW_DAYS,
      totalShifts: total.count ?? 0,
      completedShifts: completed.count ?? 0,
      missedShifts: missed.count ?? 0,
      leaveRequests: leave.count ?? 0,
      tasksCompleted: tasksDone.count ?? 0,
    };
  }

  // Step 2: send those numbers to ai-service, which asks Claude to write
  // the summary. The model only narrates real data.
  async function fetchSummary(context) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch(`${AI_SERVICE_URL}/ai/summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reportType: "weekly", context }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data.summary;
  }

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setSummary("");
    try {
      const nums = await fetchNumbers();
      setNumbers(nums);
      const text = await fetchSummary(nums);
      setSummary(text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <h2 style={styles.title}>Weekly AI Summary</h2>
        <button style={styles.button} onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating…" : "Generate"}
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

      {summary && (
        <div style={styles.summaryBox}>
          <p style={styles.summaryText}>{summary}</p>
        </div>
      )}

      {!numbers && !loading && !error && (
        <p style={styles.hint}>
          Click Generate to load the last {WINDOW_DAYS} days of stats and an AI summary.
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
  summaryBox: { borderTop: "1px solid #e2e8f0", paddingTop: 16 },
  summaryText: { fontSize: 14, lineHeight: 1.6, color: "#334155", margin: 0, whiteSpace: "pre-wrap" },
  error: { color: "#dc2626", fontSize: 14 },
  hint: { color: "#94a3b8", fontSize: 14 },
};