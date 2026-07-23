const statusStyles = {
  "On Shift": "bg-green-100 text-green-700",
  "On Leave": "bg-amber-100 text-amber-700",
  "Off": "bg-gray-100 text-gray-600",
};

export default function WorkforceOverview({ workers = [] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold mb-4 text-gray-900">Workforce Overview</h2>
      <div className="space-y-2">
        {workers.map((w) => (
          <div key={w.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{w.name}</p>
              <p className="text-xs text-gray-500">{w.role} · {w.site}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[w.status] || ""}`}>
              {w.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}