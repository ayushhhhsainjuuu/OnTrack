"use client";

function formatRange(startsAt, endsAt) {
  const opts = { hour: "numeric", minute: "2-digit" };
  const start = new Date(startsAt).toLocaleTimeString([], opts);
  const end = new Date(endsAt).toLocaleTimeString([], opts);
  return `${start}–${end}`.replace(/:00/g, "");
}

export default function ShiftCard({ shift, onClick }) {
  const isRecurring = shift.shift_type === "recurring";

  const styles = isRecurring
    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
    : "bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/60";

  return (
    <button
      type="button"
      onClick={() => onClick?.(shift)}
      className={`w-full rounded-md px-2 py-1.5 text-left transition-colors ${styles}`}
      title={isRecurring ? "Recurring shift" : "One-off shift"}
    >
      <p className="truncate text-[11px] font-medium leading-tight">
        {shift.title ?? "Shift"}
      </p>
      <p className="mt-0.5 text-[10px] leading-tight opacity-80">
        {formatRange(shift.starts_at, shift.ends_at)}
      </p>
    </button>
  );
}
