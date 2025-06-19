"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { UserData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";
import FollowButton from "./FollowButton";
import Linkify from "./Linkify";
import UserAvatar from "./UserAvatar";

interface UserCardProps {
  user: UserData;
}

export default function UserCard({ user }: UserCardProps) {
  const { user: loggedInUser } = useSession();

  const followerInfo = {
    followers: user._count.followers,
    isFollowedByUser: user.followers.some(
      ({ followerId }) => followerId === loggedInUser.id,
    ),
  };

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <Link href={`/users/${user.username}`}>
          <UserAvatar avatarUrl={user.avatarUrl} size={60} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link href={`/users/${user.username}`} className="group">
                <h3 className="truncate text-lg font-semibold group-hover:underline">
                  {user.displayName}
                </h3>
                <p className="truncate text-muted-foreground">
                  @{user.username}
                </p>
              </Link>

              <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {formatNumber(user._count.posts)} post
                  {user._count.posts !== 1 ? "s" : ""}
                </span>
                <span>
                  {formatNumber(user._count.followers)} follower
                  {user._count.followers !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {user.id !== loggedInUser.id && (
              <FollowButton userId={user.id} initialState={followerInfo} />
            )}
          </div>

          {user.bio && (
            <div className="mt-3">
              <Linkify>
                <p className="line-clamp-2 break-words text-sm">{user.bio}</p>
              </Linkify>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
