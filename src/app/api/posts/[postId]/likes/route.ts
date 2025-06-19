import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { LikeInfo } from "@/lib/types";
import { handleApiError, createError } from "@/lib/errors";
import {
  createNotification,
  deleteRelatedNotifications,
} from "@/lib/notifications";
import { NotificationType } from "@prisma/client";

export async function GET(
  req: Request,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      throw createError.authentication();
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        likes: {
          where: {
            userId: loggedInUser.id,
          },
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    if (!post) {
      throw createError.notFound("Post");
    }

    const data: LikeInfo = {
      likes: post._count.likes,
      isLikedByUser: !!post.likes.length,
    };

    return Response.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: Request,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      throw createError.authentication();
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!post) {
      throw createError.notFound("Post");
    }

    await prisma.like.upsert({
      where: {
        userId_postId: {
          userId: loggedInUser.id,
          postId,
        },
      },
      create: {
        userId: loggedInUser.id,
        postId,
      },
      update: {},
    });

    // Send notification using the new notification service
    if (loggedInUser.id !== post.userId) {
      await createNotification({
        type: NotificationType.LIKE,
        recipientId: post.userId,
        issuerId: loggedInUser.id,
        postId,
      });
    }

    return new Response();
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      throw createError.authentication();
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        userId: true,
      },
    });

    if (!post) {
      throw createError.notFound("Post");
    }

    await prisma.like.deleteMany({
      where: {
        userId: loggedInUser.id,
        postId,
      },
    });

    // Delete related notifications using the new notification service
    await deleteRelatedNotifications({
      type: NotificationType.LIKE,
      recipientId: post.userId,
      issuerId: loggedInUser.id,
      postId,
    });

    return new Response();
  } catch (error) {
    return handleApiError(error);
  }
}
