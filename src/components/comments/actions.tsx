"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getCommentDataInclude, PostData } from "@/lib/types";
import { createCommentSchema, CreateCommentValues } from "@/lib/validation";
import { createError } from "@/lib/errors";
import { createNotification, NotificationService } from "@/lib/notifications";
import { NotificationType, ContentType } from "@prisma/client";
import { ModerationService } from "@/lib/moderation";

export async function submitComment({
  post,
  content,
}: {
  post: PostData;
  content: string;
}) {
  const { user } = await validateRequest();

  if (!user) throw createError.authentication();

  const { text, postId } = createCommentSchema.parse({
    text: content,
    postId: post.id,
  });

  const newComment = await prisma.comment.create({
    data: {
      content: text,
      postId: postId,
      userId: user.id,
    },
    include: getCommentDataInclude(user.id),
  });

  // Send notification using the new notification service
  if (post.user.id !== user.id) {
    await createNotification({
      type: NotificationType.COMMENT,
      recipientId: post.user.id,
      issuerId: user.id,
      postId: post.id,
    });
  }

  return newComment;
}

export async function deleteComment(id: string) {
  const { user } = await validateRequest();

  if (!user) throw createError.authentication();

  const comment = await prisma.comment.findUnique({
    where: { id },
  });

  if (!comment) throw createError.notFound("Comment");

  if (comment.userId !== user.id)
    throw createError.authorization("You can only delete your own comments");

  const deletedComment = await prisma.comment.delete({
    where: { id },
    include: getCommentDataInclude(user.id),
  });

  return deletedComment;
}

export async function createComment(
  values: CreateCommentValues,
  postId: string,
) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { content } = createCommentSchema.parse(values);
  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    throw new Error("Post not found");
  }

  // Auto-moderation
  await ModerationService.flagContent(
    ContentType.COMMENT,
    "new-comment", // Will get a real ID after creation
    content,
    user,
  );

  const newComment = await prisma.comment.create({
    data: {
      content,
      postId,
      userId: user.id,
    },
    include: getCommentDataInclude(user.id),
  });

  if (user.id !== post.userId) {
    await NotificationService.create({
      type: NotificationType.COMMENT,
      recipientId: post.userId,
      issuerId: user.id,
      postId,
      commentId: newComment.id,
    });
  }

  // Check for mentions and notify users
  const mentions = content.match(/@(\w+)/g);
  if (mentions) {
    const usernames = mentions.map((m) => m.substring(1));
    const mentionedUsers = await prisma.user.findMany({
      where: {
        username: { in: usernames },
        id: { not: user.id }, // Don't notify self
      },
    });

    await NotificationService.createBulk({
      type: NotificationType.MENTION,
      recipientIds: mentionedUsers.map((u) => u.id),
      issuerId: user.id,
      postId,
      commentId: newComment.id,
    });
  }

  return newComment;
}
