"use client";

import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface EngagementTimelineData {
  date: string;
  likes: number;
  comments: number;
  follows: number;
  posts: number;
}

interface EngagementChartProps {
  data: EngagementTimelineData[];
  className?: string;
}

export default function EngagementChart({
  data,
  className,
}: EngagementChartProps) {
  if (!data.length) {
    return (
      <div className={cn("rounded-2xl bg-card p-6", className)}>
        <div className="text-center text-muted-foreground">
          No engagement data available
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => d.likes + d.comments + d.follows + d.posts),
  );

  const getBarHeight = (value: number) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  const getTotalEngagement = (item: EngagementTimelineData) => {
    return item.likes + item.comments + item.follows + item.posts;
  };

  return (
    <div className={cn("rounded-2xl bg-card p-6", className)}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold">Engagement Timeline</h3>
        <p className="text-sm text-muted-foreground">
          Daily engagement activity over time
        </p>
      </div>

      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span>Likes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span>Comments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500"></div>
            <span>Follows</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-orange-500"></div>
            <span>Posts</span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative h-64">
          <div className="flex h-full items-end justify-between gap-1">
            {data.map((item, index) => {
              const total = getTotalEngagement(item);
              const likesPercent = total > 0 ? (item.likes / total) * 100 : 0;
              const commentsPercent =
                total > 0 ? (item.comments / total) * 100 : 0;
              const followsPercent =
                total > 0 ? (item.follows / total) * 100 : 0;
              const postsPercent = total > 0 ? (item.posts / total) * 100 : 0;

              return (
                <div
                  key={item.date}
                  className="group relative flex flex-col items-center"
                  style={{
                    height: `${getBarHeight(total)}%`,
                    minHeight: "4px",
                  }}
                >
                  {/* Stacked Bar */}
                  <div
                    className="w-8 rounded-t-sm bg-blue-500 transition-all group-hover:opacity-80"
                    style={{ height: `${likesPercent}%` }}
                  ></div>
                  <div
                    className="w-8 bg-green-500 transition-all group-hover:opacity-80"
                    style={{ height: `${commentsPercent}%` }}
                  ></div>
                  <div
                    className="w-8 bg-purple-500 transition-all group-hover:opacity-80"
                    style={{ height: `${followsPercent}%` }}
                  ></div>
                  <div
                    className="w-8 rounded-b-sm bg-orange-500 transition-all group-hover:opacity-80"
                    style={{ height: `${postsPercent}%` }}
                  ></div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block">
                    <div className="rounded-lg bg-gray-900 p-2 text-xs text-white shadow-lg">
                      <div className="whitespace-nowrap">
                        {format(parseISO(item.date), "MMM dd")}
                      </div>
                      <div className="mt-1 space-y-1">
                        <div>Likes: {item.likes}</div>
                        <div>Comments: {item.comments}</div>
                        <div>Follows: {item.follows}</div>
                        <div>Posts: {item.posts}</div>
                        <div className="border-t border-gray-600 pt-1">
                          Total: {total}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date label */}
                  <div className="absolute top-full mt-2 text-xs text-muted-foreground">
                    {index % 7 === 0
                      ? format(parseISO(item.date), "MM/dd")
                      : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 text-center md:grid-cols-4">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {data.reduce((sum, item) => sum + item.likes, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Likes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {data.reduce((sum, item) => sum + item.comments, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Comments</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {data.reduce((sum, item) => sum + item.follows, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Follows</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {data.reduce((sum, item) => sum + item.posts, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Posts</div>
          </div>
        </div>
      </div>
    </div>
  );
}
