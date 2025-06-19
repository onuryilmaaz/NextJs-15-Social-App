import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
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
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const sortBy = searchParams.get("sortBy") || "recent";

    const pageSize = 10;

    let orderBy: any[] = [];

    switch (sortBy) {
      case "popular":
        orderBy = [
          { likes: { _count: "desc" } },
          { comments: { _count: "desc" } },
          { createdAt: "desc" },
        ];
        break;
      case "trending":
        // Trending = popular posts from last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        orderBy = [{ likes: { _count: "desc" } }, { createdAt: "desc" }];
        break;
      default: // recent
        orderBy = [{ createdAt: "desc" }];
        break;
    }

    const posts = await prisma.post.findMany({
      where: {
        content: {
          contains: `#${hashtag}`,
          mode: "insensitive",
        },
        ...(sortBy === "trending" && {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        }),
      },
      include: getPostDataInclude(user.id),
      orderBy,
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = {
      posts: posts.slice(0, pageSize),
      nextCursor,
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching hashtag posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
