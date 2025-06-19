import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Revalidate the trending topics cache
    revalidateTag("trending_topics");

    return NextResponse.json({
      success: true,
      message: "Trending topics cache revalidated",
    });
  } catch (error) {
    console.error("Error revalidating trending topics:", error);
    return NextResponse.json(
      { error: "Failed to revalidate cache" },
      { status: 500 },
    );
  }
}
