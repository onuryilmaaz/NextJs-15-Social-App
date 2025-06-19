import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
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
      select: getUserDataSelect(loggedInUser.id),
      orderBy: [
        // Then by followers count
        {
          followers: {
            _count: "desc",
          },
        },
        // Finally by creation date
        {
          createdAt: "desc",
        },
      ],
      take: Math.min(limit, 20), // Cap at 20 users
    });

    return Response.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
