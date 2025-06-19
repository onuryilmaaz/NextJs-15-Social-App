import { validateRequest } from "@/auth";
import { AnalyticsService } from "@/lib/analytics";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Users can only view their own insights (unless admin/moderator)
    if (user.id !== params.userId && !user.isModerator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: "Days must be between 1 and 365" },
        { status: 400 },
      );
    }

    const insights = await AnalyticsService.getEngagementInsights(
      params.userId,
      days,
    );

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Error fetching engagement insights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
