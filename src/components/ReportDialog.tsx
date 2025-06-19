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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { ReportType } from "@prisma/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import kyInstance from "@/lib/ky";
import { getErrorMessage } from "@/lib/errors";
import LoadingButton from "./LoadingButton";
import { AlertTriangle, Shield, Flag } from "lucide-react";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserId?: string;
  postId?: string;
  commentId?: string;
  contentPreview?: string;
  reportedUsername?: string;
}

const REPORT_TYPES = [
  {
    value: ReportType.SPAM,
    label: "Spam",
    description: "Unwanted repetitive content or promotional material",
    icon: <Flag className="size-4" />,
  },
  {
    value: ReportType.HARASSMENT,
    label: "Harassment",
    description: "Bullying, intimidation, or targeted abuse",
    icon: <AlertTriangle className="size-4" />,
  },
  {
    value: ReportType.HATE_SPEECH,
    label: "Hate Speech",
    description: "Content that promotes hatred against individuals or groups",
    icon: <Shield className="size-4" />,
  },
  {
    value: ReportType.INAPPROPRIATE_CONTENT,
    label: "Inappropriate Content",
    description: "Content that violates community standards",
    icon: <AlertTriangle className="size-4" />,
  },
  {
    value: ReportType.IMPERSONATION,
    label: "Impersonation",
    description: "Someone pretending to be someone else",
    icon: <Flag className="size-4" />,
  },
  {
    value: ReportType.COPYRIGHT,
    label: "Copyright Violation",
    description: "Unauthorized use of copyrighted material",
    icon: <Shield className="size-4" />,
  },
  {
    value: ReportType.VIOLENCE,
    label: "Violence",
    description: "Threats or promotion of violence",
    icon: <AlertTriangle className="size-4" />,
  },
  {
    value: ReportType.SELF_HARM,
    label: "Self-harm",
    description: "Content promoting self-harm or suicide",
    icon: <AlertTriangle className="size-4" />,
  },
  {
    value: ReportType.MISINFORMATION,
    label: "Misinformation",
    description: "False or misleading information",
    icon: <Flag className="size-4" />,
  },
  {
    value: ReportType.OTHER,
    label: "Other",
    description: "Something else that violates our community guidelines",
    icon: <Flag className="size-4" />,
  },
];

export default function ReportDialog({
  open,
  onOpenChange,
  reportedUserId,
  postId,
  commentId,
  contentPreview,
  reportedUsername,
}: ReportDialogProps) {
  const [selectedType, setSelectedType] = useState<ReportType | "">("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedType || !reason.trim()) {
        throw new Error("Please select a report type and provide a reason");
      }

      return kyInstance.post("/api/reports", {
        json: {
          type: selectedType,
          reason: reason.trim(),
          description: description.trim() || undefined,
          reportedUserId,
          postId,
          commentId,
        },
      });
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description:
          "Thank you for reporting this content. We'll review it and take appropriate action.",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      console.error("Error submitting report:", error);
      toast({
        variant: "destructive",
        description: getErrorMessage(error),
      });
    },
  });

  const resetForm = () => {
    setSelectedType("");
    setReason("");
    setDescription("");
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      onOpenChange(false);
      resetForm();
    }
  };

  const getReportTarget = () => {
    if (postId) return "post";
    if (commentId) return "comment";
    if (reportedUserId) return "user";
    return "content";
  };

  const selectedReportType = REPORT_TYPES.find(
    (type) => type.value === selectedType,
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-5 text-destructive" />
            Report {getReportTarget()}
          </DialogTitle>
          <DialogDescription>
            Help us keep our community safe by reporting content that violates
            our guidelines.
            {reportedUsername &&
              ` Reporting content from @${reportedUsername}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {contentPreview && (
            <div className="rounded-lg bg-muted p-3">
              <Label className="text-sm font-medium">Content:</Label>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                {contentPreview}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="report-type">What&apos;s the issue?</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason for reporting" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReportType && (
              <p className="text-xs text-muted-foreground">
                {selectedReportType.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Specific reason (required)</Label>
            <Textarea
              id="reason"
              placeholder="Please provide specific details about why you're reporting this..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <div className="text-right text-xs text-muted-foreground">
              {reason.length}/500
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Any additional context that might help our review..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={2}
            />
            <div className="text-right text-xs text-muted-foreground">
              {description.length}/1000
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/30">
            <div className="flex items-start gap-2">
              <Shield className="mt-0.5 size-4 text-blue-600" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium">Your report is anonymous</p>
                <p className="mt-1">
                  The person you&apos;re reporting won&apos;t know you submitted
                  this report. Our moderation team will review it according to
                  our community guidelines.
                </p>
              </div>
            </div>
          </div>
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
            disabled={!selectedType || !reason.trim()}
            variant="destructive"
          >
            Submit Report
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
