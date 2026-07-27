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
  "rounded-2xl border border-gray-200 bg-white shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]";

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
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {formatMonthHeading(
              weekStart,
              weekEnd
            )}
          </h2>

          <p className="text-xs text-gray-500 dark:text-slate-400">
            Week of{" "}
            {formatShortDate(weekStart)} –{" "}
            {formatShortDate(weekEnd)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPreviousWeek}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            aria-label="Previous week"
            title="Previous week"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            onClick={onToday}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            Today
          </button>

          <button
            type="button"
            onClick={onNextWeek}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
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
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {activeShifts.length}
          </p>

          <p className="mt-1 text-sm font-medium text-gray-700 dark:text-slate-200">
            Active Shifts
          </p>

          <p className="text-xs text-gray-400 dark:text-slate-500">
            scheduled this week
          </p>
        </div>

        <div className={`${cardClass} p-5 text-center`}>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalHours}h
          </p>

          <p className="mt-1 text-sm font-medium text-gray-700 dark:text-slate-200">
            Total Hours
          </p>

          <p className="text-xs text-gray-400 dark:text-slate-500">
            excluding leave and cancellations
          </p>
        </div>

        <div className={`${cardClass} p-5 text-center`}>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {approvedLeaveDays.length}
          </p>

          <p className="mt-1 text-sm font-medium text-gray-700 dark:text-slate-200">
            Approved Leave
          </p>

          <p className="text-xs text-gray-400 dark:text-slate-500">
            {approvedLeaveLabels || "None"}
          </p>
        </div>

        <div className={`${cardClass} p-5 text-center`}>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {daysOff.length}
          </p>

          <p className="mt-1 text-sm font-medium text-gray-700 dark:text-slate-200">
            Days Off
          </p>

          <p className="text-xs text-gray-400 dark:text-slate-500">
            {dayOffLabels || "None"}
          </p>
        </div>

        <div className={`${cardClass} p-5 text-center`}>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {cancelledShifts.length}
          </p>

          <p className="mt-1 text-sm font-medium text-gray-700 dark:text-slate-200">
            Cancelled
          </p>

          <p className="text-xs text-gray-400 dark:text-slate-500">
            shifts this week
          </p>
        </div>
      </div>
    </div>
  );
}