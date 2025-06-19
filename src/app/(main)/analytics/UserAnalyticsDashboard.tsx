"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Eye,
  Heart,
  MessageCircle,
  Users,
  FileText,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";
import AnalyticsCard from "@/components/analytics/AnalyticsCard";
import EngagementChart from "@/components/analytics/EngagementChart";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import kyInstance from "@/lib/ky";
import { UserAnalyticsData, EngagementInsights } from "@/lib/analytics";

interface UserAnalyticsDashboardProps {
  userId: string;
}

export default function UserAnalyticsDashboard({
  userId,
}: UserAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("30");

  // Fetch user analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["user-analytics", userId],
    queryFn: () =>
      kyInstance.get(`/api/analytics/user/${userId}`).json<UserAnalyticsData>(),
  });

  // Fetch engagement insights
  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["engagement-insights", userId, timeRange],
    queryFn: () =>
      kyInstance
        .get(`/api/analytics/engagement/${userId}`, {
          searchParams: { days: timeRange },
        })
        .json<EngagementInsights>(),
  });

  if (analyticsLoading || insightsLoading) {
    return (
      <div className="space-y-5">
        {/* Loading skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center">
        <div className="text-muted-foreground">
          Unable to load analytics data. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Performance Overview</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 3 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsCard
          title="Profile Views"
          value={analytics.profileViews}
          icon={Eye}
          description="Total profile visits"
        />

        <AnalyticsCard
          title="Likes Received"
          value={analytics.likesReceived}
          icon={Heart}
          description="Total likes on your content"
          trend={{
            value: analytics.growthRate,
            isPositive: analytics.growthRate >= 0,
          }}
        />

        <AnalyticsCard
          title="Comments Created"
          value={analytics.commentsCreated}
          icon={MessageCircle}
          description="Your engagement with others"
        />

        <AnalyticsCard
          title="Followers"
          value={analytics.followersGained}
          icon={Users}
          description="People following you"
          trend={{
            value: analytics.growthRate,
            isPositive: analytics.growthRate >= 0,
          }}
        />

        <AnalyticsCard
          title="Posts Created"
          value={analytics.postsCount}
          icon={FileText}
          description="Total content published"
        />

        <AnalyticsCard
          title="Engagement Rate"
          value={`${analytics.engagementRate.toFixed(1)}%`}
          icon={Target}
          description="Average engagement per post"
          trend={{
            value: analytics.engagementRate - 5, // Compare to platform average
            isPositive: analytics.engagementRate > 5,
          }}
        />

        <AnalyticsCard
          title="Average Post Likes"
          value={analytics.averagePostLikes.toFixed(1)}
          icon={TrendingUp}
          description="Likes per post on average"
        />

        <AnalyticsCard
          title="Most Active Hour"
          value={
            analytics.mostActiveHour ? `${analytics.mostActiveHour}:00` : "N/A"
          }
          icon={Clock}
          description="Your peak activity time"
        />
      </div>

      {/* Engagement Timeline Chart */}
      {insights && (
        <EngagementChart data={insights.timeline} className="col-span-full" />
      )}

      {/* Content Performance Insights */}
      {insights && insights.contentPerformance.length > 0 && (
        <div className="rounded-2xl bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Content Performance</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {insights.contentPerformance.map((content) => (
              <div key={content.type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize">
                    {content.type} Content
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {content.totalContent} pieces
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{
                      width: `${Math.min((content.averageEngagement / 10) * 100, 100)}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {content.averageEngagement.toFixed(1)}% avg engagement
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly Activity Pattern */}
      {insights && (
        <div className="rounded-2xl bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Activity Pattern</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            Your engagement activity throughout the day
          </p>

          <div className="grid grid-cols-12 gap-1">
            {insights.hourlyActivity.map((hour) => {
              const maxActivity = Math.max(
                ...insights.hourlyActivity.map((h) => h.activity),
              );
              const intensity =
                maxActivity > 0 ? (hour.activity / maxActivity) * 100 : 0;

              return (
                <div
                  key={hour.hour}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full rounded-sm bg-blue-500 transition-all hover:bg-blue-600"
                    style={{
                      height: `${Math.max(intensity, 4)}px`,
                      opacity:
                        intensity > 0 ? Math.max(intensity / 100, 0.2) : 0.1,
                    }}
                    title={`${hour.hour}:00 - ${hour.activity} activities`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {hour.hour}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            Hours (0-23) • Hover for details
          </div>
        </div>
      )}

      {/* Growth Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Growth Insights</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Follower Growth</span>
              <span
                className={`text-sm font-medium ${
                  analytics.growthRate >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {analytics.growthRate >= 0 ? "+" : ""}
                {analytics.growthRate.toFixed(1)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Engagement Quality</span>
              <span className="text-sm font-medium">
                {analytics.engagementRate > 8
                  ? "Excellent"
                  : analytics.engagementRate > 5
                    ? "Good"
                    : analytics.engagementRate > 2
                      ? "Average"
                      : "Needs Work"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Content Consistency</span>
              <span className="text-sm font-medium">
                {analytics.postsCount > 30
                  ? "Very Active"
                  : analytics.postsCount > 10
                    ? "Active"
                    : analytics.postsCount > 3
                      ? "Moderate"
                      : "Low Activity"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold">Recommendations</h3>
          <div className="space-y-3 text-sm">
            {analytics.engagementRate < 5 && (
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <div className="font-medium text-blue-900 dark:text-blue-200">
                  Boost Engagement
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  Try posting more interactive content or asking questions
                </div>
              </div>
            )}

            {analytics.postsCount < 10 && (
              <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                <div className="font-medium text-green-900 dark:text-green-200">
                  Post More Content
                </div>
                <div className="text-green-700 dark:text-green-300">
                  Regular posting helps maintain audience engagement
                </div>
              </div>
            )}

            {analytics.mostActiveHour && (
              <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                <div className="font-medium text-purple-900 dark:text-purple-200">
                  Optimal Timing
                </div>
                <div className="text-purple-700 dark:text-purple-300">
                  Post around {analytics.mostActiveHour}:00 for best engagement
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
