import { AnalyticsService } from "@/lib/analytics";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const cronSecret = request.headers
      .get("Authorization")
      ?.replace("Bearer ", "");

    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await AnalyticsService.updateDailyStats();

    return NextResponse.json({ success: true, message: "Daily stats updated" });
  } catch (error) {
    console.error("Error updating daily stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// For development/manual updates
export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        { error: "Not allowed in production" },
        { status: 403 },
      );
    }

    await AnalyticsService.updateDailyStats();

    return NextResponse.json({
      success: true,
      message: "Daily stats updated (development mode)",
    });
  } catch (error) {
    console.error("Error updating daily stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
