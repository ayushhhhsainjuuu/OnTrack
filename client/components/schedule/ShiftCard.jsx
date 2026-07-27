"use client";

export default function ShiftCard({ shift }) {
  const isCancelled = shift.cancelled;
  const isToday = shift.today;

  return (
    <div
      className={`relative rounded-2xl border p-4 shadow-sm transition-colors ${
        isCancelled
          ? "border-red-300 bg-red-50/70 dark:border-red-800 dark:bg-red-950/25"
          : isToday
            ? "border-blue-400 bg-blue-50/70 ring-2 ring-blue-100 dark:border-blue-500 dark:bg-blue-950/35 dark:ring-blue-950"
            : "border-gray-200 bg-white dark:border-slate-700 dark:bg-[#111c2d]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={`text-xs font-medium ${
            isCancelled
              ? "text-red-500 dark:text-red-400"
              : "text-gray-400 dark:text-slate-500"
          }`}
        >
          {shift.day}
        </p>

        {isCancelled ? (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-700 dark:bg-red-950/60 dark:text-red-300">
            Cancelled
          </span>
        ) : (
          isToday && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              Today
            </span>
          )
        )}
      </div>

      <p
        className={`text-2xl font-bold ${
          isCancelled
            ? "text-red-500 line-through dark:text-red-400"
            : isToday
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-900 dark:text-white"
        }`}
      >
        {shift.date}
      </p>

      {shift.off ? (
        <div className="mt-6 text-center">
          <p className="text-lg text-gray-300 dark:text-slate-600">
            –
          </p>

          <p className="text-xs text-gray-400 dark:text-slate-500">
            Day off
          </p>
        </div>
      ) : (
        <div className={isCancelled ? "mt-3 opacity-70" : "mt-3"}>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              isCancelled
                ? "text-red-600 line-through dark:text-red-400"
                : shift.color
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />

            {shift.role}
          </span>

          <p
            className={`mt-2 text-sm font-medium ${
              isCancelled
                ? "text-red-600 line-through dark:text-red-400"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {shift.time}
          </p>

          <p
            className={`text-xs ${
              isCancelled
                ? "text-red-500 line-through dark:text-red-400"
                : "text-gray-500 dark:text-slate-400"
            }`}
          >
            {shift.end}
          </p>

          {isCancelled && shift.cancelReason && (
            <p className="mt-2 text-[11px] leading-4 text-red-600 dark:text-red-400">
              {shift.cancelReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}