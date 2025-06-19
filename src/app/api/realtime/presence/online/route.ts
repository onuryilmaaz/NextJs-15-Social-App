import { validateRequest } from "@/auth";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

// Store online users connections
const onlineUsersConnections = new Map<
  string,
  ReadableStreamDefaultController
>();

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stream = new ReadableStream({
      start(controller) {
        const connectionId = `online_users_${user.id}`;
        onlineUsersConnections.set(connectionId, controller);

        // Send initial online users data
        sendOnlineUsersUpdate();

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
            onlineUsersConnections.delete(connectionId);
          }
        }, 30000);

        // Send online users update every 10 seconds
        const updateInterval = setInterval(() => {
          sendOnlineUsersUpdate();
        }, 10000);

        // Cleanup on connection close
        const cleanup = () => {
          clearInterval(heartbeat);
          clearInterval(updateInterval);
          onlineUsersConnections.delete(connectionId);
        };

        // Note: controller doesn't have closed property in this context
      },
      cancel() {
        const connectionId = `online_users_${user.id}`;
        onlineUsersConnections.delete(connectionId);
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
    console.error("Online users SSE connection error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function sendOnlineUsersUpdate() {
  try {
    // Get users who have been active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const onlineUsers = await prisma.user.findMany({
      where: {
        analytics: {
          lastActiveAt: {
            gte: fiveMinutesAgo,
          },
        },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        analytics: {
          select: {
            lastActiveAt: true,
          },
        },
      },
      orderBy: {
        analytics: {
          lastActiveAt: "desc",
        },
      },
      take: 50, // Limit to 50 users
    });

    const formattedUsers = onlineUsers.map((user) => ({
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      status: "online" as const,
      lastSeen:
        user.analytics?.lastActiveAt?.toISOString() || new Date().toISOString(),
      currentActivity: getRandomActivity(), // Simulate activity
    }));

    const message = JSON.stringify({
      type: "online_users",
      users: formattedUsers,
      total: onlineUsers.length,
      timestamp: Date.now(),
    });

    // Broadcast to all connected clients
    const disconnectedConnections: string[] = [];

    for (const [connectionId, controller] of onlineUsersConnections) {
      try {
        controller.enqueue(`data: ${message}\n\n`);
      } catch (error) {
        console.error(`Error sending to connection ${connectionId}:`, error);
        disconnectedConnections.push(connectionId);
      }
    }

    // Clean up disconnected connections
    disconnectedConnections.forEach((id) => {
      onlineUsersConnections.delete(id);
    });
  } catch (error) {
    console.error("Error sending online users update:", error);

    // Send empty users list on error to prevent client hanging
    const errorMessage = JSON.stringify({
      type: "online_users",
      users: [],
      total: 0,
      timestamp: Date.now(),
      error: "Unable to fetch online users",
    });

    const disconnectedConnections: string[] = [];

    for (const [connectionId, controller] of onlineUsersConnections) {
      try {
        controller.enqueue(`data: ${errorMessage}\n\n`);
      } catch (error) {
        disconnectedConnections.push(connectionId);
      }
    }

    disconnectedConnections.forEach((id) => {
      onlineUsersConnections.delete(id);
    });
  }
}

// Simulate random user activities
function getRandomActivity(): string | undefined {
  const activities = [
    "Writing a post",
    "Reading comments",
    "Browsing feed",
    "Viewing profile",
    "Searching",
    undefined, // No activity
  ];

  return activities[Math.floor(Math.random() * activities.length)];
}

// Function to manually trigger online users update
export async function triggerOnlineUsersUpdate() {
  await sendOnlineUsersUpdate();
}
