"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Umbrella,
  ClipboardCheck,
  AlertTriangle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import useTheme from "@/hooks/useTheme";

// Table/column names this page reads directly via Supabase (same pattern
// CreateScheduleForm and the dashboards use for tables with no dedicated
// backend service in front of them).
const TABLES = {
  shifts: "schedules",
  clock: "clock_records",
  leave: "leave_requests",
  tasks: "tasks",
};

const COLUMNS = {
  shiftDate: "start_time",
  leaveDate: "created_at",
  taskDate: "created_at",
  taskStatus: "status",
  clockInDate: "clock_in_at",
};

const WEEKS = 6;

// How much slack (in hours) around a shift's start/end time still counts as
// "clocking in for that shift" - covers people clocking in a bit early/late.
const MATCH_BUFFER_HOURS = 2;

function countBetween(table, dateCol, startISO, endISO, filterCol, filterVal) {
  let query = supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .gte(dateCol, startISO)
    .lt(dateCol, endISO);

  if (filterCol) query = query.eq(filterCol, filterVal);

  return query;
}

// Does this clock_records row belong to this schedule? Same user, and
// clocked in within [start_time - buffer, end_time + buffer].
function isMatch(clockRecord, schedule) {
  if (clockRecord.user_id !== schedule.user_id) return false;

  const bufferMs = MATCH_BUFFER_HOURS * 60 * 60 * 1000;
  const clockIn = new Date(clockRecord.clock_in_at).getTime();
  const shiftStart = new Date(schedule.start_time).getTime() - bufferMs;
  const shiftEnd = new Date(schedule.end_time).getTime() + bufferMs;

  return clockIn >= shiftStart && clockIn <= shiftEnd;
}

// For a given [start, end) window, fetch ended shifts + clock_records and
// match them up into completed vs missed counts.
async function completedVsMissed(startISO, endISO) {
  const nowISO = new Date().toISOString();
  const windowEnd = endISO < nowISO ? endISO : nowISO;

  const pastSchedulesQuery = supabase
    .from(TABLES.shifts)
    .select("id,user_id,start_time,end_time")
    .gte(COLUMNS.shiftDate, startISO)
    .lt(COLUMNS.shiftDate, endISO)
    .lt("end_time", windowEnd);

  const clockRecordsQuery = supabase
    .from(TABLES.clock)
    .select("user_id,clock_in_at,clock_out_at")
    .gte(COLUMNS.clockInDate, startISO)
    .lt(COLUMNS.clockInDate, endISO);

  const [pastSchedules, clockRecords] = await Promise.all([
    pastSchedulesQuery,
    clockRecordsQuery,
  ]);

  const failed = [pastSchedules, clockRecords].find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);

  let completed = 0;
  let missed = 0;

  for (const schedule of pastSchedules.data ?? []) {
    const clockedOut = (clockRecords.data ?? []).some(
      (record) => isMatch(record, schedule) && record.clock_out_at
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

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 dark:hover:-translate-y-0.5 dark:hover:border-border-hover dark:hover:shadow-lg dark:hover:shadow-black/40">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon size={18} className={accent} />
      </div>

      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-8 w-12 animate-pulse rounded bg-muted" />
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 dark:hover:border-border-hover dark:hover:shadow-lg dark:hover:shadow-black/40">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

const BAR_COLORS = {
  Completed: "#10B981",
  Missed: "#F43F5E",
  Leave: "#F59E0B",
  Tasks: "#2563eb",
};

export default function AnalyticsChart() {
  const { isDark } = useTheme();

  const [barData, setBarData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { start, end } = weekBoundaries(0);

        const [thisWeek, leave, tasks, trend] = await Promise.all([
          completedVsMissed(start, end),
          countBetween(TABLES.leave, COLUMNS.leaveDate, start, end),
          countBetween(
            TABLES.tasks,
            COLUMNS.taskDate,
            start,
            end,
            COLUMNS.taskStatus,
            "done"
          ),
          Promise.all(
            Array.from({ length: WEEKS }, (_, index) => WEEKS - 1 - index).map(
              async (weeksAgo) => {
                const bounds = weekBoundaries(weeksAgo);
                const stats = await completedVsMissed(bounds.start, bounds.end);

                return {
                  week: weeksAgo === 0 ? "This wk" : `${weeksAgo}w ago`,
                  completed: stats.completed,
                  missed: stats.missed,
                };
              }
            )
          ),
        ]);

        if (leave.error) throw new Error(leave.error.message);
        if (tasks.error) throw new Error(tasks.error.message);

        if (cancelled) return;

        setBarData([
          { name: "Completed", value: thisWeek.completed },
          { name: "Missed", value: thisWeek.missed },
          { name: "Leave", value: leave.count ?? 0 },
          { name: "Tasks", value: tasks.count ?? 0 },
        ]);

        setLineData(trend);
      } catch (caughtError) {
        if (!cancelled) setError(caughtError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Mirrors the --border / --muted-foreground / --card / --foreground token
  // values from globals.css - Recharts needs literal color strings, so we
  // keep these in sync with the design tokens instead of inventing new hex.
  const gridColor = isDark ? "#334155" : "#e4e4e7";
  const axisColor = isDark ? "#94a3b8" : "#71717a";
  const tooltipBackground = isDark ? "#111c2d" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e4e4e7";
  const tooltipText = isDark ? "#f8fafc" : "#171717";

  const stats = barData.reduce((acc, item) => {
    acc[item.name] = item.value;
    return acc;
  }, {});

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
        <div>
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
            Couldn't load analytics
          </p>
          <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Completed"
              value={stats.Completed ?? 0}
              icon={CheckCircle2}
              accent="text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              label="Missed"
              value={stats.Missed ?? 0}
              icon={XCircle}
              accent="text-rose-600 dark:text-rose-400"
            />
            <StatCard
              label="Leave Requests"
              value={stats.Leave ?? 0}
              icon={Umbrella}
              accent="text-amber-600 dark:text-amber-400"
            />
            <StatCard
              label="Tasks Completed"
              value={stats.Tasks ?? 0}
              icon={ClipboardCheck}
              accent="text-blue-600 dark:text-blue-400"
            />
          </>
        )}
      </div>

      <ChartCard title="This Week">
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisColor }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: axisColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBackground,
                  borderColor: tooltipBorder,
                  borderRadius: 12,
                  color: tooltipText,
                }}
                labelStyle={{ color: tooltipText, fontWeight: 600 }}
                itemStyle={{ color: tooltipText }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((entry) => (
                  <Cell key={entry.name} fill={BAR_COLORS[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={`Shifts Trend (${WEEKS} weeks)`}>
        {loading ? (
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: axisColor }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: axisColor }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBackground,
                  borderColor: tooltipBorder,
                  borderRadius: 12,
                  color: tooltipText,
                }}
                labelStyle={{ color: tooltipText, fontWeight: 600 }}
                itemStyle={{ color: tooltipText }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: axisColor }} />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="missed" stroke="#F43F5E" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
