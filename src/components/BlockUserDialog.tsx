"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { getErrorMessage } from "@/lib/errors";
import LoadingButton from "./LoadingButton";
import { UserX, Shield, AlertTriangle } from "lucide-react";
import UserAvatar from "./UserAvatar";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToBlock: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  isBlocked?: boolean;
}

export default function BlockUserDialog({
  open,
  onOpenChange,
  userToBlock,
  isBlocked = false,
}: BlockUserDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (isBlocked) {
        return kyInstance.delete(`/api/users/${userToBlock.id}/block`);
      } else {
        return kyInstance.post(`/api/users/${userToBlock.id}/block`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-block-status"] });
      queryClient.invalidateQueries({ queryKey: ["blocked-users"] });

      toast({
        title: isBlocked ? "User Unblocked" : "User Blocked",
        description: isBlocked
          ? `You have unblocked @${userToBlock.username}. You can now see their content and they can interact with you.`
          : `You have blocked @${userToBlock.username}. You won't see their content and they can't interact with you.`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error blocking/unblocking user:", error);
      toast({
        variant: "destructive",
        description: getErrorMessage(error),
      });
    },
  });

  const handleClose = () => {
    if (!mutation.isPending) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBlocked ? (
              <Shield className="size-5 text-green-600" />
            ) : (
              <UserX className="size-5 text-destructive" />
            )}
            {isBlocked ? "Unblock" : "Block"} User
          </DialogTitle>
          <DialogDescription>
            {isBlocked
              ? "This will allow this user to interact with you again."
              : "This will prevent this user from interacting with you."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
            <UserAvatar avatarUrl={userToBlock.avatarUrl} size={40} />
            <div>
              <p className="font-medium">{userToBlock.displayName}</p>
              <p className="text-sm text-muted-foreground">
                @{userToBlock.username}
              </p>
            </div>
          </div>

          {!isBlocked && (
            <div className="space-y-3">
              <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-4 text-red-600" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <p className="font-medium">
                      What happens when you block someone:
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      <li>
                        They won&apos;t be able to see your posts or profile
                      </li>
                      <li>You won&apos;t see their posts or comments</li>
                      <li>They can&apos;t follow you or send you messages</li>
                      <li>You&apos;ll both be unfollowed from each other</li>
                      <li>They won&apos;t be notified that you blocked them</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
                <div className="flex items-start gap-2">
                  <Shield className="mt-0.5 size-4 text-blue-600" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    <p className="font-medium">You can unblock them anytime</p>
                    <p className="mt-1">
                      Visit your blocked users list in settings to manage your
                      blocked accounts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isBlocked && (
            <div className="rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
              <div className="flex items-start gap-2">
                <Shield className="mt-0.5 size-4 text-green-600" />
                <div className="text-sm text-green-800 dark:text-green-200">
                  <p className="font-medium">
                    Unblocking will restore normal interactions
                  </p>
                  <p className="mt-1">
                    This user will be able to see your content and interact with
                    you again. You&apos;ll also be able to see their content.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <LoadingButton
            onClick={() => mutation.mutate()}
            loading={mutation.isPending}
            variant={isBlocked ? "default" : "destructive"}
          >
            {isBlocked ? "Unblock User" : "Block User"}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
