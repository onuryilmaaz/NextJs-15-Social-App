import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { handleApiError, createError } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      throw createError.authentication();
    }

    const q = req.nextUrl.searchParams.get("q") || "";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10");

    if (!q.trim()) {
      return Response.json({ users: [] });
    }

    const searchQuery = q.trim();

    // Simplified user search to avoid timeouts
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: loggedInUser.id } }, // Exclude current user
          {
            OR: [
              {
                displayName: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
              {
                username: {
                  contains: searchQuery,
                  mode: "insensitive",
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        createdAt: true,
        // Simplified follower count without complex aggregation
        _count: {
          select: {
            followers: true,
          },
        },
      },
      orderBy: [
        // Order by creation date for simplicity
        {
          createdAt: "desc",
        },
      ],
      take: Math.min(limit, 20), // Cap at 20 users
    });

    // Format users to match expected UserData interface
    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
      followerCount: user._count.followers,
      isFollowedByUser: false, // Skip this check for performance
    }));

    return Response.json({ users: formattedUsers });
  } catch (error) {
    console.error("Search users error:", error);
    return handleApiError(error);
  }
}
