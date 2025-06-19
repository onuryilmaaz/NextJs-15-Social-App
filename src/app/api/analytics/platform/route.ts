import { validateRequest } from "@/auth";
import { getPlatformInsights } from "@/lib/analytics";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only moderators/admins can view platform insights
    if (!user.isModerator) {
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

    const insights = await getPlatformInsights(days);

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Error fetching platform insights:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
