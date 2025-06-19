"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { updatePostSchema, UpdatePostValues } from "@/lib/validation";
import { createError } from "@/lib/errors";
import {
  createNotification,
  deleteRelatedNotifications,
} from "@/lib/notifications";
import { NotificationType } from "@prisma/client";
import { RealtimeActivityService } from "@/lib/realtime-activity";

export async function deletePost(id: string) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const post = await prisma.post.findUnique({
    where: { id },
  });

  if (!post) throw new Error("Post not found");

  if (post.userId !== user.id) throw new Error("Unauthorized");

  const deletedPost = await prisma.post.delete({
    where: { id },
    include: getPostDataInclude(user.id),
  });

  return deletedPost;
}

export async function updatePost(id: string, values: UpdatePostValues) {
  const { user } = await validateRequest();

  if (!user) throw createError.authentication();

  const { content } = updatePostSchema.parse(values);

  const existingPost = await prisma.post.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!existingPost) throw createError.notFound("Post");

  if (existingPost.userId !== user.id) {
    throw createError.authorization("You can only edit your own posts");
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: { content, editedAt: new Date() },
    include: getPostDataInclude(user.id),
  });

  // Track real-time activity
  await RealtimeActivityService.trackEdit(user.id, id);

  return updatedPost;
}
