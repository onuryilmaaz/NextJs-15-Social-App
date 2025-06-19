import { NotificationType } from "@prisma/client";
import prisma from "./prisma";
import {
  sendNotificationCountUpdate,
  sendNotificationToUser,
} from "@/lib/notification-stream";

export interface CreateNotificationData {
  type: NotificationType;
  recipientId: string;
  issuerId: string;
  postId?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create a new notification and send real-time update
   */
  static async create(data: CreateNotificationData) {
    try {
      // Don't send notification to self
      if (data.recipientId === data.issuerId) {
        return null;
      }

      // Check for existing notification to avoid duplicates
      const existingNotification = await this.findExisting(data);
      if (existingNotification) {
        // Update timestamp instead of creating duplicate
        const updatedNotification = await prisma.notification.update({
          where: { id: existingNotification.id },
          data: { createdAt: new Date() },
        });

        // Send real-time update
        await this.sendRealTimeUpdate(data.recipientId, updatedNotification.id);
        return updatedNotification;
      }

      // Create new notification
      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          recipientId: data.recipientId,
          issuerId: data.issuerId,
          postId: data.postId,
        },
      });

      // Send real-time update
      await this.sendRealTimeUpdate(data.recipientId, notification.id);

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  }

  /**
   * Find existing notification to prevent duplicates
   */
  private static async findExisting(data: CreateNotificationData) {
    const where: any = {
      type: data.type,
      recipientId: data.recipientId,
      issuerId: data.issuerId,
    };

    if (data.postId) {
      where.postId = data.postId;
    }

    // Only check for recent notifications (last 24 hours) for certain types
    if ([NotificationType.LIKE, NotificationType.FOLLOW].includes(data.type)) {
      where.createdAt = {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };
    }

    return prisma.notification.findFirst({ where });
  }

  /**
   * Send real-time notification update
   */
  private static async sendRealTimeUpdate(
    userId: string,
    notificationId: string,
  ) {
    try {
      // Send the notification data
      await sendNotificationToUser(userId, notificationId);

      // Send updated unread count
      await sendNotificationCountUpdate(userId);
    } catch (error) {
      console.error("Error sending real-time update:", error);
    }
  }

  /**
   * Bulk create notifications (for mentions, etc.)
   */
  static async createBulk(notifications: CreateNotificationData[]) {
    const results = [];

    for (const notification of notifications) {
      const result = await this.create(notification);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Mark notifications as read
   */
  static async markAsRead(userId: string, notificationIds?: string[]) {
    const where: any = {
      recipientId: userId,
      read: false,
    };

    if (notificationIds?.length) {
      where.id = { in: notificationIds };
    }

    await prisma.notification.updateMany({
      where,
      data: { read: true },
    });

    // Send updated count
    await sendNotificationCountUpdate(userId);
  }

  /**
   * Delete notifications (when unfollowing, unliking, etc.)
   */
  static async deleteRelated(data: {
    type: NotificationType;
    recipientId: string;
    issuerId: string;
    postId?: string;
  }) {
    try {
      const where: any = {
        type: data.type,
        recipientId: data.recipientId,
        issuerId: data.issuerId,
      };

      if (data.postId) {
        where.postId = data.postId;
      }

      await prisma.notification.deleteMany({ where });

      // Send updated count
      await sendNotificationCountUpdate(data.recipientId);
    } catch (error) {
      console.error("Error deleting notifications:", error);
    }
  }

  /**
   * Get notification summary for a user
   */
  static async getSummary(userId: string) {
    const [total, unread, recent] = await Promise.all([
      prisma.notification.count({
        where: { recipientId: userId },
      }),
      prisma.notification.count({
        where: { recipientId: userId, read: false },
      }),
      prisma.notification.count({
        where: {
          recipientId: userId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return { total, unread, recent };
  }

  /**
   * Clean up old notifications (run periodically)
   */
  static async cleanup(daysToKeep = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    return prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true,
      },
    });
  }
}

// Export convenience functions
export const createNotification =
  NotificationService.create.bind(NotificationService);
export const createBulkNotifications =
  NotificationService.createBulk.bind(NotificationService);
export const markNotificationsAsRead =
  NotificationService.markAsRead.bind(NotificationService);
export const deleteRelatedNotifications =
  NotificationService.deleteRelated.bind(NotificationService);
