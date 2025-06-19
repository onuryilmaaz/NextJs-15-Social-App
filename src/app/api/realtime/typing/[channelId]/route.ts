import { validateRequest } from "@/auth";
import { NextRequest } from "next/server";

// Store typing connections for each channel
const typingConnections = new Map<
  string,
  Map<string, ReadableStreamDefaultController>
>();

// Store typing users for each channel
const typingUsers = new Map<
  string,
  Map<
    string,
    {
      id: string;
      name: string;
      avatar?: string;
      lastTyped: Date;
    }
  >
>();

export async function GET(
  req: NextRequest,
  { params }: { params: { channelId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const channelId = params.channelId;

    const stream = new ReadableStream({
      start(controller) {
        // Initialize channel connections if not exists
        if (!typingConnections.has(channelId)) {
          typingConnections.set(channelId, new Map());
        }

        const channelConnections = typingConnections.get(channelId)!;
        const connectionId = `${user.id}_${Date.now()}`;
        channelConnections.set(connectionId, controller);

        // Send initial connection message
        controller.enqueue(
          `data: ${JSON.stringify({
            type: "connected",
            channelId,
            timestamp: Date.now(),
          })}\n\n`,
        );

        // Send current typing users
        const currentTypingUsers = typingUsers.get(channelId);
        if (currentTypingUsers && currentTypingUsers.size > 0) {
          currentTypingUsers.forEach((typingUser) => {
            if (typingUser.id !== user.id) {
              controller.enqueue(
                `data: ${JSON.stringify({
                  type: "typing",
                  user: typingUser,
                  isTyping: true,
                  channelId,
                  timestamp: Date.now(),
                })}\n\n`,
              );
            }
          });
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
            channelConnections.delete(connectionId);
          }
        }, 30000);

        // Cleanup on connection close
        const cleanup = () => {
          clearInterval(heartbeat);
          channelConnections.delete(connectionId);

          // Remove channel if no connections left
          if (channelConnections.size === 0) {
            typingConnections.delete(channelId);
          }
        };

        // Note: controller doesn't have closed property in this context
      },
      cancel() {
        // Cleanup will be handled by the above cleanup function
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
    console.error("Typing SSE connection error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { channelId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isTyping } = await req.json();
    const channelId = params.channelId;

    // Initialize channel typing users if not exists
    if (!typingUsers.has(channelId)) {
      typingUsers.set(channelId, new Map());
    }

    const channelTypingUsers = typingUsers.get(channelId)!;

    if (isTyping) {
      // Add user to typing list
      channelTypingUsers.set(user.id, {
        id: user.id,
        name: user.displayName,
        avatar: user.avatarUrl || undefined,
        lastTyped: new Date(),
      });
    } else {
      // Remove user from typing list
      channelTypingUsers.delete(user.id);
    }

    // Clean up old typing users (older than 5 seconds)
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    for (const [userId, typingUser] of channelTypingUsers) {
      if (typingUser.lastTyped < fiveSecondsAgo) {
        channelTypingUsers.delete(userId);
      }
    }

    // Broadcast typing event to all connections in this channel
    const channelConnections = typingConnections.get(channelId);
    if (channelConnections) {
      const message = JSON.stringify({
        type: "typing",
        user: {
          id: user.id,
          name: user.displayName,
          avatar: user.avatarUrl || undefined,
        },
        isTyping,
        channelId,
        timestamp: Date.now(),
      });

      const disconnectedConnections: string[] = [];

      for (const [connectionId, controller] of channelConnections) {
        try {
          controller.enqueue(`data: ${message}\n\n`);
        } catch (error) {
          console.error(`Error sending to connection ${connectionId}:`, error);
          disconnectedConnections.push(connectionId);
        }
      }

      // Clean up disconnected connections
      disconnectedConnections.forEach((id) => {
        channelConnections.delete(id);
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Typing event error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Cleanup function for old typing users (can be called periodically)
export function cleanupOldTypingUsers() {
  const fiveSecondsAgo = new Date(Date.now() - 5000);

  for (const [channelId, channelTypingUsers] of typingUsers) {
    for (const [userId, typingUser] of channelTypingUsers) {
      if (typingUser.lastTyped < fiveSecondsAgo) {
        channelTypingUsers.delete(userId);
      }
    }

    // Remove empty channels
    if (channelTypingUsers.size === 0) {
      typingUsers.delete(channelId);
    }
  }
}
