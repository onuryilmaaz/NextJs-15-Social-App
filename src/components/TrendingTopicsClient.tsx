"use client";

import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface TrendingTopic {
  hashtag: string;
  count: number;
  score: number;
}

export default function TrendingTopicsClient() {
  const {
    data: trendingTopics,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["trending-topics"],
    queryFn: () =>
      kyInstance.get("/api/trending-topics").json<TrendingTopic[]>(),
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
    staleTime: 1 * 60 * 1000, // Consider data stale after 1 minute
  });

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xl font-bold">Trending topics</div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 w-8 p-0"
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : trendingTopics && trendingTopics.length > 0 ? (
        trendingTopics.map(({ hashtag, count }) => {
          const title = hashtag.split("#")[1];

          return (
            <Link key={title} href={`/hashtag/${title}`} className="block">
              <p
                className="line-clamp-1 break-all font-semibold hover:underline"
                title={hashtag}
              >
                {hashtag}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatNumber(count)} {count === 1 ? "post" : "posts"}
              </p>
            </Link>
          );
        })
      ) : (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No trending topics yet. Start a conversation with hashtags!
        </div>
      )}
    </div>
  );
}
