import { validateRequest } from "@/auth";
import { AnalyticsService } from "@/lib/analytics";
import { rateLimitByKey } from "@/lib/rate-limit";
import { EngagementType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Apply rate limiting for analytics (60 requests per minute per user)
    if (!rateLimitByKey(`analytics:${user.id}`, 60, 60)) {
      return NextResponse.json(
        { error: "Too many analytics requests. Please slow down." },
        { status: 429 },
      );
    }

    const { eventType, targetId, metadata } = await req.json();

    // Validate required fields
    if (!eventType || !targetId) {
      return NextResponse.json(
        { error: "Missing required fields: eventType, targetId" },
        { status: 400 },
      );
    }

    // Validate eventType is valid EngagementType
    if (!Object.values(EngagementType).includes(eventType)) {
      return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
    }

    // Track the event asynchronously - don't await to avoid blocking the response
    AnalyticsService.trackEvent(
      user.id,
      eventType as EngagementType,
      targetId,
      metadata,
    ).catch((error) => {
      // Log errors but don't fail the request
      console.error("Error tracking analytics event:", error);
    });

    // Return immediately without waiting for analytics processing
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in analytics track endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
