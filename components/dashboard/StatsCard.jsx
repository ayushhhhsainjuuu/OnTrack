import { ArrowUp, ArrowDown } from "lucide-react";

export default function StatsCard({ title, value, change, icon: Icon }) {
  const positive = change >= 0;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 flex items-start justify-between shadow-sm">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-semibold mt-1 text-gray-900">{value}</p>
        {change !== undefined && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${positive ? "text-green-600" : "text-red-600"}`}>
            {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(change)}% vs last week
          </p>
        )}
      </div>
      {Icon && (
        <div className="rounded-lg bg-gray-100 p-2">
          <Icon size={20} className="text-gray-500" />
        </div>
      )}
    </div>
  );
}