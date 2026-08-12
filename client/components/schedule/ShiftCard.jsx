"use client";

export default function ShiftCard({ shift }) {
  const isCancelled = shift.cancelled;
  const isToday = shift.today;

  return (
    <div
      className={`relative rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-black/40 ${
        isCancelled
          ? "border-red-300 bg-red-50/70 dark:border-red-800 dark:bg-red-950/25"
          : isToday
            ? "border-blue-400 bg-blue-50/70 ring-2 ring-blue-100 dark:border-blue-500 dark:bg-blue-950/35 dark:ring-blue-950"
            : "border-border bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-xs font-semibold ${
            isCancelled
              ? "text-red-500 dark:text-red-400"
              : "text-muted-foreground"
          }`}
        >
          {shift.day}
        </p>

        {isCancelled ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-red-700 dark:bg-red-950/60 dark:text-red-300">
            Cancelled
          </span>
        ) : (
          isToday && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              Today
            </span>
          )
        )}
      </div>

      <p
        className={`text-2xl font-semibold ${
          isCancelled
            ? "text-red-500 line-through dark:text-red-400"
            : isToday
              ? "text-blue-600 dark:text-blue-400"
              : "text-foreground"
        }`}
      >
        {shift.date}
      </p>

      {shift.off ? (
        <div className="mt-6 text-center">
          <p className="text-lg text-muted-foreground">
            –
          </p>

          <p className="text-xs text-muted-foreground">
            Day off
          </p>
        </div>
      ) : (
        <div className={isCancelled ? "mt-3 opacity-70" : "mt-3"}>
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
              isCancelled
                ? "text-red-600 line-through dark:text-red-400"
                : shift.color
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />

            {shift.role}
          </span>

          <p
            className={`mt-2 text-sm font-semibold ${
              isCancelled
                ? "text-red-600 line-through dark:text-red-400"
                : "text-foreground"
            }`}
          >
            {shift.time}
          </p>

          <p
            className={`text-xs ${
              isCancelled
                ? "text-red-500 line-through dark:text-red-400"
                : "text-muted-foreground"
            }`}
          >
            {shift.end}
          </p>

          {isCancelled && shift.cancelReason && (
            <p className="mt-2 text-xs leading-4 text-red-600 dark:text-red-400">
              {shift.cancelReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}