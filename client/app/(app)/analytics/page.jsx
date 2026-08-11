import AnalyticsChart from "@/components/analytics/AnalyticsChart";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Insights
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          Analytics
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Shift completion, leave, and task activity across your workplace.
        </p>
      </div>

      <AnalyticsChart />
    </div>
  );
}
