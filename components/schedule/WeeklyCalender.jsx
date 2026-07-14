"use client";

import ShiftCard from "./ShiftCard";

const DAY_FMT = { weekday: "short", day: "numeric" };

export default function WeeklyCalendar({
  weekDays,
  staff,
  shiftsByCell,
  leaveByCell,
  loading,
  onShiftClick,
  onEmptyCellClick,
}) {
  const cols = `120px repeat(${weekDays.length}, minmax(0, 1fr))`;

  if (loading) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
        Loading schedule…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* header row */}
      <div
        className="grid border-b border-border bg-muted/40"
        style={{ gridTemplateColumns: cols }}
      >
        <div className="px-3 py-2.5 text-xs text-muted-foreground">Staff</div>
        {weekDays.map((d) => (
          <div
            key={d.toISOString()}
            className="border-l border-border px-2 py-2.5 text-xs text-muted-foreground"
          >
            {d.toLocaleDateString([], DAY_FMT)}
          </div>
        ))}
      </div>

      {/* staff rows */}
      {staff.length === 0 && (
        <div className="px-3 py-8 text-center text-sm text-muted-foreground">
          No staff match these filters.
        </div>
      )}

      {staff.map((person, idx) => (
        <div
          key={person.id}
          className={`grid min-h-[62px] ${
            idx < staff.length - 1 ? "border-b border-border" : ""
          }`}
          style={{ gridTemplateColumns: cols }}
        >
          <div className="flex items-center px-3 py-2 text-xs text-foreground">
            {person.full_name}
          </div>

          {weekDays.map((day) => {
            const dayKey = day.toISOString().slice(0, 10);
            const cellKey = `${person.id}:${dayKey}`;
            const cellShifts = shiftsByCell.get(cellKey) ?? [];
            const onLeave = leaveByCell.has(cellKey);

            if (onLeave) {
              return (
                <div
                  key={dayKey}
                  className="flex items-center justify-center border-l border-border"
                >
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                    On leave
                  </span>
                </div>
              );
            }

            return (
              <div
                key={dayKey}
                className="border-l border-border p-1.5"
                onClick={
                  cellShifts.length === 0
                    ? () => onEmptyCellClick?.({ employee: person, date: day })
                    : undefined
                }
                role={cellShifts.length === 0 ? "button" : undefined}
              >
                <div className="flex flex-col gap-1">
                  {cellShifts.map((shift) => (
                    <ShiftCard key={shift.id} shift={shift} onClick={onShiftClick} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
