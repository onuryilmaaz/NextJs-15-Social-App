import { validateRequest } from "@/auth";
import { blockUser, unblockUser, isUserBlocked } from "@/lib/moderation";
import { createError, handleApiError } from "@/lib/errors";

export async function GET(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      throw createError.authentication();
    }

    const blocked = await isUserBlocked(loggedInUser.id, userId);

    return Response.json({ isBlocked: blocked });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      throw createError.authentication();
    }

    if (loggedInUser.id === userId) {
      throw createError.validation("Cannot block yourself");
    }

    await blockUser(loggedInUser.id, userId);

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      throw createError.authentication();
    }

    await unblockUser(loggedInUser.id, userId);

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
