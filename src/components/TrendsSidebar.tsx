import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { Loader2, TrendingUp, Users, FileText } from "lucide-react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { Suspense, lazy } from "react";
import FollowButton from "./FollowButton";
import UserAvatar from "./UserAvatar";
import UserTooltip from "./UserTooltip";
import ClientOnly from "./ClientOnly";

// Use ClientOnly instead of dynamic imports to prevent webpack issues
const ActivityFeed = lazy(() => import("./realtime/ActivityFeed"));
const TrendingTopicsClient = lazy(() => import("./TrendingTopicsClient"));
const OnlineUsersLazy = lazy(() =>
  import("./realtime/LiveUserStatus").then((mod) => ({
    default: mod.OnlineUsers,
  })),
);

export default function TrendsSidebar() {
  return (
    <div className="sticky top-[5.25rem] hidden h-fit w-72 flex-none space-y-5 md:block lg:w-80">
      <ClientOnly fallback={<Loader2 className="mx-auto animate-spin" />}>
        <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
          <OnlineUsersLazy />
        </Suspense>
      </ClientOnly>

      <ClientOnly fallback={<Loader2 className="mx-auto animate-spin" />}>
        <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
          <ActivityFeed />
        </Suspense>
      </ClientOnly>

      <ClientOnly fallback={<Loader2 className="mx-auto animate-spin" />}>
        <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
          <TrendingTopicsClient />
        </Suspense>
      </ClientOnly>

      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <WhoToFollow />
      </Suspense>

      <Suspense fallback={<Loader2 className="mx-auto animate-spin" />}>
        <QuickStats />
      </Suspense>
    </div>
  );
}

async function WhoToFollow() {
  const { user } = await validateRequest();

  if (!user) return null;

  const usersToFollow = await prisma.user.findMany({
    where: {
      NOT: {
        id: user.id,
      },
      followers: {
        none: {
          followerId: user.id,
        },
      },
    },
    select: getUserDataSelect(user.id),
    take: 5,
  });

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="text-xl font-bold">Who to follow</div>
      {usersToFollow.map((user) => (
        <div key={user.id} className="flex items-center justify-between gap-3">
          <UserTooltip user={user}>
            <Link
              href={`/users/${user.username}`}
              className="flex items-center gap-3"
            >
              <UserAvatar avatarUrl={user.avatarUrl} className="flex-none" />
              <div>
                <p className="line-clamp-1 break-all font-semibold hover:underline">
                  {user.displayName}
                </p>
                <p className="line-clamp-1 break-all text-muted-foreground">
                  @{user.username}
                </p>
              </div>
            </Link>
          </UserTooltip>
          <FollowButton
            userId={user.id}
            initialState={{
              followers: user._count.followers,
              isFollowedByUser: user.followers.some(
                ({ followerId }) => followerId === user.id,
              ),
            }}
          />
        </div>
      ))}
    </div>
  );
}

async function QuickStats() {
  // Get platform stats
  const [totalUsers, totalPosts, totalComments] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.comment.count(),
  ]);

  return (
    <div className="space-y-5 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <TrendingUp className="size-5 text-primary" />
        <div className="text-xl font-bold">Platform Stats</div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <span className="text-sm">Total Users</span>
          </div>
          <span className="font-semibold">{formatNumber(totalUsers)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <span className="text-sm">Total Posts</span>
          </div>
          <span className="font-semibold">{formatNumber(totalPosts)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" />
            <span className="text-sm">Comments</span>
          </div>
          <span className="font-semibold">{formatNumber(totalComments)}</span>
        </div>
      </div>

      <Link
        href="/analytics"
        className="block text-center text-sm text-primary hover:underline"
      >
        View detailed analytics →
      </Link>
    </div>
  );
}
