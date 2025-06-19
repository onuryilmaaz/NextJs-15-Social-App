import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { createUploadthing, FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

const f = createUploadthing();

export const fileRouter = {
  avatar: f({
    image: { maxFileSize: "512KB" },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");

      return { user };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const oldAvatarUrl = metadata.user.avatarUrl;

      if (oldAvatarUrl) {
        const urlParts = oldAvatarUrl.split("/");
        const key = urlParts[urlParts.length - 1];
        await new UTApi().deleteFiles(key);
      }

      const newAvatarUrl = file.url;

      await Promise.all([
        prisma.user.update({
          where: { id: metadata.user.id },
          data: {
            avatarUrl: newAvatarUrl,
          },
        }),
        streamServerClient.partialUpdateUser({
          id: metadata.user.id,
          set: {
            image: newAvatarUrl,
          },
        }),
      ]);

      return { avatarUrl: newAvatarUrl };
    }),
  attachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    video: { maxFileSize: "64MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const { user } = await validateRequest();

      if (!user) throw new UploadThingError("Unauthorized");

      return {};
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload completed in server:", {
        url: file.url,
        type: file.type,
      });

      try {
        const media = await prisma.mediaAttachment.create({
          data: {
            url: file.url,
            type: file.type.startsWith("image") ? "IMAGE" : "VIDEO",
          },
        });

        console.log("Media created in database:", media.id);
        return { mediaId: media.id };
      } catch (error) {
        console.error("Error creating media in database:", error);
        throw error;
      }
    }),
} satisfies FileRouter;

export type AppFileRouter = typeof fileRouter;
