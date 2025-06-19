"use client";

import EmptyState from "@/components/EmptyState";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Heart } from "lucide-react";

interface UserLikesProps {
  userId: string;
}

export default function UserLikes({ userId }: UserLikesProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "user-likes", userId],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(`/api/users/${userId}/likes`, {
          searchParams: pageParam ? { cursor: pageParam } : {},
        })
        .json<PostsPage>(),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const posts = data?.pages.flatMap((page) => page.posts) || [];

  if (status === "pending") {
    return <PostsLoadingSkeleton />;
  }

  if (status === "success" && !posts.length && !hasNextPage) {
    return (
      <EmptyState
        icon={<Heart className="size-16" />}
        title="No Liked Posts"
        description="You haven't liked any posts yet. Like posts you enjoy to see them here!"
        action={{
          label: "Explore Posts",
          href: "/",
        }}
      />
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-2 text-center text-destructive">
        <p>Unable to load liked posts</p>
        <p className="text-sm text-muted-foreground">
          Please check your connection and try refreshing the page
        </p>
      </div>
    );
  }

  return (
    <InfiniteScrollContainer
      className="space-y-5"
      onBottomReached={() => hasNextPage && !isFetching && fetchNextPage()}
    >
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <Loader2 className="mx-auto my-3 animate-spin" />}
    </InfiniteScrollContainer>
  );
}
