"use client";

import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock,
  History,
  XCircle,
} from "lucide-react";

const statusStyles = {
  Pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  Approved:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  Rejected:
    "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
  Cancelled:
    "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300",
};

function StatusIcon({ status }) {
  if (status === "Approved") {
    return (
      <CheckCircle2
        size={17}
        className="text-emerald-600 dark:text-emerald-400"
      />
    );
  }

  if (status === "Rejected") {
    return (
      <XCircle
        size={17}
        className="text-red-600 dark:text-red-400"
      />
    );
  }

  if (status === "Cancelled") {
    return (
      <Ban
        size={17}
        className="text-gray-500 dark:text-slate-400"
      />
    );
  }

  return (
    <Clock
      size={17}
      className="text-amber-600 dark:text-amber-400"
    />
  );
}

function RequestCard({ request, onCancel }) {
  const canCancel = request.status === "Pending";

  return (
    <div className="flex flex-col justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            request.status === "Approved"
              ? "bg-emerald-100 dark:bg-emerald-950/50"
              : request.status === "Rejected"
                ? "bg-red-100 dark:bg-red-950/50"
                : request.status === "Cancelled"
                  ? "bg-gray-100 dark:bg-slate-700"
                  : "bg-amber-100 dark:bg-amber-950/50"
          }`}
        >
          <StatusIcon status={request.status} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`text-sm font-semibold ${
                request.status === "Cancelled"
                  ? "text-gray-500 line-through dark:text-slate-500"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {request.type}
            </p>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                statusStyles[request.status]
              }`}
            >
              {request.status}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={12} />
              {request.range}
            </span>

            <span>
              Submitted {request.submitted}
            </span>
          </div>

          {request.reason && (
            <p className="mt-2 max-w-xl text-xs leading-5 text-gray-500 dark:text-slate-400">
              {request.reason}
            </p>
          )}

          {request.rejectionNote && (
            <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
              Manager note: {request.rejectionNote}
            </p>
          )}
        </div>
      </div>

      {canCancel && (
        <button
          type="button"
          onClick={() => onCancel(request.id)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/70 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <XCircle size={14} />
          Cancel request
        </button>
      )}
    </div>
  );
}

export default function LeaveTable({
  requests = [],
  onCancel,
}) {
  const pendingRequests = requests.filter(
    (request) => request.status === "Pending"
  );

  const pastRequests = requests.filter(
    (request) => request.status !== "Pending"
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111c2d]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Clock
              size={18}
              className="text-amber-500"
            />

            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Pending requests
            </h2>
          </div>

          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Requests waiting for manager review.
          </p>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <CheckCircle2
              size={26}
              className="mx-auto text-emerald-400"
            />

            <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
              No pending requests
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              You do not currently have any requests
              waiting for review.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {pendingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onCancel={onCancel}
              />
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111c2d]">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <History
              size={18}
              className="text-blue-500"
            />

            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Leave history
            </h2>
          </div>

          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            Approved, rejected, and cancelled requests.
          </p>
        </div>

        {pastRequests.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <History
              size={26}
              className="mx-auto text-gray-300 dark:text-slate-600"
            />

            <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
              No leave history
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {pastRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onCancel={onCancel}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}