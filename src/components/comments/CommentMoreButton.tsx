import { CommentData } from "@/lib/types";
import { MoreHorizontal, Trash2, Flag, UserX } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import DeleteCommentDialog from "./DeleteCommentDialog";
import ReportDialog from "../ReportDialog";
import BlockUserDialog from "../BlockUserDialog";
import { useSession } from "@/app/(main)/SessionProvider";

interface CommentMoreButtonProps {
  comment: CommentData;
  className?: string;
}

export default function CommentMoreButton({
  comment,
  className,
}: CommentMoreButtonProps) {
  const { user } = useSession();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  const isOwner = user.id === comment.user.id;

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
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)}>
              <span className="flex items-center gap-3 text-destructive">
                <Trash2 className="size-4" />
                Delete
              </span>
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <span className="flex items-center gap-3 text-destructive">
                  <Flag className="size-4" />
                  Report Comment
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowBlockDialog(true)}>
                <span className="flex items-center gap-3 text-destructive">
                  <UserX className="size-4" />
                  Block @{comment.user.username}
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {isOwner && (
        <DeleteCommentDialog
          comment={comment}
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
        />
      )}

      {!isOwner && (
        <>
          <ReportDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            commentId={comment.id}
            reportedUserId={comment.user.id}
            contentPreview={comment.content}
            reportedUsername={comment.user.username}
          />
          <BlockUserDialog
            open={showBlockDialog}
            onOpenChange={setShowBlockDialog}
            userToBlock={{
              id: comment.user.id,
              username: comment.user.username,
              displayName: comment.user.displayName,
              avatarUrl: comment.user.avatarUrl,
            }}
          />
        </>
      )}
    </>
  );
}
