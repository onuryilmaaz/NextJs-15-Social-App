import { validateRequest } from "@/auth";
import { connections } from "@/lib/notification-stream";

export async function GET() {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stream = new ReadableStream({
      start(controller) {
        // Store the connection
        connections.set(user.id, controller);

        // Send initial connection message
        try {
          controller.enqueue(
            `data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`,
          );
        } catch (error) {
          console.error("Error sending initial connection message:", error);
        }

        // Send heartbeat every 30 seconds to keep connection alive
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(
              `data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`,
            );
          } catch (error) {
            console.error("Error sending heartbeat:", error);
            clearInterval(heartbeat);
            connections.delete(user.id);
          }
        }, 30000);

        // Cleanup function
        const cleanup = () => {
          clearInterval(heartbeat);
          connections.delete(user.id);
        };

        // Store cleanup function for potential use
        // Note: In a real implementation, you might want to handle connection close events
      },
      cancel() {
        connections.delete(user.id);
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
    console.error("SSE connection error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
