import { ArrowUp, ArrowDown } from "lucide-react";

export default function StatsCard({
  title,
  value,
  change,
  icon: Icon,
}) {
  const positive = change >= 0;

  return (
    <div className="flex items-start justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-colors">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
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
        <div className="rounded-lg bg-muted p-2">
          <Icon size={20} className="text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
