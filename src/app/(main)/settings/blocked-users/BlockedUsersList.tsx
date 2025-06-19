"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import LoadingButton from "@/components/LoadingButton";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import BlockUserDialog from "@/components/BlockUserDialog";
import EmptyState from "@/components/EmptyState";
import { UserX, Shield } from "lucide-react";
import { Loader2 } from "lucide-react";

interface BlockedUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
}

export default function BlockedUsersList() {
  const [userToUnblock, setUserToUnblock] = useState<BlockedUser | null>(null);
  const { toast } = useToast();

  const {
    data: blockedUsers,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["blocked-users"],
    queryFn: () => kyInstance.get("/api/users/blocked").json<BlockedUser[]>(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-card p-8 text-center">
        <p className="text-destructive">
          Failed to load blocked users. Please try again.
        </p>
      </div>
    );
  }

  if (!blockedUsers?.length) {
    return (
      <EmptyState
        icon={<Shield className="size-16" />}
        title="No Blocked Users"
        description="You haven't blocked any users yet. Blocked users won't be able to see your content or interact with you."
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {blockedUsers.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <UserAvatar avatarUrl={user.avatarUrl} size={40} />
              <div>
                <p className="font-semibold">{user.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  @{user.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                Blocked
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserToUnblock(user)}
                className="text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                <UserX className="mr-2 size-4" />
                Unblock
              </Button>
            </div>
          </div>
        ))}
      </div>

      {userToUnblock && (
        <BlockUserDialog
          open={!!userToUnblock}
          onOpenChange={(open) => !open && setUserToUnblock(null)}
          userToBlock={userToUnblock}
          isBlocked={true}
        />
      )}
    </>
  );
}
