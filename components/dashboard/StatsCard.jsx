import { ArrowUp, ArrowDown } from "lucide-react";

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
}) {
  const positive = change >= 0;

  return (
    <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
      <div>
        <p className="text-sm text-gray-500 dark:text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
          {value}
        </p>

        {change !== undefined && (
          <p
            className={`mt-2 flex items-center gap-1 text-xs ${
              positive
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(change)}% vs last week
          </p>
        )}
      </div>

      {Icon && (
        <div className="rounded-lg bg-gray-100 p-2 dark:bg-slate-700">
          <Icon size={20} className="text-gray-500 dark:text-slate-300" />
        </div>
      )}
    </div>
  );
}
