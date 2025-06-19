"use client";

import InfiniteScrollContainer from "@/components/InfiniteScrollContainer";
import Post from "@/components/posts/Post";
import PostsLoadingSkeleton from "@/components/posts/PostsLoadingSkeleton";
import EmptyState from "@/components/EmptyState";
import kyInstance from "@/lib/ky";
import { PostsPage } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, Hash } from "lucide-react";

interface HashtagFeedProps {
  hashtag: string;
  sortBy: string;
}

export default function HashtagFeed({ hashtag, sortBy }: HashtagFeedProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["hashtag-feed", hashtag, sortBy],
    queryFn: ({ pageParam }) =>
      kyInstance
        .get(`/api/hashtag/${hashtag}`, {
          searchParams: {
            sortBy,
            ...(pageParam ? { cursor: pageParam } : {}),
          },
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
        icon={<Hash className="size-16" />}
        title={`No posts found for #${hashtag}`}
        description="Be the first to post with this hashtag!"
        action={{
          label: "Create Post",
          onClick: () => {
            const postEditor = document.querySelector(".ProseMirror");
            if (postEditor) {
              postEditor.scrollIntoView({ behavior: "smooth" });
              (postEditor as HTMLElement).focus();
            }
          },
        }}
      />
    );
  }

  if (status === "error") {
    return (
      <p className="text-center text-destructive">
        An error occurred while loading posts.
      </p>
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
