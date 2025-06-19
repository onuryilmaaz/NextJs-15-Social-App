import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, getUserDataSelect } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "trending";
    const category = searchParams.get("category") || "all";

    const categoryKeywords = {
      tech: ["tech", "technology", "software", "hardware", "ai", "ml"],
      programming: [
        "code",
        "programming",
        "javascript",
        "python",
        "react",
        "nextjs",
      ],
      design: ["design", "ui", "ux", "figma", "css", "frontend"],
      business: ["business", "startup", "entrepreneur", "marketing", "sales"],
      lifestyle: ["lifestyle", "health", "fitness", "travel", "food"],
      entertainment: ["entertainment", "movies", "music", "games", "tv"],
      science: ["science", "research", "study", "experiment", "discovery"],
      sports: ["sports", "football", "basketball", "soccer", "fitness"],
    };

    const categoryFilter =
      category !== "all" &&
      categoryKeywords[category as keyof typeof categoryKeywords]
        ? categoryKeywords[category as keyof typeof categoryKeywords]
        : null;

    switch (tab) {
      case "trending":
        const trendingPosts = await prisma.post.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
            ...(categoryFilter && {
              content: {
                contains: categoryFilter.join("|"),
                mode: "insensitive",
              },
            }),
          },
          include: getPostDataInclude(user.id),
          orderBy: [
            { likes: { _count: "desc" } },
            { comments: { _count: "desc" } },
            { createdAt: "desc" },
          ],
          take: 20,
        });

        return NextResponse.json({ posts: trendingPosts });

      case "recent":
        const recentPosts = await prisma.post.findMany({
          where: categoryFilter
            ? {
                content: {
                  contains: categoryFilter.join("|"),
                  mode: "insensitive",
                },
              }
            : {},
          include: getPostDataInclude(user.id),
          orderBy: { createdAt: "desc" },
          take: 20,
        });

        return NextResponse.json({ posts: recentPosts });

      case "people":
        const suggestedUsers = await prisma.user.findMany({
          where: {
            NOT: { id: user.id },
            followers: {
              none: { followerId: user.id },
            },
          },
          select: getUserDataSelect(user.id),
          orderBy: [{ followers: { _count: "desc" } }, { createdAt: "desc" }],
          take: 20,
        });

        return NextResponse.json({ users: suggestedUsers });

      case "topics":
        // Get trending hashtags
        const trendingTopics = await prisma.$queryRaw<
          { hashtag: string; count: bigint }[]
        >`
          SELECT LOWER(unnest(regexp_matches(content, '#[[:alnum:]_]+', 'g'))) AS hashtag, COUNT(*) AS count
          FROM posts
          WHERE created_at > NOW() - INTERVAL '7 days'
          ${categoryFilter ? `AND content ILIKE ANY(ARRAY[${categoryFilter.map((k) => `'%${k}%'`).join(",")}])` : ""}
          GROUP BY hashtag
          ORDER BY count DESC
          LIMIT 20
        `;

        const topicsWithGrowth = trendingTopics.map((topic) => ({
          keyword: topic.hashtag,
          postCount: Number(topic.count),
          growth: Math.floor(Math.random() * 50) + 10, // Mock growth data
        }));

        return NextResponse.json({ topics: topicsWithGrowth });

      default:
        return NextResponse.json({ error: "Invalid tab" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error fetching discover content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
