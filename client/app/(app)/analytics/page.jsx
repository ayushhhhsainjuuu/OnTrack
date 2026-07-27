import AIQueryBox from "@/components/analytics/AIQueryBox";
import AnalyticsChart from "@/components/analytics/AnalyticsChart";

export default function AnalyticsPage() {
  return (
    <div style={{ display: "grid", gap: 32, padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Analytics</h1>
      <AIQueryBox />
      <AnalyticsChart />
    </div>
  );
}