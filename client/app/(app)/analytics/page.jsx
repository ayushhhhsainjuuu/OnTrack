import AnalyticsChart from "@/components/analytics/AnalyticsChart";

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Insights
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-foreground">
          Analytics
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Shift completion, leave, and task activity across your workplace.
        </p>
      </div>

      <AnalyticsChart />
    </div>
  );
}
