"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Flag, UserX } from "lucide-react";
import ReportDialog from "./ReportDialog";
import BlockUserDialog from "./BlockUserDialog";

interface UserActionsMenuProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  className?: string;
}

export default function UserActionsMenu({
  user,
  className,
}: UserActionsMenuProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className={className}>
            <MoreHorizontal className="size-5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
            <span className="flex items-center gap-3 text-destructive">
              <Flag className="size-4" />
              Report User
            </span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowBlockDialog(true)}>
            <span className="flex items-center gap-3 text-destructive">
              <UserX className="size-4" />
              Block @{user.username}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        reportedUserId={user.id}
        reportedUsername={user.username}
      />

      <BlockUserDialog
        open={showBlockDialog}
        onOpenChange={setShowBlockDialog}
        userToBlock={user}
      />
    </>
  );
}
