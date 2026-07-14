"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

// --- date helpers -----------------------------------------------------------

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function getWeekDays(weekStart) {
  return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i)); // Mon–Fri
}

// --- hook -------------------------------------------------------------------

export function useSchedule(initialDate = new Date()) {
  const supabase = useMemo(() => createClient(), []);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(initialDate));
  const [shifts, setShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [leave, setLeave] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    serviceLine: "all", // all | janitorial | specialty
    staffRole: "all", // all | lead | cleaner | foreman
    accountId: "all",
  });

  const weekEnd = useMemo(() => addDays(weekStart, 5), [weekStart]);

  const fetchWeek = useCallback(async () => {
    setLoading(true);
    setError(null);

    const startIso = weekStart.toISOString();
    const endIso = weekEnd.toISOString();

    try {
      const [shiftRes, staffRes, leaveRes] = await Promise.all([
        supabase
          .from("shifts")
          .select(
            "id, employee_id, account_id, project_id, shift_type, service_line, title, starts_at, ends_at, recurring_assignment_id"
          )
          .gte("starts_at", startIso)
          .lt("starts_at", endIso)
          .order("starts_at", { ascending: true }),
        supabase
          .from("users")
          .select("id, full_name, role, service_line")
          .in("role", ["employee", "lead", "foreman", "cleaner"])
          .order("full_name", { ascending: true }),
        supabase
          .from("leave_requests")
          .select("id, employee_id, starts_at, ends_at, status")
          .eq("status", "approved")
          .lt("starts_at", endIso)
          .gte("ends_at", startIso),
      ]);

      if (shiftRes.error) throw shiftRes.error;
      if (staffRes.error) throw staffRes.error;
      if (leaveRes.error) throw leaveRes.error;

      setShifts(shiftRes.data ?? []);
      setStaff(staffRes.data ?? []);
      setLeave(leaveRes.data ?? []);
    } catch (err) {
      setError(err.message ?? "Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, [supabase, weekStart, weekEnd]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  // --- filtering ------------------------------------------------------------

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (filters.serviceLine !== "all" && s.service_line !== filters.serviceLine) {
        // keep staff who work across both lines (null service_line = both)
        if (s.service_line) return false;
      }
      if (filters.staffRole !== "all" && s.role !== filters.staffRole) return false;
      return true;
    });
  }, [staff, filters]);

  const filteredShifts = useMemo(() => {
    return shifts.filter((sh) => {
      if (filters.serviceLine !== "all" && sh.service_line !== filters.serviceLine) return false;
      if (filters.accountId !== "all" && sh.account_id !== filters.accountId) return false;
      return true;
    });
  }, [shifts, filters]);

  // shift lookup: `${employeeId}:${YYYY-MM-DD}` -> shift[]
  const shiftsByCell = useMemo(() => {
    const map = new Map();
    for (const sh of filteredShifts) {
      const day = new Date(sh.starts_at).toISOString().slice(0, 10);
      const key = `${sh.employee_id}:${day}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(sh);
    }
    return map;
  }, [filteredShifts]);

  // approved-leave lookup: `${employeeId}:${YYYY-MM-DD}` -> true
  const leaveByCell = useMemo(() => {
    const set = new Set();
    for (const lv of leave) {
      let d = new Date(lv.starts_at);
      const end = new Date(lv.ends_at);
      while (d <= end) {
        set.add(`${lv.employee_id}:${d.toISOString().slice(0, 10)}`);
        d = addDays(d, 1);
      }
    }
    return set;
  }, [leave]);

  // --- navigation -----------------------------------------------------------

  const goToPrevWeek = useCallback(() => setWeekStart((w) => addDays(w, -7)), []);
  const goToNextWeek = useCallback(() => setWeekStart((w) => addDays(w, 7)), []);
  const goToToday = useCallback(() => setWeekStart(startOfWeek(new Date())), []);

  return {
    weekStart,
    weekDays: getWeekDays(weekStart),
    staff: filteredStaff,
    shiftsByCell,
    leaveByCell,
    loading,
    error,
    filters,
    setFilters,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
    refetch: fetchWeek,
  };
}
