"use client";

import { useRouter } from "next/navigation";
import { Hash, TrendingUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";

interface HashtagHeaderProps {
  hashtag: string;
  sortBy: string;
}

interface HashtagStats {
  postCount: number;
  isFollowing?: boolean;
}

export default function HashtagHeader({ hashtag, sortBy }: HashtagHeaderProps) {
  const router = useRouter();

  const { data: stats } = useQuery({
    queryKey: ["hashtag-stats", hashtag],
    queryFn: () =>
      kyInstance.get(`/api/hashtag/${hashtag}/stats`).json<HashtagStats>(),
  });

  const handleSortChange = (newSortBy: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("sortBy", newSortBy);
    router.push(url.pathname + url.search);
  };

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <Hash className="size-8 text-primary" />
          </div>

          <div className="space-y-2">
            <div>
              <h1 className="text-3xl font-bold">#{hashtag}</h1>
              <p className="text-muted-foreground">
                {stats?.postCount
                  ? `${stats.postCount.toLocaleString()} posts`
                  : "Loading..."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                Trending
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm">
            Follow #{hashtag}
          </Button>
        </div>
      </div>
    </div>
  );
}
