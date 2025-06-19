import { getTrendingTopicsFromDB } from "@/lib/hashtag-utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "5");

    const topics = await getTrendingTopicsFromDB(Math.min(limit, 20)); // Max 20 topics

    const response = topics.map((topic) => ({
      hashtag: `#${topic.keyword}`,
      count: topic.mentions,
      score: topic.score,
    }));

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=300", // 5 minutes cache
      },
    });
  } catch (error) {
    console.error("Error fetching trending topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending topics" },
      { status: 500 },
    );
  }
}
