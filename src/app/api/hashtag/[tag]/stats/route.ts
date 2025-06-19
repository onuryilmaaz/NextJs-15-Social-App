import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { tag: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hashtag = decodeURIComponent(params.tag);

    const postCount = await prisma.post.count({
      where: {
        content: {
          contains: `#${hashtag}`,
          mode: "insensitive",
        },
      },
    });

    return NextResponse.json({
      postCount,
      isFollowing: false, // TODO: Implement hashtag following
    });
  } catch (error) {
    console.error("Error fetching hashtag stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
