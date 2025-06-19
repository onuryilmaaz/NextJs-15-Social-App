"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReportWithRelations } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "@/components/UserAvatar";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import ReportActions from "./ReportActions";

interface ReportsTableProps {
  reports: ReportWithRelations[];
}

export default function ReportsTable({ reports }: ReportsTableProps) {
  if (reports.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        No reports in this category.
      </p>
    );
  }

  const getContentTypeAndLink = (report: ReportWithRelations) => {
    if (report.post) {
      return {
        type: "Post",
        link: `/posts/${report.postId}`,
        content: report.post.content,
      };
    }
    if (report.comment) {
      return {
        type: "Comment",
        link: `/posts/${report.comment.postId}#comment-${report.commentId}`,
        content: report.comment.content,
      };
    }
    if (report.reported) {
      return {
        type: "User Profile",
        link: `/users/${report.reported.username}`,
        content: `Profile of ${report.reported.displayName}`,
      };
    }
    return { type: "Unknown", link: "#", content: "N/A" };
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Reported Content</TableHead>
          <TableHead>Reporter</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => {
          const { type, link, content } = getContentTypeAndLink(report);
          return (
            <TableRow key={report.id}>
              <TableCell>
                <Link href={link} target="_blank" className="hover:underline">
                  <Badge variant="secondary">{type}</Badge>
                  <p className="mt-1 line-clamp-2 max-w-xs">{content}</p>
                </Link>
                {report.reported && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Reported:
                    </span>
                    <UserAvatar
                      size={20}
                      avatarUrl={report.reported.avatarUrl}
                    />
                    <Link
                      href={`/users/${report.reported.username}`}
                      className="text-xs font-medium hover:underline"
                    >
                      {report.reported.displayName}
                    </Link>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserAvatar size={24} avatarUrl={report.reporter.avatarUrl} />
                  <Link
                    href={`/users/${report.reporter.username}`}
                    className="font-medium hover:underline"
                  >
                    {report.reporter.displayName}
                  </Link>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{report.type}</Badge>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {report.reason}
                </p>
              </TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(report.createdAt))} ago
              </TableCell>
              <TableCell className="text-right">
                <ReportActions report={report} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
