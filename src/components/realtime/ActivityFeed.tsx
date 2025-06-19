"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserAvatar from "@/components/UserAvatar";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Share2,
  Eye,
  Edit,
  AtSign,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityEvent {
  id: string;
  type:
    | "like"
    | "comment"
    | "follow"
    | "post"
    | "view"
    | "share"
    | "mention"
    | "edit";
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  target?: {
    id: string;
    type: "post" | "user" | "comment";
    title?: string;
  };
  timestamp: string;
  metadata?: Record<string, any>;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource("/api/realtime/activity");

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log("Activity feed connected");
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "activity") {
          setActivities((prev) => [data.activity, ...prev.slice(0, 49)]); // Keep last 50 activities

          // Invalidate related queries to refresh data
          if (
            data.activity.type === "like" ||
            data.activity.type === "comment"
          ) {
            queryClient.invalidateQueries({ queryKey: ["posts"] });
          }
        }
      } catch (error) {
        console.error("Error parsing activity data:", error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      console.log("Activity feed disconnected");
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [queryClient]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "post":
        return <Edit className="h-4 w-4 text-purple-500" />;
      case "view":
        return <Eye className="h-4 w-4 text-gray-500" />;
      case "share":
        return <Share2 className="h-4 w-4 text-orange-500" />;
      case "mention":
        return <AtSign className="h-4 w-4 text-indigo-500" />;
      default:
        return <Zap className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getActivityMessage = (activity: ActivityEvent) => {
    switch (activity.type) {
      case "like":
        return "liked a post";
      case "comment":
        return "commented on a post";
      case "follow":
        return `started following ${activity.target?.title || "someone"}`;
      case "post":
        return "created a new post";
      case "view":
        return "viewed a post";
      case "share":
        return "shared a post";
      case "mention":
        return "mentioned someone";
      case "edit":
        return "edited a post";
      default:
        return "performed an action";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "like":
        return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
      case "comment":
        return "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800";
      case "follow":
        return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
      case "post":
        return "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800";
      case "share":
        return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800";
      default:
        return "bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800";
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Activity</CardTitle>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500",
              )}
            />
            <Badge
              variant={isConnected ? "default" : "destructive"}
              className="text-xs"
            >
              {isConnected ? "Live" : "Offline"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="max-h-96 space-y-3 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Zap className="mx-auto mb-2 h-8 w-8 opacity-50" />
            <p className="text-sm">Waiting for activity...</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-all duration-200 hover:shadow-sm",
                getActivityColor(activity.type),
              )}
            >
              <UserAvatar avatarUrl={activity.user.avatarUrl} size={32} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {getActivityIcon(activity.type)}
                  <span className="truncate text-sm font-medium">
                    {activity.user.displayName}
                  </span>
                </div>
                <p className="mb-1 text-xs text-muted-foreground">
                  {getActivityMessage(activity)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.timestamp), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
