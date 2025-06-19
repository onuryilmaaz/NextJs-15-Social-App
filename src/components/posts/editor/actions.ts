"use server";

import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { createPostSchema, CreatePostValues } from "@/lib/validation";
import { nanoid } from "nanoid";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MediaAttachment } from "@prisma/client";
import { ModerationService } from "@/lib/moderation";
import { ContentType } from "@prisma/client";

const s3Client = new S3Client({
  // ... existing code ...
});

export async function submitPost(input: {
  content: string;
  mediaIds: string[];
}) {
  const { user } = await validateRequest();

  if (!user) throw new Error("Unauthorized");

  const { content, mediaIds } = createPostSchema.parse(input);

  const newPost = await prisma.post.create({
    data: {
      content,
      userId: user.id,
      mediaAttachments: {
        connect: mediaIds.map((id) => ({ id })),
      },
    },
    include: getPostDataInclude(user.id),
  });

  return newPost;
}

export async function createPost(values: CreatePostValues) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { content, mediaAttachments } = createPostSchema.parse(values);

  // Auto-moderation
  await ModerationService.flagContent(
    ContentType.POST,
    nanoid(),
    content,
    user,
  );

  const newPost = await prisma.post.create({
    data: {
      content,
      userId: user.id,
      mediaAttachments: mediaAttachments
        ? {
            create: mediaAttachments.map((media) => ({
              id: media.id,
              url: media.url,
              type: media.type,
            })),
          }
        : undefined,
    },
    include: {
      user: true,
      mediaAttachments: true,
    },
  });

  return newPost;
}

export async function updatePost(postId: string, content: string) {
  const { user } = await validateRequest();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error("Post not found");
  }

  if (post.userId !== user.id) {
    throw new Error("Forbidden");
  }

  // Auto-moderation on update
  await ModerationService.flagContent(ContentType.POST, postId, content, user);

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      content,
      editedAt: new Date(),
    },
    include: {
      user: true,
      mediaAttachments: true,
    },
  });

  return updatedPost;
}
