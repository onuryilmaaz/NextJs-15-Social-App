import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude } from "@/lib/types";
import { updatePostSchema } from "@/lib/validation";
import { handleApiError, createError } from "@/lib/errors";

export async function PATCH(
  req: Request,
  { params: { postId } }: { params: { postId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      throw createError.authentication();
    }

    const body = await req.json();
    const { content } = updatePostSchema.parse(body);

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true },
    });

    if (!existingPost) {
      throw createError.notFound("Post");
    }

    if (existingPost.userId !== user.id) {
      throw createError.authorization("You can only edit your own posts");
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { content },
      include: getPostDataInclude(user.id),
    });

    return Response.json(updatedPost);
  } catch (error) {
    return handleApiError(error);
  }
}
