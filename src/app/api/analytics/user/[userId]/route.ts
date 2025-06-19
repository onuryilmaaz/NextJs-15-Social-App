import { validateRequest } from "@/auth";
import { getUserAnalytics } from "@/lib/analytics";
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

    // Users can only view their own analytics (unless admin/moderator)
    if (user.id !== params.userId && !user.isModerator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const analytics = await getUserAnalytics(params.userId);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
