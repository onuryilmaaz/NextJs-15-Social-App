"use client";

import EmptyState from "@/components/EmptyState";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import UserCard from "@/components/UserCard";
import kyInstance from "@/lib/ky";
import { FollowersPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";

interface FollowersListProps {
  userId: string;
}

export default function FollowersList({ userId }: FollowersListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["followers", userId],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(`/api/users/${userId}/followers-list`, {
          searchParams: pageParam ? { cursor: pageParam } : {},
        })
        .json<FollowersPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const followers = data?.pages.flatMap((page) => page.followers) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !followers.length && !hasNextPage) {
    return (
      <EmptyState
        icon={<Users className="size-16" />}
        title="No Followers Yet"
        description="This user doesn't have any followers yet. Be the first to follow them!"
        action={{
          label: "Discover Users",
          href: "/search",
        }}
      />
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-2 text-center text-destructive">
        <p>Unable to load followers</p>
        <p className="text-sm text-muted-foreground">
          Please check your connection and try refreshing the page
        </p>
      </div>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-4"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {followers.map((follow) => (
        <UserCard key={follow.followerId} user={follow.follower} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
