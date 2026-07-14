"use client";

import { useSchedule } from "./hooks/useSchedule";
import WeeklyCalendar from "./components/WeeklyCalendar";
import { ChevronLeft, ChevronRight, CalendarPlus, Repeat } from "lucide-react";

const WEEK_FMT = { month: "short", day: "numeric" };

export default function SchedulePage() {
  const {
    weekStart,
    weekDays,
    staff,
    shiftsByCell,
    leaveByCell,
    loading,
    error,
    filters,
    setFilters,
    goToPrevWeek,
    goToNextWeek,
    goToToday,
    refetch,
  } = useSchedule();

  const weekEnd = weekDays[weekDays.length - 1];
  const rangeLabel = `${weekStart.toLocaleDateString([], WEEK_FMT)} – ${weekEnd.toLocaleDateString(
    [],
    { ...WEEK_FMT, year: "numeric" }
  )}`;

  const setFilter = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  // Wire these to your shift-editor / pattern-editor modals.
  const handleShiftClick = (shift) => console.log("edit shift", shift);
  const handleEmptyCell = (cell) => console.log("add shift", cell);
  const openProjectShiftForm = () => console.log("open project shift form");
  const openRecurringForm = () => console.log("open recurring assignment form");

  return (
    <div className="space-y-4">
      {/* header: week nav + add actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevWeek}
            className="rounded-md border border-border p-1.5 hover:bg-muted"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-[15px] font-medium">{rangeLabel}</p>
          <button
            onClick={goToNextWeek}
            className="rounded-md border border-border p-1.5 hover:bg-muted"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={goToToday}
            className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
          >
            Today
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openProjectShiftForm}
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] hover:bg-muted"
          >
            <CalendarPlus className="h-4 w-4" /> Project shift
          </button>
          <button
            onClick={openRecurringForm}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-[13px] text-white hover:bg-emerald-800"
          >
            <Repeat className="h-4 w-4" /> Recurring
          </button>
        </div>
      </div>

      {/* filters + legend */}
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={filters.serviceLine}
          onChange={setFilter("serviceLine")}
          className="h-8 rounded-md border border-border bg-background px-2 text-[13px]"
        >
          <option value="all">All service lines</option>
          <option value="janitorial">Janitorial</option>
          <option value="specialty">Specialty</option>
        </select>
        <select
          value={filters.staffRole}
          onChange={setFilter("staffRole")}
          className="h-8 rounded-md border border-border bg-background px-2 text-[13px]"
        >
          <option value="all">All staff</option>
          <option value="lead">Leads</option>
          <option value="cleaner">Cleaners</option>
          <option value="foreman">Foremen</option>
        </select>

        <div className="flex-1" />

        <div className="flex gap-3.5">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-emerald-400" /> Recurring
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-blue-400" /> One-off
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}{" "}
          <button onClick={refetch} className="underline">
            Retry
          </button>
        </div>
      )}

      <WeeklyCalendar
        weekDays={weekDays}
        staff={staff}
        shiftsByCell={shiftsByCell}
        leaveByCell={leaveByCell}
        loading={loading}
        onShiftClick={handleShiftClick}
        onEmptyCellClick={handleEmptyCell}
      />

      <p className="text-xs text-muted-foreground">
        Click any block to edit; recurring blocks prompt “this shift only” or “whole pattern.”
        Empty cells are click-to-add.
      </p>
    </div>
  );
}
