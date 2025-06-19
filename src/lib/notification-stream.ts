import { notificationsInclude } from "@/lib/types";
import prisma from "./prisma";

// Keep track of active connections
export const connections = new Map<string, ReadableStreamDefaultController>();

// Function to send notification to specific user
export async function sendNotificationToUser(
  userId: string,
  notificationId: string,
) {
  const controller = connections.get(userId);

  if (controller) {
    try {
      // Fetch the notification with all related data
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
        include: notificationsInclude,
      });

      if (notification) {
        controller.enqueue(
          `data: ${JSON.stringify({
            type: "notification",
            data: notification,
            timestamp: Date.now(),
          })}\n\n`,
        );
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      // Remove broken connection
      connections.delete(userId);
    }
  }
}

// Function to send notification count update
export async function sendNotificationCountUpdate(userId: string) {
  const controller = connections.get(userId);

  if (controller) {
    try {
      const unreadCount = await prisma.notification.count({
        where: {
          recipientId: userId,
          read: false,
        },
      });

      controller.enqueue(
        `data: ${JSON.stringify({
          type: "unread_count",
          count: unreadCount,
          timestamp: Date.now(),
        })}\n\n`,
      );
    } catch (error) {
      console.error("Error sending count update:", error);
      connections.delete(userId);
    }
  }
}
