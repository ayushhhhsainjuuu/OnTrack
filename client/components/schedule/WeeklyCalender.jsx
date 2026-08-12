"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import ShiftCard from "@/components/schedule/ShiftCard";

function formatShortDate(date) {
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
  });
}

function formatMonthHeading(startDate, endDate) {
  const sameMonth =
    startDate.getMonth() === endDate.getMonth() &&
    startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth) {
    return startDate.toLocaleDateString("en-CA", {
      month: "long",
      year: "numeric",
    });
  }

  const startLabel = startDate.toLocaleDateString(
    "en-CA",
    {
      month: "short",
      year: "numeric",
    }
  );

  const endLabel = endDate.toLocaleDateString(
    "en-CA",
    {
      month: "short",
      year: "numeric",
    }
  );

  return `${startLabel} – ${endLabel}`;
}

const cardClass =
  "rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 dark:hover:-translate-y-0.5 dark:hover:border-border-hover dark:hover:shadow-lg dark:hover:shadow-black/40";

export default function WeeklyCalender({
  week = [],
  weekStart,
  weekEnd,
  onPreviousWeek,
  onNextWeek,
  onToday,
}) {
  /*
    Approved leave is not an active shift.

    It must not:
    - increase active shift count
    - increase total weekly hours
    - count as a cancelled shift
    - count as a regular day off
  */
  const activeShifts = week.filter(
    (shift) =>
      !shift.off &&
      !shift.cancelled &&
      !shift.approvedLeave
  );

  const approvedLeaveDays = week.filter(
    (shift) => shift.approvedLeave
  );

  const cancelledShifts = week.filter(
    (shift) =>
      shift.cancelled &&
      !shift.approvedLeave
  );

  const daysOff = week.filter(
    (shift) =>
      shift.off &&
      !shift.approvedLeave
  );

  const totalHours = activeShifts.reduce(
    (total, shift) =>
      total + Number(shift.hours || 0),
    0
  );

  const dayOffLabels = daysOff
    .map((shift) =>
      shift.fullDate.toLocaleDateString("en-CA", {
        weekday: "short",
      })
    )
    .join(" & ");

  const approvedLeaveLabels = approvedLeaveDays
    .map((shift) =>
      shift.fullDate.toLocaleDateString("en-CA", {
        weekday: "short",
      })
    )
    .join(" & ");

  if (!weekStart || !weekEnd) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {formatMonthHeading(
              weekStart,
              weekEnd
            )}
          </h2>

          <p className="text-xs text-muted-foreground">
            Week of{" "}
            {formatShortDate(weekStart)} –{" "}
            {formatShortDate(weekEnd)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPreviousWeek}
            className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Previous week"
            title="Previous week"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={onToday}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Today
          </button>

          <button
            type="button"
            onClick={onNextWeek}
            className="rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Next week"
            title="Next week"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {week.map((shift) => (
          <ShiftCard
            key={
              shift.fullDate?.toISOString() ||
              `${shift.day}-${shift.date}`
            }
            shift={shift}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className={`${cardClass} p-5 text-center`}>
          <p className="text-2xl font-semibold text-foreground">
            {activeShifts.length}
          </p>

          <p className="mt-1 text-sm font-semibold text-foreground">
            Active Shifts
          </p>

          <p className="text-xs text-muted-foreground">
            scheduled this week
          </p>
        </div>

        <div className={`${cardClass} p-5 text-center`}>
          <p className="text-2xl font-semibold text-foreground">
            {totalHours}h
          </p>

          <p className="mt-1 text-sm font-semibold text-foreground">
            Total Hours
          </p>

          <p className="text-xs text-muted-foreground">
            excluding leave and cancellations
          </p>
        </div>

        <div className={`${cardClass} p-5 text-center`}>
          <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {approvedLeaveDays.length}
          </p>

          <p className="mt-1 text-sm font-semibold text-foreground">
            Approved Leave
          </p>

          <p className="text-xs text-muted-foreground">
            {approvedLeaveLabels || "None"}
          </p>
        </div>

        <div className={`${cardClass} p-5 text-center`}>
          <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
            {daysOff.length}
          </p>

          <p className="mt-1 text-sm font-semibold text-foreground">
            Days Off
          </p>

          <p className="text-xs text-muted-foreground">
            {dayOffLabels || "None"}
          </p>
        </div>

        <div className={`${cardClass} p-5 text-center`}>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {cancelledShifts.length}
          </p>

          <p className="mt-1 text-sm font-semibold text-foreground">
            Cancelled
          </p>

          <p className="text-xs text-muted-foreground">
            shifts this week
          </p>
        </div>
      </div>
    </div>
  );
}