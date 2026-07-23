"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Umbrella, Plus, CheckCircle2, Clock, CalendarPlus } from "lucide-react";
import { supabase } from "@/lib/supabase";

const week = [
  { day: "MON", date: 9,  role: "Server", color: "text-blue-600",   time: "9:00 AM", end: "to 5:00 PM" },
  { day: "TUE", date: 10, role: "Server", color: "text-blue-600",   time: "10:00 AM", end: "to 6:00 PM", today: true },
  { day: "WED", date: 11, role: "Server", color: "text-blue-600",   time: "9:00 AM", end: "to 5:00 PM" },
  { day: "THU", date: 12, off: true },
  { day: "FRI", date: 13, role: "Server", color: "text-blue-600",   time: "10:00 AM", end: "to 6:00 PM" },
  { day: "SAT", date: 14, role: "Lead",   color: "text-purple-600", time: "11:00 AM", end: "to 7:00 PM" },
  { day: "SUN", date: 15, off: true },
];

const balances = [
  { label: "Annual",   remaining: 12, used: 5, total: 17, bar: "bg-blue-600",    pct: 29 },
  { label: "Sick",     remaining: 8,  used: 2, total: 10, bar: "bg-emerald-500", pct: 20 },
  { label: "Personal", remaining: 2,  used: 1, total: 3,  bar: "bg-amber-500",   pct: 33 },
];

const requests = [
  { type: "Annual Leave", range: "Jun 20 – Jun 21 · 2 days", submitted: "Jun 5", status: "Approved" },
  { type: "Sick Leave",   range: "Jun 18 · 1 day",           submitted: "Jun 9", status: "Pending" },
  { type: "Annual Leave", range: "Jul 4 – Jul 7 · 4 days",   submitted: "Jun 8", status: "Pending" },
];

const CAN_CREATE_SCHEDULE_ROLES = ["foreman", "lead"];

export default function SchedulePage() {
  const [tab, setTab] = useState("schedule");
  const [canCreateSchedule, setCanCreateSchedule] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const role = (
        data?.user?.user_metadata?.role ||
        data?.user?.app_metadata?.role ||
        ""
      ).toLowerCase();
      setCanCreateSchedule(CAN_CREATE_SCHEDULE_ROLES.includes(role));
    });
  }, []);

  const tabs = canCreateSchedule ? ["schedule", "leave", "manage"] : ["schedule", "leave"];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Schedule & Leave</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">Schedule & Leave</h1>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition ${
              tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "schedule" ? "My Schedule" : t === "leave" ? "Leave" : "Create Schedule"}
          </button>
        ))}
      </div>

      {tab === "schedule" ? (
        <>
          {/* Week header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">June 2025</h2>
              <p className="text-xs text-gray-500">Week of Jun 9 – Jun 15</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronLeft size={16} /></button>
              <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Today</button>
              <button className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"><ChevronRight size={16} /></button>
            </div>
          </div>

          {/* Days */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {week.map((d) => (
              <div
                key={d.date}
                className={`rounded-2xl border p-4 ${d.today ? "border-blue-300 bg-blue-50/50" : "border-gray-200 bg-white"} shadow-sm`}
              >
                <p className="text-xs font-medium text-gray-400">{d.day}</p>
                <p className={`text-2xl font-bold ${d.today ? "text-blue-600" : "text-gray-900"}`}>{d.date}</p>
                {d.off ? (
                  <div className="mt-6 text-center">
                    <p className="text-gray-300 text-lg">–</p>
                    <p className="text-xs text-gray-400">Day off</p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${d.color}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" /> {d.role}
                    </span>
                    <p className="text-sm font-medium text-gray-900 mt-2">{d.time}</p>
                    <p className="text-xs text-gray-500">{d.end}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { v: "5", l: "Shifts This Week", s: "out of 7 days", c: "text-gray-900" },
              { v: "40h", l: "Total Hours", s: "scheduled", c: "text-gray-900" },
              { v: "2", l: "Days Off", s: "Thu & Sun", c: "text-purple-600" },
            ].map((x, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
                <p className={`text-3xl font-bold ${x.c}`}>{x.v}</p>
                <p className="text-sm font-medium text-gray-700 mt-1">{x.l}</p>
                <p className="text-xs text-gray-400">{x.s}</p>
              </div>
            ))}
          </div>
        </>
      ) : tab === "leave" ? (
        <>
          {/* Leave balances */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {balances.map((b) => (
              <div key={b.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{b.label}</p>
                  <Umbrella size={16} className="text-gray-300" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{b.remaining}</p>
                <p className="text-xs text-gray-500">days remaining</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${b.pct}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">{b.used} used of {b.total}</p>
              </div>
            ))}
          </div>

          {/* Requests */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Leave Requests</h2>
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition">
              <Plus size={16} /> New Request
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
            {requests.map((r, i) => {
              const approved = r.status === "Approved";
              return (
                <div key={i} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${approved ? "bg-emerald-100" : "bg-amber-100"}`}>
                      {approved ? <CheckCircle2 size={16} className="text-emerald-600" /> : <Clock size={16} className="text-amber-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{r.type}</p>
                      <p className="text-xs text-gray-500">{r.range}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">Submitted {r.submitted}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <ManageSchedules />
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

function ManageSchedules() {
  const [form, setForm] = useState({
    user_id: "",
    account_id: "",
    project_id: "",
    start_time: "",
    end_time: "",
    notes: "",
  });
  const [schedules, setSchedules] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  async function loadSchedules() {
    try {
      const res = await fetch("/api/schedules");
      const json = await res.json();
      if (res.ok) setSchedules(json.schedules || []);
    } catch {
      // ignore load errors, form still usable
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ loading: true, error: "", success: "" });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setStatus({ loading: false, error: "You must be logged in.", success: "" });
      return;
    }

    const payload = {
      user_id: form.user_id.trim(),
      created_by: user.id,
      account_id: form.account_id.trim() || undefined,
      project_id: form.project_id.trim() || undefined,
      start_time: form.start_time,
      end_time: form.end_time,
      notes: form.notes.trim() || undefined,
    };

    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setStatus({ loading: false, error: json.error || "Failed to create schedule.", success: "" });
        return;
      }

      setStatus({ loading: false, error: "", success: "Schedule created." });
      setForm({ user_id: "", account_id: "", project_id: "", start_time: "", end_time: "", notes: "" });
      loadSchedules();
    } catch {
      setStatus({ loading: false, error: "Network error, please try again.", success: "" });
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Create Schedule</h2>
        <p className="text-xs text-gray-500">
          Only Foreman/Lead users can create schedules. Requires either an account or project ID.
        </p>

        {status.error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{status.error}</div>
        )}
        {status.success && (
          <div className="rounded-lg bg-emerald-50 text-emerald-700 text-sm px-3 py-2">{status.success}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Assignee user ID"
            value={form.user_id}
            onChange={(v) => setForm((f) => ({ ...f, user_id: v }))}
            placeholder="UUID of user being scheduled"
            required
          />
          <Field
            label="Account ID (optional)"
            value={form.account_id}
            onChange={(v) => setForm((f) => ({ ...f, account_id: v }))}
            placeholder="UUID"
          />
          <Field
            label="Project ID (optional)"
            value={form.project_id}
            onChange={(v) => setForm((f) => ({ ...f, project_id: v }))}
            placeholder="UUID"
          />
          <Field
            label="Notes (optional)"
            value={form.notes}
            onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
            placeholder="Shift notes"
          />
          <Field
            label="Start time"
            type="datetime-local"
            value={form.start_time}
            onChange={(v) => setForm((f) => ({ ...f, start_time: v }))}
            required
          />
          <Field
            label="End time"
            type="datetime-local"
            value={form.end_time}
            onChange={(v) => setForm((f) => ({ ...f, end_time: v }))}
            required
          />
        </div>

        <button
          type="submit"
          disabled={status.loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition disabled:opacity-50"
        >
          <CalendarPlus size={16} /> {status.loading ? "Creating..." : "Create Schedule"}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-3">All Schedules</h2>
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-100">
          {schedules.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-500">No schedules yet.</p>
          )}
          {schedules.map((s) => (
            <div key={s.id} className="px-5 py-4 text-sm">
              <p className="font-semibold text-gray-900">
                {s.status} · {new Date(s.start_time).toLocaleString()} → {new Date(s.end_time).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                User: {s.user_id}
                {s.account_id ? ` · Account: ${s.account_id}` : ""}
                {s.project_id ? ` · Project: ${s.project_id}` : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}