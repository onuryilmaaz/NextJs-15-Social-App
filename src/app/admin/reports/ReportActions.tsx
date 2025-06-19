"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  ShieldCheck,
  ShieldX,
  Trash2,
  UserX,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import kyInstance from "@/lib/ky";
import { ReportWithRelations } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";

interface ReportActionsProps {
  report: ReportWithRelations;
}

type Action =
  | "dismiss"
  | "approve"
  | "delete-content"
  | "suspend-user"
  | "ban-user";

export default function ReportActions({ report }: ReportActionsProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: ({ action, notes }: { action: Action; notes?: string }) => {
      setIsSubmitting(true);
      return kyInstance.post(`/api/admin/reports/${report.id}/action`, {
        json: { action, notes },
      });
    },
    onSuccess: () => {
      toast({ title: "Action completed successfully." });
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        description: getErrorMessage(error),
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleAction = (action: Action, notes?: string) => {
    mutation.mutate({ action, notes });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isSubmitting}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Report Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleAction("approve")}>
          <ShieldCheck className="mr-2 size-4 text-green-500" />
          Approve Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction("dismiss")}>
          <ShieldX className="mr-2 size-4 text-muted-foreground" />
          Dismiss Report
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>Content & User</DropdownMenuLabel>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => handleAction("delete-content")}
        >
          <Trash2 className="mr-2 size-4" />
          Delete Content
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() =>
            handleAction(
              "suspend-user",
              "Suspended for 7 days based on report.",
            )
          }
        >
          <UserX className="mr-2 size-4" />
          Suspend User (7 days)
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={() => handleAction("ban-user")}
        >
          <UserX className="mr-2 size-4" />
          Ban User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
