"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import { PostData } from "@/lib/types";
import { MoreHorizontal, Trash2, Edit, Flag, UserX } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import DeletePostDialog from "./DeletePostDialog";
import EditPostDialog from "./EditPostDialog";
import ReportDialog from "../ReportDialog";
import BlockUserDialog from "../BlockUserDialog";

interface PostMoreButtonProps {
  post: PostData;
  className?: string;
}

export default function PostMoreButton({
  post,
  className,
}: PostMoreButtonProps) {
  const { user } = useSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const isOwner = user.id === post.user.id;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className={className}>
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {isOwner ? (
            <>
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <span className="flex items-center gap-3">
                  <Edit className="size-4" />
                  Edit
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
                <span className="flex items-center gap-3 text-destructive">
                  <Trash2 className="size-4" />
                  Delete
                </span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <span className="flex items-center gap-3 text-destructive">
                  <Flag className="size-4" />
                  Report Post
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowBlockDialog(true)}>
                <span className="flex items-center gap-3 text-destructive">
                  <UserX className="size-4" />
                  Block @{post.user.username}
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {isOwner && (
        <>
          <EditPostDialog
            post={post}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
          />
          <DeletePostDialog
            post={post}
            open={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
          />
        </>
      )}

      {!isOwner && (
        <>
          <ReportDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            postId={post.id}
            reportedUserId={post.user.id}
            contentPreview={post.content}
            reportedUsername={post.user.username}
          />
          <BlockUserDialog
            open={showBlockDialog}
            onOpenChange={setShowBlockDialog}
            userToBlock={{
              id: post.user.id,
              username: post.user.username,
              displayName: post.user.displayName,
              avatarUrl: post.user.avatarUrl,
            }}
          />
        </>
      )}
    </>
  );
}
