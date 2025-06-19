import { validateRequest } from "@/auth";
import { NextRequest } from "next/server";

// Store active connections
const activityConnections = new Map<string, ReadableStreamDefaultController>();

// Activity queue for broadcasting
let activityQueue: any[] = [];

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stream = new ReadableStream({
      start(controller) {
        // Store the connection
        const connectionId = `activity_${user.id}`;
        activityConnections.set(connectionId, controller);

        // Send initial connection message
        try {
          controller.enqueue(
            `data: ${JSON.stringify({
              type: "connected",
              message: "Activity feed connected",
              timestamp: Date.now(),
            })}\n\n`,
          );

          // Send recent activities from queue
          const recentActivities = activityQueue.slice(-10);
          if (recentActivities.length > 0) {
            controller.enqueue(
              `data: ${JSON.stringify({
                type: "initial_activities",
                activities: recentActivities,
                timestamp: Date.now(),
              })}\n\n`,
            );
          }
        } catch (error) {
          console.error("Error sending initial data:", error);
        }

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
            activityConnections.delete(connectionId);
          }
        }, 30000);

        // Cleanup function
        const cleanup = () => {
          clearInterval(heartbeat);
          activityConnections.delete(connectionId);
        };
      },
      cancel() {
        const connectionId = `activity_${user.id}`;
        activityConnections.delete(connectionId);
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
    console.error("Activity SSE connection error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Function to broadcast activity to all connected clients
export async function broadcastActivity(activity: {
  id: string;
  type: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
  };
  target?: {
    id: string;
    type: string;
    title?: string;
  };
  timestamp: string;
  metadata?: Record<string, any>;
}) {
  try {
    // Add to activity queue (keep last 100 activities)
    activityQueue.push(activity);
    if (activityQueue.length > 100) {
      activityQueue = activityQueue.slice(-100);
    }

    // Broadcast to all connected clients
    const message = JSON.stringify({
      type: "activity",
      activity,
      timestamp: Date.now(),
    });

    const disconnectedConnections: string[] = [];

    for (const [connectionId, controller] of activityConnections) {
      try {
        controller.enqueue(`data: ${message}\n\n`);
      } catch (error) {
        console.error(`Error sending to connection ${connectionId}:`, error);
        disconnectedConnections.push(connectionId);
      }
    }

    // Clean up disconnected connections
    disconnectedConnections.forEach((id) => {
      activityConnections.delete(id);
    });
  } catch (error) {
    console.error("Error broadcasting activity:", error);
  }
}

// Function to get current activity stats
export function getActivityStats() {
  return {
    connectedClients: activityConnections.size,
    queuedActivities: activityQueue.length,
    recentActivities: activityQueue.slice(-10),
  };
}
