"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Search,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import RejectModal from "@/components/leave/RejectModal";

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

function EmployeeAvatar({ name }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
      {initials}
    </div>
  );
}

export default function ManagerReviewQueue({
  requests = [],
  onApprove,
  onReject,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [requestToReject, setRequestToReject] = useState(null);

  const filteredRequests = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !searchValue ||
        request.employee.toLowerCase().includes(searchValue) ||
        request.type.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        request.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, statusFilter]);

  const pendingCount = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const handleRejectConfirmation = (requestId, rejectionNote) => {
    onReject(requestId, rejectionNote);
    setRequestToReject(null);
  };

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#111c2d]">
        <div className="border-b border-gray-100 px-5 py-5 dark:border-slate-700">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <div className="flex items-center gap-2">
                <UserRound
                  size={19}
                  className="text-blue-600 dark:text-blue-400"
                />

                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Manager leave review
                </h2>

                {pendingCount > 0 && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                    {pendingCount} pending
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Review and decide employee leave requests.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search employee..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:ring-blue-950 sm:w-60"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-blue-950"
              >
                <option value="All">All statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CheckCircle2
              size={30}
              className="mx-auto text-emerald-400"
            />

            <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">
              No matching requests
            </p>

            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
              Try changing the employee search or status filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col justify-between gap-5 px-5 py-5 xl:flex-row xl:items-center"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <EmployeeAvatar name={request.employee} />

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {request.employee}
                      </p>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          statusStyles[request.status]
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm font-semibold text-gray-700 dark:text-slate-200">
                      {request.type}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      {request.range} · Submitted {request.submitted}
                    </p>

                    <p className="mt-2 max-w-2xl text-xs leading-5 text-gray-500 dark:text-slate-400">
                      {request.reason}
                    </p>

                    {request.rejectionNote && (
                      <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
                        Manager note: {request.rejectionNote}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {request.status === "Pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onApprove(request.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        <Check size={15} />
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => setRequestToReject(request)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/70 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <X size={15} />
                        Reject
                      </button>
                    </>
                  ) : request.status === "Approved" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 size={16} />
                      Approved
                    </span>
                  ) : request.status === "Rejected" ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                      <XCircle size={16} />
                      Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-slate-400">
                      <Clock size={16} />
                      Closed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <RejectModal
        request={requestToReject}
        isOpen={Boolean(requestToReject)}
        onClose={() => setRequestToReject(null)}
        onConfirm={handleRejectConfirmation}
      />
    </>
  );
}