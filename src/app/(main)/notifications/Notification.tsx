import UserAvatar from "@/components/UserAvatar";
import { NotificationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { NotificationType } from "@prisma/client";
import {
  Heart,
  MessageCircle,
  User2,
  AtSign,
  Share,
  Edit,
  UserPlus,
  UserCheck,
  ShieldAlert,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface NotificationProps {
  notification: NotificationData;
}

export default function Notification({ notification }: NotificationProps) {
  const notificationTypeMap: Record<
    NotificationType,
    {
      message: string;
      icon: React.ReactElement;
      href: string;
      color: string;
    }
  > = {
    FOLLOW: {
      message: `started following you`,
      icon: <User2 className="size-7 text-blue-500" />,
      href: `/users/${notification.issuer.username}`,
      color: "bg-primary",
    },
    COMMENT: {
      message: `commented on your post`,
      icon: <MessageCircle className="size-7 fill-green-500 text-green-500" />,
      href: `/posts/${notification.postId}`,
      color: "bg-green-50 dark:bg-green-950/30",
    },
    LIKE: {
      message: `liked your post`,
      icon: <Heart className="size-7 fill-red-500 text-red-500" />,
      href: `/posts/${notification.postId}`,
      color: "bg-red-50 dark:bg-red-950/30",
    },
    MENTION: {
      message: `mentioned you in a post`,
      icon: <AtSign className="size-7 text-purple-500" />,
      href: `/posts/${notification.postId}`,
      color: "bg-purple-50 dark:bg-purple-950/30",
    },
    POST_SHARE: {
      message: `shared your post`,
      icon: <Share className="size-7 text-amber-500" />,
      href: `/posts/${notification.postId}`,
      color: "bg-amber-50 dark:bg-amber-950/30",
    },
    POST_EDIT: {
      message: `edited a post you're following`,
      icon: <Edit className="size-7 text-gray-500" />,
      href: `/posts/${notification.postId}`,
      color: "bg-gray-50 dark:bg-gray-950/30",
    },
    FOLLOW_REQUEST: {
      message: `requested to follow you`,
      icon: <UserPlus className="size-7 text-indigo-500" />,
      href: `/users/${notification.issuer.username}`,
      color: "bg-indigo-50 dark:bg-indigo-950/30",
    },
    FOLLOW_ACCEPT: {
      message: `accepted your follow request`,
      icon: <UserCheck className="size-7 text-emerald-500" />,
      href: `/users/${notification.issuer.username}`,
      color: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    MODERATION_ACTION: {
      message: "A moderation action was taken on your account",
      icon: <ShieldAlert className="size-6" />,
      href: `/notifications`,
      color: "bg-red-500",
    },
    CONTENT_FLAGGED: {
      message: "Your content was flagged by our moderation system",
      icon: <Flag className="size-6" />,
      href: `/notifications`,
      color: "bg-yellow-500",
    },
  };

  const { message, icon, href, color } = notificationTypeMap[notification.type];

  return (
    <Link href={href} className="block">
      <article
        className={cn(
          "group flex gap-4 rounded-2xl bg-card p-5 shadow-sm transition-all duration-200 hover:bg-card/80 hover:shadow-md",
          !notification.read && "border-l-4 border-primary bg-primary/5",
          notification.read && "opacity-75",
        )}
      >
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            color,
          )}
        >
          {icon}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <UserAvatar avatarUrl={notification.issuer.avatarUrl} size={32} />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold transition-colors group-hover:text-primary">
                    {notification.issuer.displayName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {message}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>

            {!notification.read && (
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>

          {notification.post && (
            <div className="ml-11 rounded-lg bg-muted/50 p-3">
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {notification.post.content}
              </p>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
