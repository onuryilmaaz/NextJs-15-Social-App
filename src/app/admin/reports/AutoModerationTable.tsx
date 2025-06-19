"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ContentModeration } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface AutoModerationTableProps {
  items: ContentModeration[];
}

export default function AutoModerationTable({
  items,
}: AutoModerationTableProps) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">
        No automatically flagged content.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Content Type</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <Link
                href={`/posts/${item.contentId}`} // Simplified link
                target="_blank"
                className="hover:underline"
              >
                <Badge variant="secondary">{item.contentType}</Badge>
                <p className="mt-1 line-clamp-2 max-w-xs">
                  ID: {item.contentId}
                </p>
              </Link>
            </TableCell>
            <TableCell>
              <p className="line-clamp-2">{item.flaggedReason}</p>
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  item.severity === "HIGH" || item.severity === "CRITICAL"
                    ? "destructive"
                    : "default"
                }
              >
                {item.severity}
              </Badge>
            </TableCell>
            <TableCell>
              {formatDistanceToNow(new Date(item.createdAt))} ago
            </TableCell>
            <TableCell className="text-right">
              {item.reviewed ? (
                <Badge variant="success">Reviewed</Badge>
              ) : (
                <Badge variant="warning">Pending Review</Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
