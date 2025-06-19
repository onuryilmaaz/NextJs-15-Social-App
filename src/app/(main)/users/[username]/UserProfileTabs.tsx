"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserData } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import UserPosts from "./UserPosts";
import UserLikes from "./UserLikes";
import UserMedia from "./UserMedia";

interface UserProfileTabsProps {
  user: UserData;
  currentTab: string;
  loggedInUserId: string;
}

export default function UserProfileTabs({
  user,
  currentTab,
  loggedInUserId,
}: UserProfileTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "posts") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }

    const newUrl = `/users/${user.username}${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(newUrl);
  };

  const isOwnProfile = user.id === loggedInUserId;

  return (
    <div className="space-y-5">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="likes">Likes</TabsTrigger>}
            {!isOwnProfile && <TabsTrigger value="about">About</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="posts" className="mt-0">
          <UserPosts userId={user.id} />
        </TabsContent>

        <TabsContent value="media" className="mt-0">
          <UserMedia userId={user.id} />
        </TabsContent>

        {isOwnProfile && (
          <TabsContent value="likes" className="mt-0">
            <UserLikes userId={user.id} />
          </TabsContent>
        )}

        {!isOwnProfile && (
          <TabsContent value="about" className="mt-0">
            <div className="rounded-2xl bg-card p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold">
                About {user.displayName}
              </h3>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Joined{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p>
                  {user._count.posts} posts • {user._count.followers} followers
                  • {user._count.following} following
                </p>
                {user.bio && (
                  <div className="mt-4">
                    <h4 className="mb-2 font-medium text-foreground">Bio</h4>
                    <p className="whitespace-pre-line">{user.bio}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
