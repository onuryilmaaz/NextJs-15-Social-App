import { broadcastActivity } from "@/app/api/realtime/activity/route";
import prisma from "./prisma";

export interface ActivityData {
  type:
    | "like"
    | "comment"
    | "follow"
    | "post"
    | "view"
    | "share"
    | "mention"
    | "edit";
  userId: string;
  targetId?: string;
  targetType?: "post" | "user" | "comment";
  metadata?: Record<string, any>;
}

export class RealtimeActivityService {
  /**
   * Track a user activity and broadcast it to connected clients
   */
  static async trackActivity(data: ActivityData) {
    try {
      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        console.error("User not found for activity tracking:", data.userId);
        return;
      }

      // Get target data if applicable
      let target;
      if (data.targetId && data.targetType) {
        target = await this.getTargetData(data.targetId, data.targetType);
      }

      // Create activity object
      const activity = {
        id: `${data.type}_${user.id}_${Date.now()}`,
        type: data.type,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl || undefined,
        },
        target,
        timestamp: new Date().toISOString(),
        metadata: data.metadata,
      };

      // Store activity in database (optional, for analytics)
      await this.storeActivity(activity);

      // Broadcast to connected clients
      await broadcastActivity(activity);

      console.log(`Activity tracked: ${data.type} by ${user.username}`);
    } catch (error) {
      console.error("Error tracking activity:", error);
    }
  }

  /**
   * Get target data based on type and ID
   */
  private static async getTargetData(targetId: string, targetType: string) {
    try {
      switch (targetType) {
        case "post":
          const post = await prisma.post.findUnique({
            where: { id: targetId },
            select: {
              id: true,
              content: true,
              user: {
                select: {
                  username: true,
                  displayName: true,
                },
              },
            },
          });

          return post
            ? {
                id: post.id,
                type: "post" as const,
                title:
                  post.content.substring(0, 50) +
                  (post.content.length > 50 ? "..." : ""),
              }
            : undefined;

        case "user":
          const user = await prisma.user.findUnique({
            where: { id: targetId },
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          });

          return user
            ? {
                id: user.id,
                type: "user" as const,
                title: user.displayName,
              }
            : undefined;

        case "comment":
          const comment = await prisma.comment.findUnique({
            where: { id: targetId },
            select: {
              id: true,
              content: true,
            },
          });

          return comment
            ? {
                id: comment.id,
                type: "comment" as const,
                title:
                  comment.content.substring(0, 50) +
                  (comment.content.length > 50 ? "..." : ""),
              }
            : undefined;

        default:
          return undefined;
      }
    } catch (error) {
      console.error("Error getting target data:", error);
      return undefined;
    }
  }

  /**
   * Store activity in database for analytics
   */
  private static async storeActivity(activity: any) {
    try {
      await prisma.engagementEvent.create({
        data: {
          userId: activity.user.id,
          eventType: this.mapActivityTypeToEngagementType(activity.type),
          targetId: activity.target?.id || activity.user.id,
          metadata: activity.metadata || {},
          timestamp: new Date(activity.timestamp),
        },
      });
    } catch (error) {
      console.error("Error storing activity:", error);
    }
  }

  /**
   * Map activity type to engagement type enum
   */
  private static mapActivityTypeToEngagementType(activityType: string) {
    switch (activityType) {
      case "like":
        return "POST_LIKE";
      case "comment":
        return "POST_COMMENT";
      case "follow":
        return "USER_FOLLOW";
      case "post":
        return "POST_VIEW"; // Assuming new post creation counts as a view
      case "view":
        return "POST_VIEW";
      case "share":
        return "POST_SHARE";
      default:
        return "POST_VIEW";
    }
  }

  /**
   * Track post like activity
   */
  static async trackLike(userId: string, postId: string) {
    await this.trackActivity({
      type: "like",
      userId,
      targetId: postId,
      targetType: "post",
    });
  }

  /**
   * Track comment activity
   */
  static async trackComment(userId: string, postId: string, commentId: string) {
    await this.trackActivity({
      type: "comment",
      userId,
      targetId: postId,
      targetType: "post",
      metadata: { commentId },
    });
  }

  /**
   * Track follow activity
   */
  static async trackFollow(followerId: string, followingId: string) {
    await this.trackActivity({
      type: "follow",
      userId: followerId,
      targetId: followingId,
      targetType: "user",
    });
  }

  /**
   * Track new post activity
   */
  static async trackPost(userId: string, postId: string) {
    await this.trackActivity({
      type: "post",
      userId,
      targetId: postId,
      targetType: "post",
    });
  }

  /**
   * Track post view activity
   */
  static async trackView(userId: string, postId: string) {
    await this.trackActivity({
      type: "view",
      userId,
      targetId: postId,
      targetType: "post",
    });
  }

  /**
   * Track post share activity
   */
  static async trackShare(userId: string, postId: string) {
    await this.trackActivity({
      type: "share",
      userId,
      targetId: postId,
      targetType: "post",
    });
  }

  /**
   * Track mention activity
   */
  static async trackMention(
    userId: string,
    postId: string,
    mentionedUserId: string,
  ) {
    await this.trackActivity({
      type: "mention",
      userId,
      targetId: postId,
      targetType: "post",
      metadata: { mentionedUserId },
    });
  }

  /**
   * Track post edit activity
   */
  static async trackEdit(userId: string, postId: string) {
    await this.trackActivity({
      type: "edit",
      userId,
      targetId: postId,
      targetType: "post",
    });
  }
}
