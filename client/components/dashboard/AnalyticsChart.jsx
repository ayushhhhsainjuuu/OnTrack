"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function AnalyticsChart({ data = [] }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(
        document.documentElement.getAttribute("data-theme") === "dark"
      );
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const gridColor = isDark ? "#334155" : "#e5e7eb";
  const axisColor = isDark ? "#94a3b8" : "#6b7280";
  const tooltipBackground = isDark ? "#111c2d" : "#ffffff";
  const tooltipBorder = isDark ? "#334155" : "#e5e7eb";
  const tooltipText = isDark ? "#f8fafc" : "#111827";

  return (
    <Card className="border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-slate-700 dark:bg-[#111c2d]">
      <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">
        Hours Logged (This Week)
      </h2>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient
                id="hoursFill"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor="#6366f1"
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor="#6366f1"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
            />

            <XAxis
              dataKey="day"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor }}
            />

            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBackground,
                borderColor: tooltipBorder,
                borderRadius: "12px",
                color: tooltipText,
              }}
              labelStyle={{
                color: tooltipText,
                fontWeight: 600,
              }}
              itemStyle={{
                color: tooltipText,
              }}
            />

            <Area
              type="monotone"
              dataKey="hours"
              stroke="#6366f1"
              fill="url(#hoursFill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}