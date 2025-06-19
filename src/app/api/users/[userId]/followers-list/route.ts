import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect, FollowersPage } from "@/lib/types";
import { handleApiError, createError } from "@/lib/errors";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      throw createError.authentication();
    }

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    const followers = await prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
          select: getUserDataSelect(loggedInUser.id),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: pageSize + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    const nextCursor = followers.length > pageSize ? followers[pageSize].id : null;

    const data: FollowersPage = {
      followers: followers.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    return handleApiError(error);
  }
} 