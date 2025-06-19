"use client";

import { Button } from "@/components/ui/button";
import kyInstance from "@/lib/ky";
import { NotificationCountInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Bell, BellRing } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NotificationsButtonProps {
  initialState: NotificationCountInfo;
}

export default function NotificationsButton({
  initialState,
}: NotificationsButtonProps) {
  const { data } = useQuery({
    queryKey: ["unread-notification-count"],
    queryFn: () =>
      kyInstance
        .get("/api/notifications/unread-count")
        .json<NotificationCountInfo>(),
    initialData: initialState,
    refetchInterval: 60 * 1000,
  });

  const hasUnread = !!data.unreadCount;

  return (
    <Button
      variant="ghost"
      className={cn(
        "flex items-center justify-start gap-3 transition-all duration-200",
        hasUnread && "text-primary",
      )}
      title={`Notifications${hasUnread ? ` (${data.unreadCount})` : ""}`}
      asChild
    >
      <Link href="/notifications">
        <div className="relative">
          {hasUnread ? (
            <BellRing
              className={cn(
                "transition-all duration-200",
                hasUnread && "animate-pulse",
              )}
            />
          ) : (
            <Bell />
          )}
          {hasUnread && (
            <span className="absolute -right-1 -top-1 animate-bounce rounded-full bg-primary px-1 text-xs font-medium tabular-nums text-primary-foreground">
              {data.unreadCount > 99 ? "99+" : data.unreadCount}
            </span>
          )}
        </div>
        <span className="hidden lg:inline">Notifications</span>
      </Link>
    </Button>
  );
}
