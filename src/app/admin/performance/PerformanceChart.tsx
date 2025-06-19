"use client";

import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PerformanceData {
  timestamp: string;
  queryTime: number;
  activeUsers: number;
  cacheHitRate: number;
}

export default function PerformanceChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["performance-chart"],
    queryFn: () =>
      kyInstance
        .get("/api/admin/performance/metrics")
        .json<PerformanceData[]>(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="timestamp"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleTimeString()}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(value) => new Date(value).toLocaleString()}
            formatter={(value: number, name: string) => [
              `${value}${name === "queryTime" ? "ms" : name === "cacheHitRate" ? "%" : ""}`,
              name === "queryTime"
                ? "Query Time"
                : name === "activeUsers"
                  ? "Active Users"
                  : "Cache Hit Rate",
            ]}
          />
          <Line
            type="monotone"
            dataKey="queryTime"
            stroke="#8884d8"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="activeUsers"
            stroke="#82ca9d"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="cacheHitRate"
            stroke="#ffc658"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
