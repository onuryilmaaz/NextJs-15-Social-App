import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonProps {
  className?: string;
}

export function PostSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "space-y-3 rounded-2xl border bg-card p-5 shadow-sm",
        className,
      )}
    >
      {/* User info */}
      <div className="flex items-center space-x-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="ml-auto h-6 w-6" />
      </div>

      {/* Post content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>

      {/* Media placeholder */}
      <Skeleton className="h-48 w-full rounded-lg" />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-8 w-8" />
      </div>
    </div>
  );
}

export function UserCardSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-center space-x-3 rounded-lg border bg-card p-4",
        className,
      )}
    >
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function CommentSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("flex space-x-3", className)}>
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  );
}

export function NotificationSkeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-start space-x-3 rounded-lg border bg-card p-4",
        className,
      )}
    >
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-6" />
    </div>
  );
}

export function ProfileHeaderSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Cover image */}
      <Skeleton className="h-32 w-full rounded-lg" />

      {/* Profile info */}
      <div className="flex items-start space-x-4">
        <Skeleton className="-mt-10 h-20 w-20 rounded-full border-4 border-background" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Stats */}
      <div className="flex space-x-6">
        <div className="space-y-1">
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-3 w-12" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-6 w-8" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-6 w-8" />
          <Skeleton className="w-18 h-3" />
        </div>
      </div>
    </div>
  );
}

export function HashtagSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
}

export function MessageSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("flex items-start space-x-3", className)}>
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-4 w-full max-w-xs rounded-lg" />
      </div>
    </div>
  );
}

export function SearchResultSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* User results */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        {Array.from({ length: 3 }).map((_, i) => (
          <UserCardSkeleton key={i} />
        ))}
      </div>

      {/* Post results */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        {Array.from({ length: 2 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function FeedSkeleton({
  className,
  count = 3,
}: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("space-y-5", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}

export function SidebarSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Trending topics */}
      <div className="rounded-2xl border bg-card p-5">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Who to follow */}
      <div className="rounded-2xl border bg-card p-5">
        <Skeleton className="mb-4 h-5 w-28" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
