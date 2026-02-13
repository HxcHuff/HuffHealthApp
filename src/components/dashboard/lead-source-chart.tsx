"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { CHART_COLORS } from "@/lib/constants";

interface LeadSourceChartProps {
  data: { source: string; count: number }[];
}

export function LeadSourceChart({ data }: LeadSourceChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-sm text-gray-400">
        No lead data yet
      </div>
    );
  }

  // Sort descending and take top 8
  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="source"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          width={110}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        />
        <Bar
          dataKey="count"
          name="Leads"
          fill={CHART_COLORS.primary}
          radius={[0, 4, 4, 0]}
          maxBarSize={24}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
