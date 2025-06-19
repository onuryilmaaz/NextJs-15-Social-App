import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
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

    // Only allow users to see their own likes
    if (loggedInUser.id !== userId) {
      throw createError.authorization("You can only view your own liked posts");
    }

    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    const likes = await prisma.like.findMany({
      where: {
        userId: userId,
      },
      include: {
        post: {
          include: getPostDataInclude(loggedInUser.id),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: pageSize + 1,
      cursor: cursor
        ? { userId_postId: { userId, postId: cursor } }
        : undefined,
    });

    const nextCursor = likes.length > pageSize ? likes[pageSize].postId : null;

    const data: PostsPage = {
      posts: likes.slice(0, pageSize).map((like) => like.post),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
