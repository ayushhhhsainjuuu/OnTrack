const statusStyles = {
  "On Shift": "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  "On Leave": "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  Off: "bg-muted text-muted-foreground",
};

export default function WorkforceOverview({ workers = [] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors">
      <h2 className="mb-4 font-semibold text-foreground">
        Workforce Overview
      </h2>

      <div className="space-y-2">
        {workers.map((worker) => (
          <div
            key={worker.id}
            className="flex items-center justify-between border-b border-border py-2 last:border-0"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">
                {worker.name}
              </p>
              <p className="text-xs text-muted-foreground">
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
