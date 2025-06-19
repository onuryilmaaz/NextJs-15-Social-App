"use client";

import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import Post from "@/components/posts/Post";
import UserCard from "@/components/UserCard";
import EmptyState from "@/components/EmptyState";
import { PostData, UserData } from "@/lib/types";
import { Hash, TrendingUp, Users, Sparkles } from "lucide-react";
import Link from "next/link";

interface DiscoverFeedProps {
  tab: string;
  category: string;
}

interface TrendingTopic {
  keyword: string;
  postCount: number;
  growth: number;
}

interface DiscoverData {
  posts?: PostData[];
  users?: UserData[];
  topics?: TrendingTopic[];
}

export default function DiscoverFeed({ tab, category }: DiscoverFeedProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["discover", tab, category],
    queryFn: () =>
      kyInstance
        .get("/api/discover", {
          searchParams: { tab, category },
        })
        .json<DiscoverData>(),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<Sparkles className="size-16" />}
        title="Something went wrong"
        description="Unable to load discover content. Please try again later."
      />
    );
  }

  if (tab === "people" && data?.users) {
    if (data.users.length === 0) {
      return (
        <EmptyState
          icon={<Users className="size-16" />}
          title="No users found"
          description="Try exploring different categories or check back later."
        />
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {data.users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    );
  }

  if (tab === "topics" && data?.topics) {
    if (data.topics.length === 0) {
      return (
        <EmptyState
          icon={<Hash className="size-16" />}
          title="No trending topics"
          description="No trending topics found for this category."
        />
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.topics.map((topic) => (
          <Link
            key={topic.keyword}
            href={`/hashtag/${topic.keyword.replace("#", "")}`}
            className="group rounded-2xl bg-card p-5 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Hash className="size-6 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-semibold transition-colors group-hover:text-primary">
                  {topic.keyword}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {topic.postCount.toLocaleString()} posts
                </p>

                {topic.growth > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <TrendingUp className="size-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">
                      +{topic.growth}% growth
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  // Posts view (trending, recent)
  if (data?.posts) {
    if (data.posts.length === 0) {
      return (
        <EmptyState
          icon={<Sparkles className="size-16" />}
          title="No posts found"
          description="Try exploring different categories or check back later for new content."
        />
      );
    }

    return (
      <div className="space-y-5">
        {data.posts.map((post) => (
          <Post key={post.id} post={post} />
        ))}
      </div>
    );
  }

  return (
    <EmptyState
      icon={<Sparkles className="size-16" />}
      title="No content available"
      description="No content found for the selected filters."
    />
  );
}
