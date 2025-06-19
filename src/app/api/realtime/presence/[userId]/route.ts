import { validateRequest } from "@/auth";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// Store user presence connections
const presenceConnections = new Map<string, ReadableStreamDefaultController>();

// Store user presence data
const userPresence = new Map<
  string,
  {
    status: "online" | "offline" | "away" | "busy";
    lastSeen: Date;
    currentActivity?: string;
  }
>();

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetUserId = params.userId;

    const stream = new ReadableStream({
      start(controller) {
        const connectionId = `presence_${targetUserId}_${user.id}`;
        presenceConnections.set(connectionId, controller);

        // Send initial presence data
        const presence = userPresence.get(targetUserId) || {
          status: "offline" as const,
          lastSeen: new Date(),
        };

        controller.enqueue(
          `data: ${JSON.stringify({
            type: "presence",
            presence: {
              userId: targetUserId,
              status: presence.status,
              lastSeen: presence.lastSeen.toISOString(),
              currentActivity: presence.currentActivity,
            },
          })}\n\n`,
        );

        // Send heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(
              `data: ${JSON.stringify({
                type: "heartbeat",
                timestamp: Date.now(),
              })}\n\n`,
            );
          } catch (error) {
            clearInterval(heartbeat);
            presenceConnections.delete(connectionId);
          }
        }, 30000);

        // Cleanup on connection close
        const cleanup = () => {
          clearInterval(heartbeat);
          presenceConnections.delete(connectionId);
        };

        // Note: controller doesn't have closed property in this context
      },
      cancel() {
        const connectionId = `presence_${targetUserId}_${user.id}`;
        presenceConnections.delete(connectionId);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("Presence SSE connection error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Function to update user presence
export async function updateUserPresence(
  userId: string,
  status: "online" | "offline" | "away" | "busy",
  currentActivity?: string,
) {
  // Update presence data
  userPresence.set(userId, {
    status,
    lastSeen: new Date(),
    currentActivity,
  });

  // Update database
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        analytics: {
          upsert: {
            create: {
              lastActiveAt: new Date(),
            },
            update: {
              lastActiveAt: new Date(),
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Error updating user presence in database:", error);
  }

  // Broadcast to all subscribers for this user
  const presence = {
    userId,
    status,
    lastSeen: new Date().toISOString(),
    currentActivity,
  };

  const message = JSON.stringify({
    type: "presence",
    presence,
  });

  const disconnectedConnections: string[] = [];

  for (const [connectionId, controller] of presenceConnections) {
    if (connectionId.startsWith(`presence_${userId}_`)) {
      try {
        controller.enqueue(`data: ${message}\n\n`);
      } catch (error) {
        console.error(`Error sending to connection ${connectionId}:`, error);
        disconnectedConnections.push(connectionId);
      }
    }
  }

  // Clean up disconnected connections
  disconnectedConnections.forEach((id) => {
    presenceConnections.delete(id);
  });
}

// Function to get current presence for a user
export function getUserPresence(userId: string) {
  return (
    userPresence.get(userId) || {
      status: "offline" as const,
      lastSeen: new Date(),
    }
  );
}
