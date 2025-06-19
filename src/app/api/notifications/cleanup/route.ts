import { NotificationService } from "@/lib/notifications";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Verify this is an authorized cleanup request
    const authHeader = req.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clean up notifications older than 30 days
    const result = await NotificationService.cleanup(30);

    return Response.json({
      success: true,
      deletedCount: result.count,
      message: `Cleaned up ${result.count} old notifications`,
    });
  } catch (error) {
    console.error("Notification cleanup error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// For manual cleanup (development only)
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return Response.json(
      { error: "Not available in production" },
      { status: 403 },
    );
  }

  try {
    const result = await NotificationService.cleanup(30);
    return Response.json({
      success: true,
      deletedCount: result.count,
      message: `Cleaned up ${result.count} old notifications`,
    });
  } catch (error) {
    console.error("Notification cleanup error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
