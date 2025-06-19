"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function AnalyticsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: AnalyticsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div
      className={cn(
        "rounded-2xl bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="size-5 text-muted-foreground" />}
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
          </div>
          <p className="text-3xl font-bold tracking-tight">
            {formatValue(value)}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
              trend.isPositive
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            )}
          >
            <span
              className={cn(
                "text-sm",
                trend.isPositive ? "text-green-600" : "text-red-600",
              )}
            >
              {trend.isPositive ? "↗" : "↘"}
            </span>
            {Math.abs(trend.value).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}
