"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Clock, Users, Wifi, WifiOff } from "lucide-react";

interface UserPresence {
  userId: string;
  status: "online" | "offline" | "away" | "busy";
  lastSeen: string;
  currentActivity?: string;
}

interface LiveUserStatusProps {
  userId: string;
  showActivity?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LiveUserStatus({
  userId,
  showActivity = false,
  size = "md",
  className,
}: LiveUserStatusProps) {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`/api/realtime/presence/${userId}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "presence") {
          setPresence(data.presence);
        }
      } catch (error) {
        console.error("Error parsing presence data:", error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [userId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <Wifi className="h-3 w-3" />;
      case "offline":
        return <WifiOff className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          indicator: "w-2 h-2",
          text: "text-xs",
          badge: "text-xs px-1.5 py-0.5",
        };
      case "lg":
        return {
          indicator: "w-4 h-4",
          text: "text-sm",
          badge: "text-sm px-3 py-1",
        };
      default:
        return {
          indicator: "w-3 h-3",
          text: "text-xs",
          badge: "text-xs px-2 py-0.5",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  if (!isConnected || !presence) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div
          className={cn(
            "animate-pulse rounded-full bg-gray-400",
            sizeClasses.indicator,
          )}
        />
        <span className={cn("text-muted-foreground", sizeClasses.text)}>
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Status indicator */}
      <div className="relative">
        <div
          className={cn(
            "rounded-full border-2 border-background",
            getStatusColor(presence.status),
            sizeClasses.indicator,
          )}
        />
        {presence.status === "online" && (
          <div
            className={cn(
              "absolute inset-0 animate-ping rounded-full",
              getStatusColor(presence.status),
              "opacity-75",
              sizeClasses.indicator,
            )}
          />
        )}
      </div>

      {/* Status text */}
      <div className="flex flex-col">
        <Badge
          variant="outline"
          className={cn("capitalize", sizeClasses.badge)}
        >
          {getStatusIcon(presence.status)}
          <span className="ml-1">{presence.status}</span>
        </Badge>

        {presence.status !== "online" && (
          <span className={cn("text-muted-foreground", sizeClasses.text)}>
            Last seen{" "}
            {formatDistanceToNow(new Date(presence.lastSeen), {
              addSuffix: true,
            })}
          </span>
        )}

        {showActivity && presence.currentActivity && (
          <span
            className={cn("italic text-muted-foreground", sizeClasses.text)}
          >
            {presence.currentActivity}
          </span>
        )}
      </div>
    </div>
  );
}

// Component for showing multiple online users
interface OnlineUsersProps {
  className?: string;
  maxUsers?: number;
}

export function OnlineUsers({ className, maxUsers = 10 }: OnlineUsersProps) {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [totalOnline, setTotalOnline] = useState(0);

  useEffect(() => {
    const eventSource = new EventSource("/api/realtime/presence/online");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "online_users") {
          setOnlineUsers(data.users.slice(0, maxUsers));
          setTotalOnline(data.total);
        }
      } catch (error) {
        console.error("Error parsing online users data:", error);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [maxUsers]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-green-500" />
        <span className="text-sm font-medium">{totalOnline} Users Online</span>
      </div>

      <div className="space-y-2">
        {onlineUsers.map((user) => (
          <div key={user.userId} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">
              User {user.userId.slice(0, 8)}...
            </span>
            {user.currentActivity && (
              <span className="text-xs italic text-muted-foreground">
                {user.currentActivity}
              </span>
            )}
          </div>
        ))}

        {totalOnline > maxUsers && (
          <div className="text-xs text-muted-foreground">
            +{totalOnline - maxUsers} more users online
          </div>
        )}
      </div>
    </div>
  );
}
