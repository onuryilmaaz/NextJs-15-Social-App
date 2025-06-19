import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { handleApiError, createError } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      throw createError.authentication();
    }

    const q = req.nextUrl.searchParams.get("q") || "";
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const type = req.nextUrl.searchParams.get("type") || "all"; // all, posts, users
    const sortBy = req.nextUrl.searchParams.get("sortBy") || "relevance"; // relevance, recent, popular

    // Advanced filters
    const dateRange = req.nextUrl.searchParams.get("dateRange");
    const minLikes = req.nextUrl.searchParams.get("minLikes");
    const hasMedia = req.nextUrl.searchParams.get("hasMedia") === "true";
    const fromUser = req.nextUrl.searchParams.get("fromUser");

    const pageSize = 10;

    if (!q.trim()) {
      return Response.json({
        posts: [],
        nextCursor: null,
      });
    }

    // Build search conditions
    const searchTerms = q.trim().toLowerCase().split(/\s+/);
    const isHashtagSearch = q.trim().startsWith("#");
    const hashtagTerm = isHashtagSearch ? q.trim().slice(1) : null;

    // Date range filter
    let dateFilter: any = {};
    if (dateRange) {
      const now = new Date();
      switch (dateRange) {
        case "day":
          dateFilter.gte = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "week":
          dateFilter.gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "year":
          dateFilter.gte = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
      }
    }

    let whereCondition: any = {
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
      ...(minLikes && {
        likes: {
          _count: { gte: parseInt(minLikes) },
        },
      }),
      ...(hasMedia && {
        attachments: {
          some: {},
        },
      }),
      ...(fromUser && {
        user: {
          username: {
            equals: fromUser,
            mode: "insensitive",
          },
        },
      }),
    };

    if (isHashtagSearch && hashtagTerm) {
      // Hashtag search
      whereCondition.content = {
        contains: `#${hashtagTerm}`,
        mode: "insensitive",
      };
    } else {
      // General search
      whereCondition.OR = [
        // Search in post content
        {
          content: {
            contains: q.trim(),
            mode: "insensitive",
          },
        },
        // Search by username mention
        {
          content: {
            contains: `@${q.trim()}`,
            mode: "insensitive",
          },
        },
        // Search by user display name
        {
          user: {
            displayName: {
              contains: q.trim(),
              mode: "insensitive",
            },
          },
        },
        // Search by username
        {
          user: {
            username: {
              contains: q.trim(),
              mode: "insensitive",
            },
          },
        },
      ];
    }

    // Build order by clause based on sortBy
    let orderBy: any[] = [];

    switch (sortBy) {
      case "recent":
        orderBy = [{ createdAt: "desc" }];
        break;
      case "popular":
        orderBy = [
          { likes: { _count: "desc" } },
          { comments: { _count: "desc" } },
          { createdAt: "desc" },
        ];
        break;
      case "relevance":
      default:
        // For relevance, prioritize exact matches, then recent
        orderBy = [{ createdAt: "desc" }];
        break;
    }

    const posts = await prisma.post.findMany({
      where: whereCondition,
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

    return Response.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
