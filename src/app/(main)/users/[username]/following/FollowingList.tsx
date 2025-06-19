"use client";

import EmptyState from "@/components/EmptyState";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import UserCard from "@/components/UserCard";
import kyInstance from "@/lib/ky";
import { FollowingPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";

interface FollowingListProps {
  userId: string;
}

export default function FollowingList({ userId }: FollowingListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["following", userId],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(`/api/users/${userId}/following`, {
          searchParams: pageParam ? { cursor: pageParam } : {},
        })
        .json<FollowingPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const following = data?.pages.flatMap((page) => page.following) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !following.length && !hasNextPage) {
    return (
      <EmptyState
        icon={<UserPlus className="size-16" />}
        title="Not Following Anyone"
        description="This user isn't following anyone yet. Discover interesting people to follow!"
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
        <p>Unable to load following list</p>
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
      {following.map((follow) => (
        <UserCard key={follow.followingId} user={follow.following} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
