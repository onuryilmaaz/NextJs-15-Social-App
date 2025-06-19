"use client";

import EmptyState from "@/components/EmptyState";
import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Image as ImageIcon } from "lucide-react";

interface UserMediaProps {
  userId: string;
}

export default function UserMedia({ userId }: UserMediaProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["post-feed", "user-media", userId],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(`/api/users/${userId}/media`, {
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
        icon={<ImageIcon className="size-16" />}
        title="No Media Posts"
        description="This user hasn't shared any posts with photos or videos yet."
        action={{
          label: "View All Posts",
          onClick: () => {
            // Navigate to posts tab
            const url = new URL(window.location.href);
            url.searchParams.delete("tab");
            window.history.pushState({}, "", url.toString());
            window.location.reload();
          },
        }}
      />
    );
  }

  if (status === "error") {
    return (
      <div className="space-y-2 text-center text-destructive">
        <p>Unable to load media posts</p>
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
