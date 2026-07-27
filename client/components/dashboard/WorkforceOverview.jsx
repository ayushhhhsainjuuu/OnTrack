const statusStyles = {
  "On Shift": "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  "On Leave": "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  Off: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300",
};

export default function WorkforceOverview({ workers = [] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
      <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
        Workforce Overview
      </h2>

      <div className="space-y-2">
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="flex items-center justify-between border-b border-gray-100 py-2 last:border-0 dark:border-slate-700"
          >
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {worker.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {worker.role} · {worker.site}
              </p>
            </div>

            <span className={`rounded-full px-2 py-1 text-xs ${statusStyles[worker.status] || ""}`}>
              {worker.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
